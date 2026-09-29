const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');
const params = new URLSearchParams(window.location.search);
const farmId = params.get('id');

// Escapes text before it goes into innerHTML. This version also escapes
// quotes, which matters now that values are placed inside HTML attributes
// (an unescaped " in a value would break out of value="...").
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// One config object per record type. Rendering, editing and deleting all
// read from this, so adding a new record type later means adding one entry
// here instead of writing three new functions.
const resources = {
  crops: {
    singular: 'crop',
    listId: 'cropList',
    emptyText: 'No crops yet.',
    items: [],
    fields: [
      { key: 'crop_name', label: 'Crop name', type: 'text', required: true },
      { key: 'planting_date', label: 'Planted', type: 'date' },
      { key: 'harvest_date', label: 'Harvest', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['planted', 'growing', 'harvested'] },
    ],
    summary(c) {
      return `
        <strong>${escapeHtml(c.crop_name)}</strong>
        <span class="badge">${escapeHtml(c.status)}</span>
        ${c.planting_date ? `<p>Planted: ${escapeHtml(c.planting_date.slice(0, 10))}</p>` : ''}
        ${c.harvest_date ? `<p>Harvest: ${escapeHtml(c.harvest_date.slice(0, 10))}</p>` : ''}`;
    },
  },
  livestock: {
    singular: 'livestock record',
    listId: 'livestockList',
    emptyText: 'No livestock yet.',
    items: [],
    fields: [
      { key: 'animal_type', label: 'Animal type', type: 'text', required: true },
      { key: 'animal_count', label: 'Count', type: 'number', min: '0' },
      { key: 'health_notes', label: 'Health notes', type: 'text' },
    ],
    summary(a) {
      return `
        <strong>${escapeHtml(a.animal_type)}</strong>
        <span class="badge">${escapeHtml(a.animal_count)}</span>
        ${a.health_notes ? `<p>${escapeHtml(a.health_notes)}</p>` : ''}`;
    },
  },
  transactions: {
    singular: 'transaction',
    listId: 'transactionList',
    emptyText: 'No transactions yet.',
    items: [],
    fields: [
      { key: 'txn_type', label: 'Type', type: 'select', options: ['income', 'expense'] },
      { key: 'amount', label: 'Amount', type: 'number', min: '0', step: '0.01', required: true },
      { key: 'txn_date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    summary(t) {
      const sign = t.txn_type === 'income' ? '+' : '-';
      return `
        <strong class="${t.txn_type === 'income' ? 'income' : 'expense'}">${sign}${parseFloat(t.amount).toLocaleString()}</strong>
        <span class="badge">${escapeHtml(t.txn_type)}</span>
        <p>${escapeHtml(t.txn_date.slice(0, 10))}${t.description ? ' — ' + escapeHtml(t.description) : ''}</p>`;
    },
  },
};

function resourcePath(type, id) {
  return `/farms/${farmId}/${type}` + (id ? `/${id}` : '');
}

async function loadFarmDetails() {
  try {
    const farm = await apiRequest(`/farms/${farmId}`);
    document.getElementById('farmName').textContent = farm.name;
    document.getElementById('farmMeta').textContent =
      [farm.location, farm.size_hectares ? `${farm.size_hectares} hectares` : null]
        .filter(Boolean).join(' • ') || 'No details set';
  } catch (err) {
    document.getElementById('farmName').textContent = 'Farm not found';
  }
}

function updateBalance(txns) {
  const balanceEl = document.getElementById('balanceSummary');
  // amount arrives from Postgres as a string (the NUMERIC quirk), so
  // parseFloat() is required before doing any math.
  const total = txns.reduce((sum, t) => {
    const amt = parseFloat(t.amount);
    return t.txn_type === 'income' ? sum + amt : sum - amt;
  }, 0);
  balanceEl.textContent = `Balance: ${total >= 0 ? '+' : ''}${total.toLocaleString()}`;
  balanceEl.className = total >= 0 ? 'balance positive' : 'balance negative';
}

function renderResource(type) {
  const res = resources[type];
  const list = document.getElementById(res.listId);
  if (res.items.length === 0) {
    list.innerHTML = `<p class="empty-state">${res.emptyText}</p>`;
    return;
  }
  list.innerHTML = res.items.map(item => `
    <div class="record-card" data-type="${type}" data-id="${item.id}">
      <div class="record-main">${res.summary(item)}</div>
      <span class="record-actions">
        <button type="button" class="link-btn" data-action="edit">Edit</button>
        <button type="button" class="link-btn danger" data-action="delete">Delete</button>
      </span>
    </div>
  `).join('');
}

async function loadResource(type) {
  const res = resources[type];
  try {
    showLoading(document.getElementById(res.listId), 'Loading...');
    res.items = await apiRequest(resourcePath(type));
    if (type === 'transactions') updateBalance(res.items);
    renderResource(type);
  } catch (err) {
    document.getElementById(res.listId).innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

// ---- Edit: swap the card's contents for a small form ----

function fieldValue(item, field) {
  const raw = item[field.key];
  if (raw === null || raw === undefined) return '';
  return field.type === 'date' ? String(raw).slice(0, 10) : String(raw);
}

function fieldInput(item, field) {
  const current = fieldValue(item, field);
  if (field.type === 'select') {
    // If the saved value isn't one of our standard options, keep it
    // selectable rather than silently changing it on save.
    const options = current && !field.options.includes(current)
      ? [current, ...field.options]
      : field.options;
    const optionsHtml = options.map(o =>
      `<option value="${escapeHtml(o)}"${o === current ? ' selected' : ''}>${escapeHtml(o)}</option>`
    ).join('');
    return `<select name="${field.key}">${optionsHtml}</select>`;
  }
  const attrs = [
    field.required ? 'required' : '',
    field.min !== undefined ? `min="${field.min}"` : '',
    field.step ? `step="${field.step}"` : '',
  ].filter(Boolean).join(' ');
  return `<input type="${field.type}" name="${field.key}" value="${escapeHtml(current)}" ${attrs}>`;
}

function startEdit(type, id) {
  const res = resources[type];
  const item = res.items.find(i => String(i.id) === String(id));
  const card = document.querySelector(`.record-card[data-type="${type}"][data-id="${id}"]`);
  if (!item || !card) return;

  const fieldsHtml = res.fields.map(f => `
    <label class="edit-field">
      <span>${escapeHtml(f.label)}</span>
      ${fieldInput(item, f)}
    </label>
  `).join('');

  card.innerHTML = `
    <form class="edit-form">
      ${fieldsHtml}
      <div class="edit-actions">
        <button type="submit">Save</button>
        <button type="button" class="cancel-btn">Cancel</button>
      </div>
      <p class="error hidden"></p>
    </form>`;
}

async function saveEdit(form) {
  const card = form.closest('.record-card');
  const { type, id } = card.dataset;
  const res = resources[type];
  const errorEl = form.querySelector('.error');
  errorEl.classList.add('hidden');

  const body = {};
  res.fields.forEach(f => {
    const value = form.elements[f.key].value;
    if (value === '') {
      // The backend treats null as "leave this field unchanged".
      body[f.key] = null;
    } else {
      body[f.key] = f.type === 'number' ? Number(value) : value;
    }
  });

  try {
    await apiRequest(resourcePath(type, id), { method: 'PUT', body: JSON.stringify(body) });
    await loadResource(type);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

async function deleteRecord(type, id) {
  const res = resources[type];
  if (!confirm(`Delete this ${res.singular}? This cannot be undone.`)) return;
  try {
    await apiRequest(resourcePath(type, id), { method: 'DELETE' });
    await loadResource(type);
  } catch (err) {
    alert(err.message);
  }
}

// One click listener for every Edit / Delete / Cancel button on the page,
// including buttons that don't exist yet. This is called event delegation:
// the list is re-rendered constantly, so attaching listeners to individual
// buttons would mean re-attaching them after every render.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action], .cancel-btn');
  if (!btn) return;
  const card = btn.closest('.record-card');
  if (!card) return;
  const { type, id } = card.dataset;

  if (btn.classList.contains('cancel-btn')) renderResource(type);
  else if (btn.dataset.action === 'edit') startEdit(type, id);
  else if (btn.dataset.action === 'delete') deleteRecord(type, id);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.edit-form');
  if (!form) return;
  e.preventDefault();
  saveEdit(form);
});

// ---- Add forms ----

function wireAddForm(formId, errorId, type, buildBody) {
  const form = document.getElementById(formId);
  const errorEl = document.getElementById(errorId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    try {
      await apiRequest(resourcePath(type), { method: 'POST', body: JSON.stringify(buildBody()) });
      form.reset();
      loadResource(type);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  });
}

wireAddForm('addCropForm', 'addCropError', 'crops', () => ({
  crop_name: document.getElementById('cropName').value,
  planting_date: document.getElementById('cropPlantingDate').value || null,
}));

wireAddForm('addLivestockForm', 'addLivestockError', 'livestock', () => ({
  animal_type: document.getElementById('livestockType').value,
  animal_count: document.getElementById('livestockCount').value
    ? parseInt(document.getElementById('livestockCount').value, 10) : 0,
  health_notes: document.getElementById('livestockNotes').value || null,
}));

wireAddForm('addTransactionForm', 'addTransactionError', 'transactions', () => ({
  txn_type: document.getElementById('txnType').value,
  amount: parseFloat(document.getElementById('txnAmount').value),
  description: document.getElementById('txnDescription').value || null,
}));

// ---- Start-up ----

if (!token || !userJson) {
  window.location.href = '/index.html';
} else if (!farmId) {
  window.location.href = '/dashboard.html';
} else {
  document.getElementById('welcomeMessage').textContent = `Welcome, ${JSON.parse(userJson).name}`;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });
  loadFarmDetails();
  loadResource('crops');
  loadResource('livestock');
  loadResource('transactions');
}
