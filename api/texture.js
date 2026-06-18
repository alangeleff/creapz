// api/texture.js — texture + fringe generation.
//   mode 'texture' (default): a seamless tileable surface material.
//   mode 'fringe': a transparent-topped edge strip (grass blades / mossy rim / rocky teeth)
//                  — base image from Gemini or FLUX, then fal background-removal for the alpha.
// Backends chosen by `model`: 'gemini' (GEMINI_API_KEY) or 'fal' (FAL_KEY).
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FAL_FLUX = 'https://fal.run/fal-ai/flux/dev';
const FAL_REMBG = 'https://fal.run/fal-ai/imageutils/rembg';
const FAL_UPSCALE = 'https://fal.run/fal-ai/aura-sr';

function objectPrompt(prompt, style){ return `A single ${prompt}, centered and complete, filling most of the frame as ONE game prop. The ENTIRE background is pure solid magenta #FF00FF (rgb 255,0,255); the ${prompt} contains NO magenta/pink/purple. 2D side-scrolling video-game art, stylized, flat even lighting, no shadow, no ground, no scene, no text.`+(style?` Art style: ${style}.`:''); }
function singleI2IPrompt(prompt, style){ return `The image is a WHITE silhouette on a BLACK background. Repaint the white silhouette as: ${prompt} — a single detailed ${prompt} that completely FILLS the silhouette edge-to-edge and exactly matches its shape (the silhouette IS the object's outline). The ${prompt} must reach ALL the way to the white silhouette boundary with NO black gap or border between the object and the silhouette edge. Keep the area OUTSIDE the silhouette pure black. 2D side-scrolling game art, flat even lighting, no scene, no ground, no extra objects, no text.`+(style?` Art style: ${style}.`:''); }
function singlePrompt(prompt, style) {
  return `A single complete ${prompt} as ONE image filling the entire frame edge to edge, 2D side-scrolling video-game art, stylized and painterly, centered and filling the frame. This is a single object/scene, NOT a repeating tile or pattern. No UI, no text, no border.`
    + (style ? ` Art style: ${style}.` : '');
}
function texturePrompt(prompt, style) {
  return `A seamless, fully tileable repeating TEXTURE / surface material of: ${prompt}. `
    + `Flat 2D side-scrolling video-game art, stylized and painterly, evenly lit with no strong directional shadows, `
    + `filling the entire frame edge to edge as a repeating material. No scene, no horizon, no sky, no characters, no objects — just the surface itself.`
    + (style ? ` Overall art style: ${style}.` : '');
}
function fringePrompt(prompt, style) {
  return `A horizontal border/edge row of: ${prompt}, for a 2D side-scrolling video game. `
    + `The ${prompt} fills the LOWER ~60% of the frame, spanning the FULL width edge-to-edge with NO empty gaps on the left or right, reaching the very bottom edge, with detailed organic tips pointing straight UP. `
    + `The ENTIRE background and all empty space (top and between the tips) is pure solid magenta #FF00FF (rgb 255,0,255). `
    + `The ${prompt} itself must contain NO magenta, pink, or purple. Flat even lighting, no shadows, no ground line, no scene, no characters, repeats left-to-right.`
    + (style ? ` Art style: ${style}.` : '');
}

