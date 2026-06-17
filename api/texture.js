// api/texture.js — generates a seamless, tileable terrain texture from a text prompt.
// Two backends, chosen by the request's `model` field:
//   'gemini' (default) → Google Gemini 2.5 Flash Image ("Nano Banana"), env GEMINI_API_KEY
//   'fal'              → fal.ai FLUX (flux/dev), env FAL_KEY
// Both return { imageBase64, mimeType, model }.
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux/dev';

function buildPrompt(prompt, style) {
  return `A seamless, fully tileable repeating TEXTURE / surface material of: ${prompt}. `
    + `Flat 2D side-scrolling video-game art, stylized and painterly, evenly lit with no strong directional shadows, `
    + `filling the entire frame edge to edge as a repeating material. No scene, no horizon, no sky, no characters, no objects — just the surface itself.`
    + (style ? ` Overall art style: ${style}.` : '');
}

async function genGemini(full) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { err: 'GEMINI_API_KEY is not set on the server' };
  const payload = {
    contents: [{ role: 'user', parts: [{ text: full }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } }
  };
  const r = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.error && j.error.message) || 'Gemini API error', status: r.status };
  const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
  const img = parts.find(p => p.inlineData && p.inlineData.data);
  if (!img) return { err: 'Gemini returned no image', status: 502 };
  return { imageBase64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' };
}

async function genFal(full) {
  const key = process.env.FAL_KEY;
  if (!key) return { err: 'FAL_KEY is not set on the server' };
  const r = await fetch(FAL_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: full, image_size: 'square_hd', num_images: 1, enable_safety_checker: true })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.detail && (j.detail.message || JSON.stringify(j.detail))) || 'fal API error', status: r.status };
  const url = j.images && j.images[0] && j.images[0].url;
  if (!url) return { err: 'fal returned no image', status: 502 };
  // fal returns a hosted URL; fetch it and convert to base64 so the editor can commit it to the repo.
  const ir = await fetch(url);
  if (!ir.ok) return { err: 'could not fetch fal image', status: 502 };
  const ab = await ir.arrayBuffer();
  const mime = ir.headers.get('content-type') || 'image/png';
  return { imageBase64: Buffer.from(ab).toString('base64'), mimeType: mime };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};
    const { prompt, style } = body;
    const model = (body.model === 'fal') ? 'fal' : 'gemini';
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const full = buildPrompt(prompt, style);
    const out = model === 'fal' ? await genFal(full) : await genGemini(full);
    if (out.err) return res.status(out.status || 500).json({ error: out.err, model });
    return res.status(200).json({ imageBase64: out.imageBase64, mimeType: out.mimeType, model });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
