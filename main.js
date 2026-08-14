import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data State
let concepts = {};
let isAdmin = false;
let currentPassphrase = null;

// Fetch Concepts from Supabase
const fetchConcepts = async () => {
  try {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch photos separately if join fails due to schema cache issues
    let photosData = [];
    try {
      const { data: pData } = await supabase.from('photos').select('*');
      if (pData) photosData = pData;
    } catch (e) {
      console.warn("Could not fetch photos:", e);
    }

    // Convert array to object mapped by id for easier lookup
    if (data) {
      concepts = data.reduce((acc, concept) => {
        concept.photos = photosData.filter(p => p.concept_id === concept.id);
        acc[concept.id] = concept;
        return acc;
      }, {});
    }

    return data;
  } catch (error) {
    console.error("コンセプトの取得中にエラーが発生しました:", error);
    return [];
  }
};

// Templates
const renderHome = () => `
  <div class="content-wrapper">
    <div class="page-header">
      <h1>Paladins Pass Concept へようこそ</h1>
      <p class="page-description">アメリカンフットボールのオフェンスパスコンセプトの完全なプレイブック。</p>
    </div>
    <div class="concept-explanation">
      <p>サイドバーからコンセプトを選択して詳細を表示するか、新しいコンセプトを追加してください。</p>
    </div>
  </div>
`;

const renderConceptDetail = (conceptKey) => {
  const concept = concepts[conceptKey];
  if (!concept) return renderHome();

  const renderImages = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return `<div class="image-placeholder">画像はありません</div>`;
    }
    return images.map(img => {
      if (img.url === '') {
        return `<div class="image-placeholder">${img.caption}</div>`;
      }
      return `
      <div class="image-item" style="position: relative;">
        <img src="${img.url}" alt="${img.caption || 'Concept image'}" class="concept-image" style="max-width: 100%; display: block;" />
      </div>
    `}).join('');
  };

  const explanationPhotos = (concept.photos || []).filter(p => p.image_type === 'explanation');
  const examplePhotos = (concept.photos || []).filter(p => p.image_type === 'example');

  const explanationImagesHtml = explanationPhotos.length > 0
    ? renderImages(explanationPhotos)
    : renderImages([{ url: '', caption: '解説画像 1 プレースホルダー' }]); // Fallback for testing if empty

  const exampleImagesHtml = examplePhotos.length > 0
    ? renderImages(examplePhotos)
    : renderImages([{ url: '', caption: '例の画像 1 プレースホルダー' }]); // Fallback for testing if empty

  const editButtonHTML = isAdmin
    ? `<button id="edit-concept-btn" class="btn-secondary" data-id="${conceptKey}" style="margin-left: auto;">編集 (管理者)</button>`
    : '';

  return `
    <div class="content-wrapper">
      <div class="page-header" style="display: flex; align-items: center;">
        <h1>${concept.title}</h1>
        ${editButtonHTML}
      </div>
      <div class="concept-explanation">
        <p>${concept.explanation}</p>
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">コンセプトの解説</h2>
      <div class="image-gallery">
        ${explanationImagesHtml}
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">例</h2>
      <div class="image-gallery">
        ${exampleImagesHtml}
      </div>
    </div>
  `;
};

