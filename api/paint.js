// api/paint.js — layout-guided painting with a high-resolution Gemini image model.
// The prompt goes to the model as written (no sprite/magenta wrapper), so it suits maps and room paintings.
// Body: { prompt, image?: dataURL (layout guide), refs?: [dataURL] (style references, max 2),
//         aspectRatio?: '1:1' | '4:3' | '16:9' | ..., size?: '1K' | '2K' | '4K', model?: 'pro' | 'flash',
//         format?: 'webp' | 'jpeg' | 'png', quality?: 40-100 }
// Returns { imageBase64, mimeType, width, height, model }. Output is re-encoded on the server so 2K/4K
// paintings stay under the function response limit.
const sharp = require('sharp');

const MODELS = {
  pro: ['gemini-3-pro-image-preview', 'gemini-3-pro-image'],
  flash: ['gemini-3.1-flash-image-preview', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'],
};
const ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const SIZES = ['1K', '2K', '4K'];

function inline(uri) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(uri || '');
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}

async function callGemini(model, key, parts, imageConfig) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.error && j.error.message) || `Gemini error ${r.status}`, status: r.status };
  const out = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).find((p) => p.inlineData && p.inlineData.data);
  if (!out) return { err: 'Gemini returned no image', status: 502 };
  return { data: out.inlineData.data };
}

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
    body = body || {};
    if (!body.prompt) return res.status(400).json({ error: 'prompt required' });
    const parts = [];
    const guide = inline(body.image); if (guide) parts.push(guide);
    (Array.isArray(body.refs) ? body.refs : []).slice(0, 2).map(inline).filter(Boolean).forEach((p) => parts.push(p));
    parts.push({ text: String(body.prompt) });
    const imageConfig = { aspectRatio: ASPECTS.includes(body.aspectRatio) ? body.aspectRatio : '1:1' };
    const size = SIZES.includes(body.size) ? body.size : '2K';
    if (size !== '1K') imageConfig.imageSize = size;
    const list = MODELS[body.model === 'flash' ? 'flash' : 'pro'];
    let got = null, last = null, used = null;
    for (const m of list) {
      const r = await callGemini(m, key, parts, imageConfig);
      if (r.data) { got = r; used = m; break; }
      last = r;
      if (!(r.status === 404 || /not found|not supported|unknown name/i.test(r.err || ''))) break;   /* only fall through when the model name is unavailable */
    }
    if (!got) return res.status((last && last.status) || 500).json({ error: (last && last.err) || 'no image' });
    const buf = Buffer.from(got.data, 'base64');
    const fmt = ['webp', 'jpeg', 'png'].includes(body.format) ? body.format : 'webp';
    const q = Math.max(40, Math.min(100, +body.quality || 88));
    const img = sharp(buf); const meta = await img.metadata();
    const outBuf = fmt === 'png' ? await img.png({ compressionLevel: 9 }).toBuffer() : fmt === 'jpeg' ? await img.jpeg({ quality: q, mozjpeg: true }).toBuffer() : await img.webp({ quality: q }).toBuffer();
    return res.status(200).json({ imageBase64: outBuf.toString('base64'), mimeType: 'image/' + fmt, width: meta.width, height: meta.height, model: used, size });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
