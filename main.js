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
    return images.map(img => `
      <div class="image-placeholder">${img}</div>
    `).join('');
  };

  // Safe fallback for images during phase 2 where they aren't stored in DB yet
  const explanationImages = concept.explanationImages || ['解説画像 1 プレースホルダー', '解説画像 2 プレースホルダー'];
  const exampleImages = concept.exampleImages || ['例の画像 1 プレースホルダー', '例の画像 2 プレースホルダー'];

  return `
    <div class="content-wrapper">
      <div class="page-header">
        <h1>${concept.title}</h1>
      </div>
      <div class="concept-explanation">
        <p>${concept.explanation}</p>
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">コンセプトの解説</h2>
      <div class="image-gallery">
        ${renderImages(explanationImages)}
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">例</h2>
      <div class="image-gallery">
        ${renderImages(exampleImages)}
      </div>
    </div>
  `;
};

const renderAddConcept = () => `
  <div class="content-wrapper">
    <div class="page-header">
      <h1>新しいコンセプトを追加</h1>
      <p class="page-description">プレイブック用の新しいオフェンスパスコンセプトを作成します。</p>
    </div>

    <form id="add-concept-form">
      <div class="form-group">
        <label for="concept-name">コンセプト名</label>
        <input type="text" id="concept-name" class="form-control" placeholder="例: Verticals" required>
      </div>

      <div class="form-group">
        <label for="concept-explanation">解説</label>
        <textarea id="concept-explanation" class="form-control" placeholder="コンセプトを説明してください..." required></textarea>
      </div>

      <div class="form-group">
        <label>解説画像</label>
        <div class="file-upload-area">
          クリックして解説画像をアップロード (UIのみ)
        </div>
      </div>

      <div class="form-group">
        <label>例の画像</label>
        <div class="file-upload-area">
          クリックして例の画像をアップロード (UIのみ)
        </div>
      </div>

      <button type="submit" class="btn-primary">コンセプトを保存</button>
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
      alert('フォームが送信されました！ (UIのみ、データは保存されていません)');
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
