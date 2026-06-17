// api/texture.js — generates a seamless, tileable terrain texture from a text prompt
// using Google Gemini 2.5 Flash Image ("Nano Banana"). Reuses the same GEMINI_API_KEY
// the sprite tool uses (Vercel → creapz → Settings → Environment Variables).
const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};
    const { prompt, style } = body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const full = `A seamless, fully tileable repeating TEXTURE / surface material of: ${prompt}. `
      + `Flat 2D side-scrolling video-game art, stylized and painterly, evenly lit with no strong directional shadows, `
      + `filling the entire frame edge to edge as a repeating material. No scene, no horizon, no sky, no characters, no objects — just the surface itself.`
      + (style ? ` Overall art style: ${style}.` : '');

    const payload = {
      contents: [{ role: 'user', parts: [{ text: full }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } }
    };

    const r = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: (j.error && j.error.message) || 'Gemini API error' });

    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const img = parts.find(p => p.inlineData && p.inlineData.data);
    if (!img) return res.status(502).json({ error: 'Model returned no image' });
    return res.status(200).json({ imageBase64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
