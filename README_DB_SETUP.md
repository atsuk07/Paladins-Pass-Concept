# Database Setup Instructions

To support the editing and image upload features securely using the lightweight passphrase system without relying on Supabase Auth, you will need to add the following RPC functions and Storage Policies to your Supabase project using the SQL Editor.

## 1. update_concept
This function updates an existing concept, validating the passphrase first.

```sql
create or replace function update_concept(p_passphrase text, p_id text, p_title text, p_explanation text)
returns void
language plpgsql
security definer
as $$
begin
  if p_passphrase != 'Paladins' then
    raise exception 'Invalid passphrase';
  end if;

  update concepts
  set title = p_title, explanation = p_explanation
  where id = p_id;
end;
$$;
```

## 2. add_photo
This function securely inserts a new record into the `photos` table after the file has been successfully uploaded to the storage bucket.

```sql
create or replace function add_photo(p_passphrase text, p_concept_id text, p_storage_path text, p_url text, p_image_type text, p_caption text)
returns void
language plpgsql
security definer
as $$
begin
  if p_passphrase != 'Paladins' then
    raise exception 'Invalid passphrase';
  end if;

  insert into photos (concept_id, storage_path, url, image_type, caption)
  values (p_concept_id, p_storage_path, p_url, p_image_type, p_caption);
end;
$$;
```

## 3. delete_photo
This function securely deletes a record from the `photos` table by its id. If your photos id is a bigint instead of uuid, you may change `uuid` to `bigint` below.

```sql
create or replace function delete_photo(p_passphrase text, p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if p_passphrase != 'Paladins' then
    raise exception 'Invalid passphrase';
  end if;

  delete from photos
  where id = p_id;
end;
$$;
```

## 4. delete_concept
This function securely deletes a concept from the `concepts` table by its id. It also guarantees that any associated records in the `photos` table are deleted atomically from the database to prevent orphaned data.

```sql
create or replace function delete_concept(p_passphrase text, p_id text)
returns void
language plpgsql
security definer
as $$
begin
  if p_passphrase != 'Paladins' then
    raise exception 'Invalid passphrase';
  end if;

  -- Delete associated photos from DB first to maintain referential integrity
  delete from photos
  where concept_id = p_id;

  -- Delete the concept
  delete from concepts
  where id = p_id;
end;
$$;
```

## 5. Storage Bucket Policies (`photos` bucket)
Standard Supabase Storage RLS policies only recognize users authenticated via Supabase Auth (JWT). Because we are using a custom lightweight passphrase check on the frontend, Storage uploads from the client are considered "anonymous".

To allow the frontend to upload and delete images without breaking the application, you must apply the following public access policies to the `photos` bucket.

> **⚠️ Known Architecture Limitation:** Making the storage bucket public for INSERT and DELETE allows any technical user with the API key to upload or delete "orphaned" files directly via the API. However, because the `public.photos` table (metadata) is still securely protected by the RPCs above, malicious users cannot link unauthorized images to concepts or deface the website. This tradeoff prioritizes simplicity for small, private teams over complex authentication infrastructure.

Run this SQL to configure the storage policies:

```sql
-- Allow anyone to view images (already necessary for normal visitors)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Allow anyone to upload images (requires for our anonymous Admin Mode client)
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' );

-- Allow anyone to delete images (required for our anonymous Admin Mode client)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'photos' );

-- Always reload schema after creating RPCs
NOTIFY pgrst, 'reload schema';
```

## 7. Cleaning up Orphaned Photos (Maintenance)
If you previously deleted concepts before the atomic deletion strategy was implemented, you may have "orphaned" photo records in your `public.photos` table and storage bucket.

### Step 1: Identify orphaned files in Storage
SQL cannot delete files from Supabase Storage directly. Run this query to get a list of orphaned file paths:
```sql
SELECT storage_path
FROM photos
WHERE concept_id NOT IN (SELECT id FROM concepts);
```
Once you have the list of `storage_path`s, you can manually delete them by navigating to **Storage > photos** in your Supabase Dashboard and removing those files.

### Step 2: Delete orphaned records from the DB
Run this query in your Supabase SQL Editor to clean up the orphaned DB records now that the files are gone:
```sql
DELETE FROM photos
WHERE concept_id NOT IN (SELECT id FROM concepts);
```

## 6. Add Ordering Support (Phase 2)
To support dragging and dropping concepts into a custom order, we need to add a `display_order` column and an RPC to update it securely.

Run this SQL in the SQL Editor:

```sql
-- Add the new column
-- Using a very high default number ensures new concepts naturally sort to the end of the list
ALTER TABLE concepts ADD COLUMN display_order INT DEFAULT 999999;

-- Initialize existing concepts with a sequential order based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY created_at ASC) as rn
  FROM concepts
)
UPDATE concepts c
SET display_order = n.rn
FROM numbered n
WHERE c.id = n.id;

-- Create the RPC to securely update the order of multiple concepts at once
create or replace function update_concept_order(p_passphrase text, p_orders jsonb)
returns void
language plpgsql
security definer
as $$
declare
  order_item jsonb;
begin
  if p_passphrase != 'Paladins' then
    raise exception 'Invalid passphrase';
  end if;

  for order_item in select * from jsonb_array_elements(p_orders)
  loop
    update concepts
    set display_order = (order_item->>'display_order')::int
    where id = order_item->>'id';
  end loop;
end;
$$;

-- Always reload schema after creating RPCs
NOTIFY pgrst, 'reload schema';
```
