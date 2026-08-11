import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data State
let concepts = {};

// Fetch Concepts from Supabase
const fetchConcepts = async () => {
  try {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Convert array to object mapped by id for easier lookup
    if (data) {
      concepts = data.reduce((acc, concept) => {
        acc[concept.id] = concept;
        return acc;
      }, {});
    }

    return data;
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return [];
  }
};

// Templates
const renderHome = () => `
  <div class="content-wrapper">
    <div class="page-header">
      <h1>Welcome to Paladins Pass Concept</h1>
      <p class="page-description">A complete playbook of American football offensive passing concepts.</p>
    </div>
    <div class="concept-explanation">
      <p>Select a concept from the sidebar to view its details, or add a new one.</p>
    </div>
  </div>
`;

const renderConceptDetail = (conceptKey) => {
  const concept = concepts[conceptKey];
  if (!concept) return renderHome();

  const renderImages = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return `<div class="image-placeholder">No images available</div>`;
    }
    return images.map(img => `
      <div class="image-placeholder">${img}</div>
    `).join('');
  };

  // Safe fallback for images during phase 2 where they aren't stored in DB yet
  const explanationImages = concept.explanationImages || ['Explanation Image 1 Placeholder', 'Explanation Image 2 Placeholder'];
  const exampleImages = concept.exampleImages || ['Example Image 1 Placeholder', 'Example Image 2 Placeholder'];

  return `
    <div class="content-wrapper">
      <div class="page-header">
        <h1>${concept.title}</h1>
      </div>
      <div class="concept-explanation">
        <p>${concept.explanation}</p>
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">Concept Explanation</h2>
      <div class="image-gallery">
        ${renderImages(explanationImages)}
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">Examples</h2>
      <div class="image-gallery">
        ${renderImages(exampleImages)}
      </div>
    </div>
  `;
};

const renderAddConcept = () => `
  <div class="content-wrapper">
    <div class="page-header">
      <h1>Add New Concept</h1>
      <p class="page-description">Create a new offensive passing concept for the playbook.</p>
    </div>

    <form id="add-concept-form">
      <div class="form-group">
        <label for="concept-name">Concept Name</label>
        <input type="text" id="concept-name" class="form-control" placeholder="e.g. Verticals" required>
      </div>

      <div class="form-group">
        <label for="concept-explanation">Explanation</label>
        <textarea id="concept-explanation" class="form-control" placeholder="Describe the concept..." required></textarea>
      </div>

      <div class="form-group">
        <label>Explanation Images</label>
        <div class="file-upload-area">
          Click to upload explanation images (UI Only)
        </div>
      </div>

      <div class="form-group">
        <label>Example Images</label>
        <div class="file-upload-area">
          Click to upload example images (UI Only)
        </div>
      </div>

      <button type="submit" class="btn-primary">Save Concept</button>
    </form>
  </div>
`;

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

const setView = (view, data = null) => {
  if (view === 'home') {
    mainContent.innerHTML = renderHome();
  } else if (view === 'concept') {
    mainContent.innerHTML = renderConceptDetail(data);
  } else if (view === 'add') {
    mainContent.innerHTML = renderAddConcept();
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

// Event Listeners
document.getElementById('concept-list').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const conceptKey = e.target.dataset.concept;
    updateActiveNav(conceptKey);
    setView('concept', conceptKey);
  }
});

document.getElementById('add-concept-btn').addEventListener('click', () => {
  updateActiveNav(null);
  setView('add');

  // Attach form listener after rendering Add Concept view
  const form = document.getElementById('add-concept-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Form submitted! (UI only, data not saved)');
    });
  }
});

// Initialize App
const initApp = async () => {
  const data = await fetchConcepts();
  renderSidebar(data);
  setView('home');
};

// Initial Render
initApp();
