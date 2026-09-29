// Calls the real Claude API server-side. The API key NEVER reaches the
// browser -- only this backend code ever sees it, read from .env.
async function askAssistant(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: 'question is too long (max 1000 characters)' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        system: 'Your name is Mavuno (Swahili for harvest), the friendly farm assistant inside the Farm Records app. You are a helpful agricultural assistant for small and large-scale farmers. Give clear, practical, safe advice about crops, pests, livestock, soil, and farm management. Keep answers concise and actionable. For a serious livestock illness or major crop disease outbreak, recommend contacting a local veterinarian or agricultural extension officer rather than relying only on this advice.',
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errBody);
      return res.status(502).json({ error: 'The assistant is temporarily unavailable' });
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
    res.json({ answer });
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Something went wrong reaching the assistant' });
  }
}

module.exports = { askAssistant };