function fringeI2IPrompt(prompt, style) {
  return `This image: the LOWER portion is a ground/surface material; the UPPER portion is pure solid magenta #FF00FF. `
    + `Transform the TOP edge of the material into: ${prompt} — detailed organic tips/blades made of THAT SAME material, rising UP into the magenta. `
    + `Keep the entire magenta area pure solid magenta #FF00FF and empty. Flat 2D side-scrolling game art, even flat lighting, no shadows, no scene, no characters.`
    + (style ? ` Art style: ${style}.` : '');
}
const FAL_FLUX_I2I = 'https://fal.run/fal-ai/flux/dev/image-to-image';
async function genFalI2I(full, imageDataUri, strength) {
  const key = process.env.FAL_KEY;
  if (!key) return { err: 'FAL_KEY is not set on the server' };
  const r = await fetch(FAL_FLUX_I2I, { method: 'POST',
    headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: full, image_url: imageDataUri, strength: (strength || 0.78), num_images: 1, enable_safety_checker: true }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.detail && (j.detail.message || JSON.stringify(j.detail))) || 'fal i2i error', status: r.status };
  const url = j.images && j.images[0] && j.images[0].url;
  if (!url) return { err: 'fal i2i returned no image', status: 502 };
  const ir = await fetch(url); if (!ir.ok) return { err: 'could not fetch fal image', status: 502 };
  const ab = await ir.arrayBuffer();
  return { imageBase64: Buffer.from(ab).toString('base64'), mimeType: ir.headers.get('content-type') || 'image/png' };
}
async function genGeminiI2I(full, imageDataUri) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { err: 'GEMINI_API_KEY is not set on the server' };
  const mm = /^data:([^;]+);base64,(.*)$/.exec(imageDataUri) || [];
  const mime = mm[1] || 'image/png', data = mm[2] || imageDataUri;
  const payload = { contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data } }, { text: full }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } };
  const r = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.error && j.error.message) || 'Gemini i2i error', status: r.status };
  const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
  const img = parts.find(p => p.inlineData && p.inlineData.data);
  if (!img) return { err: 'Gemini returned no image', status: 502 };
  return { imageBase64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' };
}
async function genGeminiStyled(full, refs) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { err: 'GEMINI_API_KEY is not set on the server' };
  const parts = [];
  for (const rr of refs) { const m = /^data:([^;]+);base64,(.*)$/.exec(rr) || []; if (m[2]) parts.push({ inlineData: { mimeType: m[1] || 'image/png', data: m[2] } }); }
  parts.push({ text: full + ' IMPORTANT: match the ART STYLE of the reference image(s) above — same color palette, shading, linework/outline weight, and level of detail. Keep the established look consistent; do NOT copy their subject, only the style.' });
  const payload = { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } };
  const r = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { err: (j.error && j.error.message) || 'Gemini style error', status: r.status };
  const ps = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
  const img = ps.find(p => p.inlineData && p.inlineData.data);
  if (!img) return { err: 'Gemini returned no image', status: 502 };
  return { imageBase64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' };
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

async function genFalUpscale(imageDataUri){ const key=process.env.FAL_KEY; if(!key) return {err:'FAL_KEY is not set on the server'};
  const r=await fetch(FAL_UPSCALE,{method:'POST',headers:{'Authorization':'Key '+key,'Content-Type':'application/json'},body:JSON.stringify({image_url:imageDataUri, upscaling_factor:2})});
  const j=await r.json().catch(()=>({})); if(!r.ok) return {err:(j.detail&&(j.detail.message||JSON.stringify(j.detail)))||'fal upscale error',status:r.status};
  const url=(j.image&&j.image.url)||(j.images&&j.images[0]&&j.images[0].url); if(!url) return {err:'upscaler returned no image',status:502};
  const ir=await fetch(url); if(!ir.ok) return {err:'could not fetch upscaled image',status:502}; const ab=await ir.arrayBuffer();
  return {imageBase64:Buffer.from(ab).toString('base64'), mimeType:ir.headers.get('content-type')||'image/png'};
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
    const mode = (body.mode === 'fringe') ? 'fringe' : (body.mode === 'object' ? 'object' : (body.mode === 'upscale' ? 'upscale' : 'texture'));
    const styleRefs = Array.isArray(body.styleRefs) ? body.styleRefs.filter(x => typeof x === 'string' && x.length > 100).slice(0, 2) : [];
    if (mode === 'upscale') { if (typeof body.image !== 'string' || body.image.length < 200) return res.status(400).json({ error: 'image required' }); const u = await genFalUpscale(body.image); if (u.err) return res.status(u.status||500).json({ error: u.err, mode }); return res.status(200).json({ imageBase64: u.imageBase64, mimeType: u.mimeType, mode }); }
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    if (mode === 'object') {
      const full = objectPrompt(prompt, style);
      const base = styleRefs.length ? await genGeminiStyled(full, styleRefs) : (model === 'fal' ? await genFal(full) : await genGemini(full));
      if (base.err) return res.status(base.status || 500).json({ error: base.err, model, mode });
      return res.status(200).json({ imageBase64: base.imageBase64, mimeType: base.mimeType || 'image/png', model, mode });
    }
    if (mode === 'fringe') {
      const hasImg = typeof body.image === 'string' && body.image.length > 200;   // composed input (texture bottom + magenta top) => derive blades from the real surface
      let base;
      if (hasImg) { const full = fringeI2IPrompt(prompt, style);
        base = model === 'fal' ? await genFalI2I(full, body.image) : await genGeminiI2I(full, body.image); }
      else { const full = fringePrompt(prompt, style);
        base = styleRefs.length ? await genGeminiStyled(full, styleRefs) : (model === 'fal' ? await genFal(full) : await genGemini(full)); }
      if (base.err) return res.status(base.status || 500).json({ error: base.err, model, mode });
      // returns magenta-background base; the editor chroma-keys it to transparent
      return res.status(200).json({ imageBase64: base.imageBase64, mimeType: base.mimeType || 'image/png', model, mode, i2i: hasImg });
    }

    const single = body.fill === 'single';
    const hasImg = typeof body.image === 'string' && body.image.length > 200;
    let out;
    if (single && hasImg) { const full = singleI2IPrompt(prompt, style); out = model === 'fal' ? await genFalI2I(full, body.image, 0.92) : await genGeminiI2I(full, body.image); }
    else { const full = single ? singlePrompt(prompt, style) : texturePrompt(prompt, style); out = styleRefs.length ? await genGeminiStyled(full, styleRefs) : (model === 'fal' ? await genFal(full) : await genGemini(full)); }
    if (out.err) return res.status(out.status || 500).json({ error: out.err, model });
    return res.status(200).json({ imageBase64: out.imageBase64, mimeType: out.mimeType, model, mode, fill: (single?'single':'pattern'), i2i: (single&&hasImg) });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
