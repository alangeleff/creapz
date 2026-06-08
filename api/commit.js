// api/commit.js — commits files to the creapz repo via the GitHub Git Data API.
// Lets the in-browser builder permanently save uploaded assets, config, and bench stages.
//
// Required Vercel env vars (creapz project → Settings → Environment Variables):
//   GITHUB_TOKEN  = a GitHub Personal Access Token with contents:read/write on alangeleff/creapz
//   COMMIT_SECRET = a private password (the builder prompts you for it; never stored in page source)

const OWNER = 'alangeleff', REPO = 'creapz', BRANCH = 'main';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token = process.env.GITHUB_TOKEN, secret = process.env.COMMIT_SECRET;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not set on the server' });
  if (!secret) return res.status(500).json({ error: 'COMMIT_SECRET not set on the server' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};
    const { secret: given, message, files } = body;
    if (given !== secret) return res.status(403).json({ error: 'Bad commit password' });
    if (!Array.isArray(files) || !files.length) return res.status(400).json({ error: 'files[] required ({path, content, encoding})' });
    for (const f of files) if (!f || !f.path || f.content === undefined) return res.status(400).json({ error: 'each file needs {path, content}' });

    const gh = (path, opts = {}) => fetch('https://api.github.com' + path, {
      method: opts.method || 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'creapz-builder' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const j = async (r) => { const t = await r.text(); let d; try { d = JSON.parse(t); } catch (e) { d = { raw: t }; } if (!r.ok) throw new Error((d && d.message) || ('GitHub ' + r.status)); return d; };

    // 1) current HEAD commit + base tree
    const ref = await j(await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`));
    const headSha = ref.object.sha;
    const headCommit = await j(await gh(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`));
    const baseTree = headCommit.tree.sha;

    // 2) blobs for each file
    const treeItems = [];
    for (const f of files) {
      const enc = (f.encoding === 'base64') ? 'base64' : 'utf-8';
      const blob = await j(await gh(`/repos/${OWNER}/${REPO}/git/blobs`, { method: 'POST', body: { content: f.content, encoding: enc } }));
      treeItems.push({ path: f.path.replace(/^\/+/, ''), mode: '100644', type: 'blob', sha: blob.sha });
    }

    // 3) tree -> commit -> move ref
    const tree = await j(await gh(`/repos/${OWNER}/${REPO}/git/trees`, { method: 'POST', body: { base_tree: baseTree, tree: treeItems } }));
    const commit = await j(await gh(`/repos/${OWNER}/${REPO}/git/commits`, { method: 'POST', body: { message: message || 'builder: commit assets', tree: tree.sha, parents: [headSha] } }));
    await j(await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha, force: false } }));

    return res.status(200).json({ ok: true, commit: commit.sha, committed: treeItems.map(t => t.path) });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
