// api/genframe.js — Vercel serverless function (Node 18+)
// Generates ONE sprite frame from a reference image + a pose prompt using
// Google's Gemini 2.5 Flash Image ("Nano Banana"). The browser orchestrates
// the per-frame loop + validation; this endpoint stays fast and stateless.
//
// Required env var (set in Vercel → creapz project → Settings → Environment Variables):
//   GEMINI_API_KEY = <your Google AI Studio key>

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

module.exports = async (req, res) => {
  // Allow the tool to call this even if it's served through a proxy/rewrite.
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
    const { imageBase64, mimeType = 'image/png', images, prompt } = body;

    // Accept either a single reference (imageBase64) or an ordered array (images:[{data,mimeType}])
    let refs = [];
    if (Array.isArray(images) && images.length) {
      refs = images.filter(im => im && im.data).map(im => ({ mimeType: im.mimeType || 'image/png', data: im.data }));
    } else if (imageBase64) {
      refs = [{ mimeType, data: imageBase64 }];
    }
    if (!refs.length || !prompt) {
      return res.status(400).json({ error: 'Body must include a reference image (imageBase64 or images[]) and prompt.' });
    }

    const reqParts = refs.map(im => ({ inlineData: { mimeType: im.mimeType, data: im.data } }));
    reqParts.push({ text: prompt });
    const payload = {
      contents: [{ role: 'user', parts: reqParts }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    const r = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: (j.error && j.error.message) || 'Gemini API error', status: r.status });
    }

    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const img = parts.find(p => p.inlineData && p.inlineData.data);
    if (!img) return res.status(502).json({ error: 'Model returned no image', detail: j });

    return res.status(200).json({
      imageBase64: img.inlineData.data,
      mimeType: img.inlineData.mimeType || 'image/png'
    });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
