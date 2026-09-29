const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');

let farms = [];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderFarms() {
  const farmList = document.getElementById('farmList');
  if (farms.length === 0) {
    farmList.innerHTML = '<p class="empty-state">No farms yet. Add your first one below.</p>';
    return;
  }
  // The card is a div (not a link) so the Edit/Delete buttons can sit
  // inside it without triggering navigation. Only the top part is a link.
  farmList.innerHTML = farms.map(farm => `
    <div class="farm-card" data-id="${farm.id}">
      <a href="/farm.html?id=${farm.id}" class="farm-link">
        <h3>${escapeHtml(farm.name)}</h3>
        <p>${farm.location ? escapeHtml(farm.location) : 'No location set'}</p>
        <p class="farm-size">${farm.size_hectares ? `${escapeHtml(farm.size_hectares)} hectares` : ''}</p>
      </a>
      <div class="card-actions">
        <button type="button" class="link-btn" data-action="edit">Edit</button>
        <button type="button" class="link-btn danger" data-action="delete">Delete</button>
      </div>
    </div>
  `).join('');
}

async function loadFarms() {
  const farmList = document.getElementById('farmList');
  try {
    showLoading(farmList, 'Loading your farms...');
    farms = await apiRequest('/farms');
    renderFarms();
  } catch (err) {
    farmList.innerHTML = `<p class="error">Could not load farms: ${escapeHtml(err.message)}</p>`;
  }
}

function startEdit(id) {
  const farm = farms.find(f => String(f.id) === String(id));
  const card = document.querySelector(`.farm-card[data-id="${id}"]`);
  if (!farm || !card) return;

  card.innerHTML = `
    <form class="edit-form">
      <label class="edit-field">
        <span>Farm name</span>
        <input type="text" name="name" value="${escapeHtml(farm.name)}" required>
      </label>
      <label class="edit-field">
        <span>Location</span>
        <input type="text" name="location" value="${escapeHtml(farm.location)}">
      </label>
      <label class="edit-field">
        <span>Hectares</span>
        <input type="number" name="size_hectares" value="${escapeHtml(farm.size_hectares)}" step="0.1" min="0">
      </label>
      <div class="edit-actions">
        <button type="submit">Save</button>
        <button type="button" class="cancel-btn">Cancel</button>
      </div>
      <p class="error hidden"></p>
    </form>`;
}

async function saveEdit(form) {
  const card = form.closest('.farm-card');
  const id = card.dataset.id;
  const errorEl = form.querySelector('.error');
  errorEl.classList.add('hidden');

  // The backend treats null as "leave this field unchanged".
  const body = {
    name: form.elements.name.value,
    location: form.elements.location.value || null,
    size_hectares: form.elements.size_hectares.value === ''
      ? null : Number(form.elements.size_hectares.value),
  };

  try {
    await apiRequest(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    await loadFarms();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

async function deleteFarm(id) {
  const farm = farms.find(f => String(f.id) === String(id));
  if (!farm) return;
  // The database is set to ON DELETE CASCADE, so deleting a farm also
  // deletes every crop, livestock record and transaction inside it.
  const message = `Delete "${farm.name}" and ALL its crops, livestock and transactions? This cannot be undone.`;
  if (!confirm(message)) return;
  try {
    await apiRequest(`/farms/${id}`, { method: 'DELETE' });
    await loadFarms();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action], .cancel-btn');
  if (!btn) return;
  const card = btn.closest('.farm-card');
  if (!card) return;
  const id = card.dataset.id;

  if (btn.classList.contains('cancel-btn')) renderFarms();
  else if (btn.dataset.action === 'edit') startEdit(id);
  else if (btn.dataset.action === 'delete') deleteFarm(id);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.edit-form');
  if (!form) return;
  e.preventDefault();
  saveEdit(form);
});

document.getElementById('addFarmForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = document.getElementById('addFarmError');
  errorEl.classList.add('hidden');
  const sizeValue = document.getElementById('farmSize').value;

  try {
    await apiRequest('/farms', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('farmName').value,
        location: document.getElementById('farmLocation').value || null,
        size_hectares: sizeValue ? parseFloat(sizeValue) : null,
      }),
    });
    form.reset();
    loadFarms();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

if (!token || !userJson) {
  window.location.href = '/index.html';
} else {
  document.getElementById('welcomeMessage').textContent = `Welcome, ${JSON.parse(userJson).name}`;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });
  loadFarms();
}
