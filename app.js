const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = u => /^(https?:\/\/|\/)/.test(u || '') ? esc(u) : '#';
const img = u => u ? `<img loading="lazy" src="${url(u)}" alt="">` : '';
const api = p => fetch('/api' + p).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.error); return j.data; });
// Loading + error state for every fetch
async function load(sel, path, render) {
  const el = $(sel); const box = el.querySelector('.grid,div') || el; const old = box.innerHTML; box.innerHTML = '<p class="muted">Loading…</p>';
  try { const d = await api(path); box.innerHTML = (Array.isArray(d) && !d.length) ? '<p class="muted">Nothing here yet.</p>' : render(d, box) || box.innerHTML; }
  catch (e) { box.innerHTML = `<p class="err">Could not load: ${esc(e.message)}</p>`; }
}
const card = h => `<div class="glass card">${h}</div>`;
load('#about', '/about', a => {
  document.title = a.name + ' — ' + a.title;
  return `${a.photo ? `<img class="ph" src="${url(a.photo)}" alt="">` : ''}<h1 class="rb">${esc(a.name)}</h1><h3>${esc(a.title)}</h3><p>${esc(a.bio)}</p>
  ${[['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['resumeUrl', 'Résumé']].filter(l => a[l[0]]).map(l => `<a class="btn sm ghost" href="${url(a[l[0]])}" target="_blank" rel="noopener">${l[1]}</a> `).join('')}`;
});
load('#projects', '/projects?limit=12', d => d.map(p => card(`${img(p.image)}<div class="pad"><h3>${esc(p.title)}</h3><p class="muted">${esc(p.description)}</p>${(p.techStack || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<p>${p.liveUrl ? `<a href="${url(p.liveUrl)}" target="_blank" rel="noopener">Live</a> ` : ''}${p.repoUrl ? `<a href="${url(p.repoUrl)}" target="_blank" rel="noopener">Code</a>` : ''}</p></div>`)).join(''));
load('#skills', '/skills', d => { const g = {}; d.forEach(s => (g[s.category || 'Other'] ||= []).push(s));
  return Object.entries(g).map(([c, a]) => `<div class="glass pad" style="margin-bottom:16px"><h3>${esc(c)}</h3>${a.map(s => `<span class="chip">${esc(s.icon || '')} ${esc(s.name)}${s.level ? ' · ' + esc(s.level) + '%' : ''}</span>`).join('')}</div>`).join(''); });
load('#experience', '/experience', d => d.map(e => card(`<div class="pad"><h3>${esc(e.role)}</h3><p>${esc(e.company)} <span class="chip">${esc(e.type || 'work')}</span></p><p class="muted">${esc(e.startDate)} – ${esc(e.endDate)}</p><p>${esc(e.description)}</p></div>`)).join(''));
load('#services', '/services', d => d.map(s => card(`<div class="pad"><h3>${esc(s.icon)} ${esc(s.title)}</h3><p class="muted">${esc(s.description)}</p></div>`)).join(''));
load('#testimonials', '/testimonials', d => d.map(t => card(`<div class="pad"><p>“${esc(t.quote)}”</p><p class="muted">— ${esc(t.name)}, ${esc(t.role)} ${esc(t.company)}</p></div>`)).join(''));
load('#blogs', '/blogs?limit=9', d => { window.posts = d; return d.map((b, i) => `<div class="glass card" style="cursor:pointer" data-i="${i}">${img(b.coverImage)}<div class="pad"><h3>${esc(b.title)}</h3><p class="muted">${esc((b.publishedAt || '').slice(0, 10))}</p>${(b.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></div>`).join(''); });
$('#blogs').onclick = e => { const c = e.target.closest('[data-i]'); if (!c) return; const b = posts[c.dataset.i];
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="glass"><h2 class="rb">${esc(b.title)}</h2><p style="white-space:pre-wrap">${esc(b.content)}</p><br><button class="btn sm">Close</button></div>`;
  m.onclick = ev => { if (ev.target === m || ev.target.tagName === 'BUTTON') m.remove(); }; document.body.append(m); };
$('#cf').onsubmit = async e => { e.preventDefault(); const s = $('#cs'); s.textContent = 'Sending…'; s.className = 'muted';
  try { const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }); const j = await r.json();
    if (!j.success) throw new Error(j.error); s.textContent = 'Sent — thank you!'; e.target.reset(); } catch (x) { s.textContent = x.message; s.className = 'err'; } };
document.addEventListener('pointermove', e => { const g = e.target.closest?.('.glass'); if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--x', e.clientX - r.left + 'px'); g.style.setProperty('--y', e.clientY - r.top + 'px'); } });
