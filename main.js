// Static Data
const concepts = {
  smash: {
    title: 'Smash Concept',
    explanation: 'The Smash concept is a high-low read on the outside. It typically consists of an outside receiver running a short hitch or curl route, and an inside receiver (or tight end) running a deeper corner route. This stresses the cornerback in a Cover 2 defense, forcing them to choose between coming up to cover the short route or dropping back to cover the corner route.',
    explanationImages: ['Explanation Image 1 Placeholder', 'Explanation Image 2 Placeholder'],
    exampleImages: ['Example Image 1 Placeholder', 'Example Image 2 Placeholder', 'Example Image 3 Placeholder']
  },
  mesh: {
    title: 'Mesh Concept',
    explanation: 'The Mesh concept involves two receivers crossing paths at a shallow depth across the middle of the field. This creates a natural rub or pick, which is highly effective against man coverage. Against zone coverage, the crossing receivers look for open voids to settle into.',
    explanationImages: ['Explanation Image 1 Placeholder', 'Explanation Image 2 Placeholder'],
    exampleImages: ['Example Image 1 Placeholder', 'Example Image 2 Placeholder']
  },
  stick: {
    title: 'Stick Concept',
    explanation: 'The Stick concept is a quick passing game staple. It typically features an outside receiver running a vertical clear-out route, an inside receiver running a quick out or arrow route to the flat, and a third receiver (often a tight end) running the "stick" route—a short route where they turn and sit in the open zone, usually at 5-6 yards.',
    explanationImages: ['Explanation Image 1 Placeholder', 'Explanation Image 2 Placeholder'],
    exampleImages: ['Example Image 1 Placeholder', 'Example Image 2 Placeholder', 'Example Image 3 Placeholder']
  },
  flood: {
    title: 'Flood Concept',
    explanation: 'The Flood concept is designed to overload one side of the defense\'s zones by placing three receivers at three different depths: deep, intermediate, and short. This creates a vertical stretch on the sideline defenders. A common variation is the "Sail" concept, featuring a go route, a deep out or corner, and a flat route.',
    explanationImages: ['Explanation Image 1 Placeholder', 'Explanation Image 2 Placeholder'],
    exampleImages: ['Example Image 1 Placeholder', 'Example Image 2 Placeholder']
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

  const renderImages = (images) => images.map(img => `
    <div class="image-placeholder">${img}</div>
  `).join('');

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
        ${renderImages(concept.explanationImages)}
      </div>

      <hr class="section-divider" />
      <h2 class="section-title">Examples</h2>
      <div class="image-gallery">
        ${renderImages(concept.exampleImages)}
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

// Initial Render
setView('home');
