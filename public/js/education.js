const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');

if (!token || !userJson) {
  window.location.href = '/index.html';
} else {
  const user = JSON.parse(userJson);
  document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}`;
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadArticles(category) {
  const list = document.getElementById('articleList');
  try {
    const path = category ? `/articles?category=${encodeURIComponent(category)}` : '/articles';
    showLoading(list, 'Loading articles...');
    const articles = await apiRequest(path);

    if (!category) {
      populateCategoryFilter(articles);
    }

    if (articles.length === 0) {
      list.innerHTML = '<p class="empty-state">No articles yet. Be the first to write one below.</p>';
      return;
    }

    list.innerHTML = articles.map(article => `
      <div class="article-card">
        <div class="article-card-header">
          <h3>${escapeHtml(article.title)}</h3>
          ${article.category ? `<span class="badge">${escapeHtml(article.category)}</span>` : ''}
        </div>
        <p class="article-preview">${escapeHtml(article.body.slice(0, 120))}${article.body.length > 120 ? '...' : ''}</p>
        <div class="article-full hidden">${escapeHtml(article.body)}</div>
        <button class="toggle-article-btn" type="button">Read more</button>
      </div>
    `).join('');

    document.querySelectorAll('.toggle-article-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.article-card');
        const preview = card.querySelector('.article-preview');
        const full = card.querySelector('.article-full');
        const isHidden = full.classList.contains('hidden');
        full.classList.toggle('hidden');
        preview.classList.toggle('hidden');
        btn.textContent = isHidden ? 'Show less' : 'Read more';
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

function populateCategoryFilter(articles) {
  const select = document.getElementById('categoryFilter');
  const currentValue = select.value;
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  select.innerHTML = '<option value="">All categories</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  select.value = currentValue;
}

document.getElementById('categoryFilter').addEventListener('change', (e) => {
  loadArticles(e.target.value || null);
});

document.getElementById('addArticleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('articleTitle');
  const categoryInput = document.getElementById('articleCategory');
  const bodyInput = document.getElementById('articleBody');
  const errorEl = document.getElementById('addArticleError');
  errorEl.classList.add('hidden');

  try {
    await apiRequest('/articles', {
      method: 'POST',
      body: JSON.stringify({
        title: titleInput.value,
        category: categoryInput.value || null,
        body: bodyInput.value,
      }),
    });
    titleInput.value = '';
    categoryInput.value = '';
    bodyInput.value = '';
    loadArticles();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

// ---- Chat assistant ----

const chatMessages = document.getElementById('chatMessages');

function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

document.getElementById('assistantForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('assistantQuestion');
  const errorEl = document.getElementById('assistantError');
  const submitBtn = document.getElementById('assistantSubmitBtn');
  const question = input.value.trim();
  if (!question) return;

  errorEl.classList.add('hidden');
  appendMessage('user', question);
  input.value = '';
  submitBtn.disabled = true;

  const thinkingBubble = appendMessage('assistant thinking', ASSISTANT_NAME + ' is thinking...');
  if (window.assistantOrb) window.assistantOrb.setThinking(true);

  try {
    const data = await apiRequest('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
    thinkingBubble.textContent = data.answer;
    thinkingBubble.classList.remove('thinking');
  } catch (err) {
    thinkingBubble.remove();
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    if (window.assistantOrb) window.assistantOrb.setThinking(false);
  }
});

loadArticles();

// ---- Assistant name ----
// To rename the assistant, change it here (what farmers see) AND in
// src/controllers/assistantController.js (what the AI calls itself).
const ASSISTANT_NAME = 'Mavuno';
document.getElementById('assistantTitle').textContent = `Ask ${ASSISTANT_NAME}`;
document.getElementById('assistantQuestion').placeholder = `Ask ${ASSISTANT_NAME} anything about your farm...`;
appendMessage('assistant', `Habari! I'm ${ASSISTANT_NAME}, your farm assistant. Ask me about pests, crop diseases, livestock, or anything happening on your farm.`);
