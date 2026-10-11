// Renders the public verification page for one tree. Pure functions so they can be tested without a browser.

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function treeIdFromPath(pathname, search = "") {
  const m = /^\/t\/([a-z0-9]{6,20})\/?$/.exec(pathname);
  if (m) return m[1];
  const id = new URLSearchParams(search).get("id");
  return id && /^[a-z0-9]{6,20}$/.test(id) ? id : null;
}

// GitHub Pages has no rewrites, so 404.html sends /t/<id> and /join/<code> to the real pages.
export function fallbackRoute(pathname) {
  const tree = /^\/t\/([a-z0-9]{6,20})\/?$/.exec(pathname);
  if (tree) return `/t.html?id=${tree[1]}`;
  const join = /^\/join\/([A-Z2-9]{6})\/?$/i.exec(pathname);
  if (join) return `/join.html?code=${join[1].toUpperCase()}`;
  return null;
}

function monthTitle(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function renderTree(tree, { storageUrl }) {
  if (!tree) {
    return `<section class="card"><h1>Tree not found</h1><p class="muted">This certificate link isn't valid, or the tree isn't verified yet.</p></section>`;
  }
  const months = Number(tree.months_alive) || 0;
  const alive = months === 0 ? "Newly planted" : months === 1 ? "Alive 1 month" : `Alive ${months} months`;
  const planted = new Date(tree.planted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const thumbs = (tree.thumbs ?? []).map((p) =>
    `<img src="${escapeHtml(`${storageUrl}/storage/v1/object/public/tree-thumbs/${p}`)}" alt="Photo of the tree" loading="lazy">`).join("");
  const checkins = (tree.checkins ?? []).map((m) => `<li>${escapeHtml(monthTitle(m))} · check-in approved</li>`).join("");
  const map = `https://www.openstreetmap.org/?mlat=${Number(tree.lat)}&mlon=${Number(tree.lon)}#map=13/${Number(tree.lat)}/${Number(tree.lon)}`;
  return `
    <section class="card ${tree.guardian ? "guardian" : ""}">
      <p class="eyebrow">Lumitree certificate No. ${escapeHtml(tree.number)}</p>
      <h1>${escapeHtml(tree.planter)} planted a ${escapeHtml(String(tree.species).toLowerCase())}</h1>
      <p class="muted">${tree.guardian ? "Guardian · 12 months of check-ins · " : ""}${escapeHtml(alive)}</p>
      <div class="thumbs">${thumbs}</div>
      <dl>
        <div><dt>Planted</dt><dd>${escapeHtml(planted)}</dd></div>
        <div><dt>Place</dt><dd>${escapeHtml(tree.city ?? "Verified location")} · <a href="${escapeHtml(map)}" rel="noopener">map (about 1 km)</a></dd></div>
        <div><dt>CO₂</dt><dd>≈ ${Math.floor(months * 22 / 12)} kg so far</dd></div>
        ${tree.caption ? `<div><dt>Note</dt><dd>${escapeHtml(tree.caption)}</dd></div>` : ""}
      </dl>
      <h2>Timeline</h2>
      <ul class="timeline"><li>${escapeHtml(planted)} · planted and verified by a person</li>${checkins}</ul>
    </section>`;
}
