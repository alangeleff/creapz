// api/texture.js — texture + fringe generation.
//   mode 'texture' (default): a seamless tileable surface material.
//   mode 'fringe': a transparent-topped edge strip (grass blades / mossy rim / rocky teeth)
//                  — base image from Gemini or FLUX, then fal background-removal for the alpha.
// Backends chosen by `model`: 'gemini' (GEMINI_API_KEY) or 'fal' (FAL_KEY).
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FAL_FLUX = 'https://fal.run/fal-ai/flux/dev';
const FAL_REMBG = 'https://fal.run/fal-ai/imageutils/rembg';

function texturePrompt(prompt, style) {
  return `A seamless, fully tileable repeating TEXTURE / surface material of: ${prompt}. `
    + `Flat 2D side-scrolling video-game art, stylized and painterly, evenly lit with no strong directional shadows, `
    + `filling the entire frame edge to edge as a repeating material. No scene, no horizon, no sky, no characters, no objects — just the surface itself.`
    + (style ? ` Overall art style: ${style}.` : '');
}
function fringePrompt(prompt, style) {
  return `A horizontal border/edge row of: ${prompt}, for a 2D side-scrolling video game. `
    + `The ${prompt} occupies the LOWER ~55% of the frame with detailed organic tips pointing straight UP; `
    + `the rest is plain flat solid white empty space (it will be cut out). Centered, repeats left-to-right, `
    + `flat even lighting, no shadows, no ground line, no scene, no characters.`
    + (style ? ` Art style: ${style}.` : '');
}

async function genGemini(full) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { err: 'GEMINI_API_KEY is not set on the server' };
  const payload = { contents: [{ role: 'user', parts: [{ text: full }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } };
  const r = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
  const r = await fetch(FAL_FLUX, { method: 'POST',
    headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: full, image_size: 'square_hd', num_images: 1, enable_safety_checker: true }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.detail && (j.detail.message || JSON.stringify(j.detail))) || 'fal API error', status: r.status };
  const url = j.images && j.images[0] && j.images[0].url;
  if (!url) return { err: 'fal returned no image', status: 502 };
  const ir = await fetch(url); if (!ir.ok) return { err: 'could not fetch fal image', status: 502 };
  const ab = await ir.arrayBuffer();
  return { imageBase64: Buffer.from(ab).toString('base64'), mimeType: ir.headers.get('content-type') || 'image/png' };
}
// remove background -> transparent PNG (needs FAL_KEY); accepts a data URI
async function falRembg(dataUri) {
  const key = process.env.FAL_KEY;
  if (!key) return { err: 'FAL_KEY is not set (needed for fringe transparency)' };
  const r = await fetch(FAL_REMBG, { method: 'POST',
    headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: dataUri }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.detail && (j.detail.message || JSON.stringify(j.detail))) || 'rembg error', status: r.status };
  const url = j.image && j.image.url;
  if (!url) return { err: 'rembg returned no image', status: 502 };
  const ir = await fetch(url); if (!ir.ok) return { err: 'could not fetch cutout', status: 502 };
  const ab = await ir.arrayBuffer();
  return { imageBase64: Buffer.from(ab).toString('base64'), mimeType: 'image/png' };
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
    const mode = (body.mode === 'fringe') ? 'fringe' : 'texture';
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    if (mode === 'fringe') {
      const full = fringePrompt(prompt, style);
      const base = model === 'fal' ? await genFal(full) : await genGemini(full);
      if (base.err) return res.status(base.status || 500).json({ error: base.err, model, mode });
      const dataUri = 'data:' + (base.mimeType || 'image/png') + ';base64,' + base.imageBase64;
      const cut = await falRembg(dataUri);
      if (cut.err) return res.status(cut.status || 500).json({ error: cut.err, model, mode });
      return res.status(200).json({ imageBase64: cut.imageBase64, mimeType: 'image/png', model, mode });
    }

    const full = texturePrompt(prompt, style);
    const out = model === 'fal' ? await genFal(full) : await genGemini(full);
    if (out.err) return res.status(out.status || 500).json({ error: out.err, model });
    return res.status(200).json({ imageBase64: out.imageBase64, mimeType: out.mimeType, model, mode });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