const renderAddConcept = (editId = null) => {
  const isEditing = !!editId;
  const concept = isEditing ? concepts[editId] : null;

  const renderExistingPhotos = (type) => {
    if (!isEditing || !concept.photos) return '';
    const photos = concept.photos.filter(p => p.image_type === type);
    if (photos.length === 0) return '';

    return photos.map(photo => `
      <div class="existing-image-item" style="display: inline-block; position: relative; margin-right: 10px; margin-top: 10px;">
        <img src="${photo.url}" style="height: 100px; border-radius: 4px; display: block;" />
        <button type="button" class="btn-delete-photo" data-photo-id="${photo.id}" data-storage-path="${photo.storage_path}" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">×</button>
      </div>
    `).join('');
  };

  return `
  <div class="content-wrapper">
    <div class="page-header">
      <h1>${isEditing ? 'コンセプトを編集' : '新しいコンセプトを追加'}</h1>
      <p class="page-description">${isEditing ? '既存のオフェンスパスコンセプトを更新します。' : 'プレイブック用の新しいオフェンスパスコンセプトを作成します。'}</p>
    </div>

    <form id="add-concept-form" data-edit-id="${isEditing ? editId : ''}">
      <div class="form-group">
        <label for="concept-name">コンセプト名</label>
        <input type="text" id="concept-name" class="form-control" placeholder="例: Verticals" value="${isEditing ? concept.title : ''}" required>
      </div>

      <div class="form-group">
        <label for="concept-explanation">解説</label>
        <textarea id="concept-explanation" class="form-control" placeholder="コンセプトを説明してください..." required>${isEditing ? concept.explanation : ''}</textarea>
      </div>

      <div class="form-group">
        <label>解説画像</label>
        <div id="existing-explanation-images">${renderExistingPhotos('explanation')}</div>
        <div class="file-upload-area" onclick="document.getElementById('explanation-image-upload').click()" style="margin-top: 10px;">
          クリックして新しい解説画像をアップロード
        </div>
        <input type="file" id="explanation-image-upload" accept="image/*" style="display: none;">
        <div id="explanation-image-preview" style="margin-top: 10px;"></div>
      </div>

      <div class="form-group">
        <label>例の画像</label>
        <div id="existing-example-images">${renderExistingPhotos('example')}</div>
        <div class="file-upload-area" onclick="document.getElementById('example-image-upload').click()" style="margin-top: 10px;">
          クリックして新しい例の画像をアップロード
        </div>
        <input type="file" id="example-image-upload" accept="image/*" style="display: none;">
        <div id="example-image-preview" style="margin-top: 10px;"></div>
      </div>

      <button type="submit" class="btn-primary">コンセプトを保存</button>
    </form>
  </div>
`};

// Sidebar Rendering
const renderSidebar = (dataList) => {
  const conceptListEl = document.getElementById('concept-list');
  if (!conceptListEl || !dataList) return;

  conceptListEl.innerHTML = dataList.map(concept => `
    <li><a href="#" data-concept="${concept.id}" class="nav-link">${concept.title}</a></li>
  `).join('');
};

// App State & Rendering
const mainContent = document.getElementById('main-content');

const attachFormListeners = () => {
  const form = document.getElementById('add-concept-form');
  if (!form) return;

  // Handle Image Preview
  const setupPreview = (inputId, previewId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;" />`;
          };
          reader.readAsDataURL(file);
        } else {
          document.getElementById(previewId).innerHTML = '';
        }
      });
    }
  };
  setupPreview('explanation-image-upload', 'explanation-image-preview');
  setupPreview('example-image-upload', 'example-image-preview');

  // Handle Image Deletion
  const deleteButtons = document.querySelectorAll('.btn-delete-photo');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('この画像を削除しますか？')) return;

      const photoId = e.target.getAttribute('data-photo-id');
      const storagePath = e.target.getAttribute('data-storage-path');

      try {
        const { error: dbError } = await supabase.rpc('delete_photo', {
          p_passphrase: currentPassphrase,
          p_id: photoId
        });
        if (dbError) throw dbError;

        if (storagePath) {
          await supabase.storage.from('photos').remove([storagePath]);
        }

        // Remove from DOM immediately
        e.target.parentElement.remove();
        alert('画像が削除されました。');
      } catch (error) {
        console.error('画像削除エラー:', error);
        alert('画像の削除に失敗しました。');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('concept-name').value.trim();
    const explanation = document.getElementById('concept-explanation').value.trim();
    const editId = form.getAttribute('data-edit-id');
    const isEditing = !!editId;

    if (!title || !explanation) {
      alert('コンセプト名と解説を入力してください。');
      return;
    }

    try {
      let conceptId = editId;

      if (isEditing) {
        const { error } = await supabase.rpc('update_concept', {
          p_passphrase: currentPassphrase,
          p_id: editId,
          p_title: title,
          p_explanation: explanation
        });
        if (error) throw error;
      } else {
        conceptId = crypto.randomUUID();
        const { error } = await supabase.rpc('add_concept', {
          p_passphrase: currentPassphrase,
          p_id: conceptId,
          p_title: title,
          p_explanation: explanation
        });
        if (error) throw error;
      }

      // Upload images if any
      const uploadImage = async (inputId, imageType) => {
        const fileInput = document.getElementById(inputId);
        if (!fileInput || !fileInput.files[0]) return;
        const file = fileInput.files[0];

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${conceptId}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
        if (uploadError) {
          console.error('画像アップロードエラー:', uploadError);
          throw new Error(`画像 (${imageType}) のアップロードに失敗しました。`);
        }

        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);

        const { error: insertError } = await supabase.rpc('add_photo', {
          p_passphrase: currentPassphrase,
          p_concept_id: conceptId,
          p_storage_path: filePath,
          p_url: publicUrl,
          p_image_type: imageType,
          p_caption: file.name
        });

        if (insertError) {
          console.error('画像DB保存エラー:', insertError);
          throw new Error(`画像 (${imageType}) のデータベース保存に失敗しました。`);
        }
      };

      await uploadImage('explanation-image-upload', 'explanation');
      await uploadImage('example-image-upload', 'example');

      alert(isEditing ? 'コンセプトが更新されました！' : '新しいコンセプトが保存されました！');

      const updatedData = await fetchConcepts();
      renderSidebar(updatedData);
      updateActiveNav(conceptId);
      setView('concept', conceptId);

    } catch (error) {
      console.error('保存中にエラーが発生しました:', error);
      alert(error.message || '保存に失敗しました。');
    }
  });
};

