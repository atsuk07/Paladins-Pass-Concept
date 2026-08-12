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

  // Attach form listener after rendering Add Concept view
  const form = document.getElementById('add-concept-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('concept-name').value.trim();
      const explanation = document.getElementById('concept-explanation').value.trim();

      if (!title || !explanation) {
        alert('コンセプト名と解説を入力してください。');
        return;
      }

      const newId = crypto.randomUUID();

      try {
        const { error } = await supabase.rpc('add_concept', {
          p_passphrase: currentPassphrase,
          p_id: newId,
          p_title: title,
          p_explanation: explanation
        });

        if (error) throw error;

        alert('新しいコンセプトが保存されました！');

        // Refresh concepts list
        const updatedData = await fetchConcepts();
        renderSidebar(updatedData);

        // View new concept
        updateActiveNav(newId);
        setView('concept', newId);

      } catch (error) {
        console.error('コンセプトの保存中にエラーが発生しました:', error);
        alert('コンセプトの保存に失敗しました。');
      }
    });
  }
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