const setView = (view, data = null) => {
  if (view === 'home') {
    mainContent.innerHTML = renderHome();
  } else if (view === 'concept') {
    mainContent.innerHTML = renderConceptDetail(data);

    // Attach event listener for edit button
    const editBtn = document.getElementById('edit-concept-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        setView('edit', id);
      });
    }
  } else if (view === 'add') {
    mainContent.innerHTML = renderAddConcept();
    attachFormListeners();
  } else if (view === 'edit') {
    mainContent.innerHTML = renderAddConcept(data); // Reusing add form for editing
    attachFormListeners();
  }
};

const updateActiveNav = (activeConceptKey = null) => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.concept === activeConceptKey) {
      link.classList.add('active');
    }
  });
};

const updateAdminUI = () => {
  const addBtn = document.getElementById('add-concept-btn');
  const adminBtn = document.getElementById('admin-mode-btn');
  const exitAdminBtn = document.getElementById('exit-admin-btn');

  if (isAdmin) {
    addBtn.classList.remove('hidden');
    exitAdminBtn.classList.remove('hidden');
    adminBtn.classList.add('hidden');
  } else {
    addBtn.classList.add('hidden');
    exitAdminBtn.classList.add('hidden');
    adminBtn.classList.remove('hidden');

    // If we are on the Add Concept view and lose admin privileges, go home
    if (mainContent.innerHTML.includes('add-concept-form')) {
      setView('home');
    }
  }
};

// Event Listeners
document.getElementById('concept-list').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const conceptKey = e.target.dataset.concept;
    updateActiveNav(conceptKey);
    setView('concept', conceptKey);
  }
});

document.getElementById('admin-mode-btn').addEventListener('click', () => {
  const passphrase = prompt('管理者パスフレーズを入力してください:');
  if (passphrase === 'Paladins') {
    isAdmin = true;
    currentPassphrase = passphrase;
    updateAdminUI();
  } else if (passphrase !== null) {
    alert('パスフレーズが正しくありません。');
  }
});

document.getElementById('exit-admin-btn').addEventListener('click', () => {
  isAdmin = false;
  currentPassphrase = null;
  updateAdminUI();
});

document.getElementById('add-concept-btn').addEventListener('click', () => {
  if (!isAdmin) return;

  updateActiveNav(null);
  setView('add');
});

// Initialize App
const initApp = async () => {
  const data = await fetchConcepts();
  renderSidebar(data);
  updateAdminUI();
  setView('home');
};

// Initial Render
initApp();
