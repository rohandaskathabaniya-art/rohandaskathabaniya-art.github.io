/* =====================================================
   Admin dashboard - edits your site content safely.

   HOW SECURITY WORKS (read this once):
   - This page is public, like every page on GitHub Pages.
     It contains NO password and NO secret.
   - To change anything, you paste a GitHub "fine-grained token".
     GitHub itself checks the token. Without a valid token that has
     write access to this repository, every save is refused.
   - The token stays only in this browser tab's memory (or this
     tab's session storage if you tick "Keep me signed in").
     It is never written to the repository or sent anywhere except
     to https://api.github.com.
   - The page has a strict Content-Security-Policy (see admin.html),
     so it cannot load scripts from other websites.
   - You are signed out automatically after 20 minutes of inactivity.
   ===================================================== */
(function () {
  'use strict';

  const OWNER = 'rohandaskathabaniya-art';
  const REPO = 'rohandaskathabaniya-art.github.io';
  const API = 'https://api.github.com';
  const FILES = { site: 'site.json', projects: 'projects.json', posts: 'posts.json' };
  const IDLE_MS = 20 * 60 * 1000;
  const SESSION_KEY = 'rdk_admin_session';

  let token = null;
  let branch = 'main';
  let data = {};
  let shas = {};
  let idleTimer = null;
  let busy = false;

  /* ---------- Helpers ---------- */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    const a = attrs || {};
    Object.keys(a).forEach(function (k) {
      const v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  }
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function safeUrl(u) {
    if (!u) return '';
    try { const x = new URL(u, 'https://example.com/'); return (x.protocol === 'https:' || x.protocol === 'http:' || x.protocol === 'mailto:') ? u : null; }
    catch (e) { return null; }
  }
  function slugify(s) {
    return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'item';
  }
  function toB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function fromB64(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function setMsg(text, type) {
    const box = $('#msg');
    box.className = 'notice ' + (type || 'info');
    box.textContent = text;
    box.hidden = !text;
    if (text) box.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Theme ---------- */
  try {
    const t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
  } catch (e) { /* ignore */ }

  /* ---------- GitHub API ---------- */
  async function gh(path, opts) {
    const o = opts || {};
    const res = await fetch(API + path, {
      method: o.method || 'GET',
      body: o.body,
      headers: Object.assign({
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, o.headers || {})
    });
    let body = null;
    try { body = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const err = new Error((body && body.message) || 'GitHub error ' + res.status);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  function explain(err) {
    if (err.status === 401) return 'GitHub rejected this token. It may be mistyped, expired or revoked. Create a new one using the steps on this page.';
    if (err.status === 403) return 'GitHub refused this action. Check the token has "Contents: Read and write" for this repository, or wait a minute if you are being rate limited.';
    if (err.status === 404) return 'Repository or file not found. Check the token is limited to ' + REPO + ' and has repository access.';
    if (err.status === 409 || err.status === 422) return 'The file changed on GitHub since you loaded it. Click "Reload from GitHub" and try again.';
    if (err instanceof TypeError) return 'Could not reach GitHub. Check your internet connection.';
    return err.message;
  }

  async function loadFile(key) {
    try {
      const f = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + FILES[key] + '?ref=' + encodeURIComponent(branch));
      shas[key] = f.sha;
      return JSON.parse(fromB64(f.content));
    } catch (e) {
      if (e.status === 404) { shas[key] = null; return key === 'site' ? {} : (key === 'projects' ? { projects: [] } : { posts: [] }); }
      throw e;
    }
  }

  async function saveFile(key, message) {
    if (busy) return false;
    busy = true;
    setMsg('Saving to GitHub...', 'info');
    try {
      const body = { message: message, content: toB64(JSON.stringify(data[key], null, 2) + '\n'), branch: branch };
      if (shas[key]) body.sha = shas[key];
      const res = await gh('/repos/' + OWNER + '/' + REPO + '/contents/' + FILES[key], { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      shas[key] = res.content.sha;
      setMsg('Saved. Your live site updates in about one minute.', 'info');
      return true;
    } catch (e) {
      setMsg('Not saved. ' + explain(e), 'error');
      return false;
    } finally { busy = false; }
  }

  /* ---------- Sign in / out ---------- */
  function resetIdle() {
    clearTimeout(idleTimer);
    if (token) idleTimer = setTimeout(function () { signOut('You were signed out after 20 minutes of inactivity.'); }, IDLE_MS);
  }
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, resetIdle, { passive: true }); });

  async function signIn(t, remember) {
    token = t.trim();
    if (!token) { token = null; return setLoginError('Paste your token first.'); }
    setLoginError('');
    $('#login-btn').disabled = true;
    try {
      const repo = await gh('/repos/' + OWNER + '/' + REPO);
      if (repo.permissions && repo.permissions.push === false) throw Object.assign(new Error('This token can only read the repository. It needs "Contents: Read and write".'), { status: 0 });
      branch = repo.default_branch || 'main';
      data.site = await loadFile('site');
      data.projects = await loadFile('projects');
      data.posts = await loadFile('posts');
      if (remember) { try { sessionStorage.setItem(SESSION_KEY, token); } catch (e) { /* ignore */ } }
      $('#token').value = '';
      $('#login').hidden = true;
      $('#dash').hidden = false;
      resetIdle();
      showTab(location.hash.slice(1) || 'projects');
    } catch (e) {
      token = null;
      setLoginError(explain(e));
    } finally { $('#login-btn').disabled = false; }
  }

  function signOut(message) {
    token = null; data = {}; shas = {};
    clearTimeout(idleTimer);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    $('#dash').hidden = true;
    $('#login').hidden = false;
    $('#msg').hidden = true;
    setLoginError(message || '');
    if (message) $('#login-error').className = 'notice info';
  }

  function setLoginError(text) {
    const b = $('#login-error');
    b.className = 'notice error';
    b.textContent = text;
    b.hidden = !text;
  }

  /* ---------- Generic form builder ---------- */
  // field = { key, label, type: text|textarea|select|checkbox|list|date|url, options, help, required, rows }
  function buildForm(fields, values) {
    const form = h('form', { novalidate: true });
    const inputs = {};
    fields.forEach(function (f, i) {
      const id = 'ed-' + f.key;
      let input;
      const v = values[f.key];
      if (f.type === 'textarea' || f.type === 'list') {
        input = h('textarea', { id: id, rows: f.rows || 3 });
        input.value = f.type === 'list' ? (Array.isArray(v) ? v.join(f.sep === 'line' ? '\n' : ', ') : '') : (v || '');
      } else if (f.type === 'select') {
        input = h('select', { id: id });
        f.options.forEach(function (o) { input.append(h('option', { value: o[0], text: o[1] })); });
        input.value = v || f.options[0][0];
      } else if (f.type === 'checkbox') {
        input = h('input', { id: id, type: 'checkbox' });
        input.checked = !!v;
      } else {
        input = h('input', { id: id, type: f.type === 'date' ? 'date' : 'text', autocomplete: 'off' });
        input.value = v || '';
      }
      inputs[f.key] = input;
      const help = f.help ? h('p', { class: 'help', text: f.help }) : null;
      if (f.type === 'checkbox') form.append(h('div', { class: 'field' }, h('div', { class: 'check' }, input, h('label', { for: id, text: f.label })), help));
      else form.append(h('div', { class: 'field' }, h('label', { for: id, text: f.label + (f.required ? ' (required)' : '') }), input, help));
    });
    form.read = function () {
      const out = {}, errors = [];
      fields.forEach(function (f) {
        const el = inputs[f.key];
        let val;
        if (f.type === 'checkbox') val = el.checked;
        else if (f.type === 'list') val = el.value.split(f.sep === 'line' ? /\n/ : /,/).map(function (x) { return x.trim(); }).filter(Boolean);
        else val = el.value.trim();
        if (f.required && (val === '' || (Array.isArray(val) && !val.length))) errors.push(f.label + ' is required.');
        if (f.type === 'url' && val && safeUrl(val) === null) errors.push(f.label + ' must start with https:// (or be a page on this site).');
        out[f.key] = val;
      });
      return { values: out, errors: errors };
    };
    return form;
  }

  function editorActions(onSave, onCancel, onDelete) {
    const row = h('div', { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn btn-primary', text: 'Save and publish', onclick: onSave }),
      h('button', { type: 'button', class: 'btn btn-ghost', text: 'Cancel', onclick: onCancel }));
    if (onDelete) row.append(h('button', { type: 'button', class: 'btn btn-danger', text: 'Delete', onclick: onDelete }));
    return row;
  }

  /* ---------- Projects tab ---------- */
  const PROJECT_FIELDS = [
    { key: 'name', label: 'Project name', type: 'text', required: true },
    { key: 'icon', label: 'Icon (one emoji)', type: 'text', help: 'Example: 🌐 or 🤖. Shown on the project card.' },
    { key: 'status', label: 'Status', type: 'select', options: [['planned', 'Planned'], ['in-progress', 'In Progress'], ['completed', 'Completed']], help: 'Only choose Completed when it really works and you can explain how it was built.' },
    { key: 'summary', label: 'Short description', type: 'textarea', rows: 2, required: true },
    { key: 'problem', label: 'Problem it solves', type: 'textarea', rows: 2 },
    { key: 'tech', label: 'Technologies', type: 'list', help: 'Separate with commas, e.g. HTML, CSS, JavaScript' },
    { key: 'github', label: 'GitHub link', type: 'url', help: 'Leave empty if it is not on GitHub yet.' },
    { key: 'live', label: 'Live demo link', type: 'url', help: 'Leave empty if there is no demo yet.' },
    { key: 'details', label: 'Details', type: 'textarea', rows: 5, help: 'Shown when a visitor clicks View Details.' },
    { key: 'featured', label: 'Show on the home page (the first 3 featured projects appear)', type: 'checkbox' }
  ];

  function renderProjects(panel, editIndex) {
    const list = data.projects.projects;
    if (editIndex !== undefined) {
      const isNew = editIndex === -1;
      const cur = isNew ? { status: 'planned', icon: '📁', tech: [] } : list[editIndex];
      const form = buildForm(PROJECT_FIELDS, cur);
      panel.replaceChildren(h('h2', { text: isNew ? 'Add a project' : 'Edit project' }), form,
        editorActions(async function () {
          const r = form.read();
          if (r.errors.length) return setMsg(r.errors.join(' '), 'error');
          const item = Object.assign({}, cur, r.values);
          if (isNew) { item.id = slugify(item.name); if (list.some(function (p) { return p.id === item.id; })) item.id += '-' + Date.now().toString(36).slice(-3); list.unshift(item); }
          else list[editIndex] = item;
          if (await saveFile('projects', (isNew ? 'Add project: ' : 'Update project: ') + item.name)) renderProjects(panel);
        }, function () { setMsg(''); renderProjects(panel); },
        isNew ? null : async function () {
          if (!confirm('Delete "' + cur.name + '"? This cannot be undone from here (but GitHub keeps history).')) return;
          list.splice(editIndex, 1);
          if (await saveFile('projects', 'Delete project: ' + cur.name)) renderProjects(panel);
        }));
      return;
    }
    const rows = h('div', { class: 'admin-list' });
    if (!list.length) rows.append(h('p', { class: 'empty', text: 'No projects yet. Add your first one.' }));
    list.forEach(function (p, i) {
      rows.append(h('div', { class: 'admin-row' },
        h('div', { class: 'admin-row-main' }, h('strong', { text: (p.icon || '') + ' ' + p.name }), ' ', h('span', { class: 'status status-' + p.status, text: p.status })),
        h('div', { class: 'admin-row-actions' },
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', text: 'Edit', 'aria-label': 'Edit ' + p.name, onclick: function () { setMsg(''); renderProjects(panel, i); } }),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', text: 'Up', 'aria-label': 'Move ' + p.name + ' up', disabled: i === 0 ? true : null, onclick: async function () { list.splice(i - 1, 0, list.splice(i, 1)[0]); if (await saveFile('projects', 'Reorder projects')) renderProjects(panel); } }),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', text: 'Down', 'aria-label': 'Move ' + p.name + ' down', disabled: i === list.length - 1 ? true : null, onclick: async function () { list.splice(i + 1, 0, list.splice(i, 1)[0]); if (await saveFile('projects', 'Reorder projects')) renderProjects(panel); } }))));
    });
    panel.replaceChildren(h('h2', { text: 'Projects' }),
      h('p', { class: 'muted', text: list.length + ' projects. Changes go live on your website about a minute after you save.' }),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-primary', text: 'Add a project', onclick: function () { setMsg(''); renderProjects(panel, -1); } })),
      rows);
  }

  /* ---------- Blog tab ---------- */
  const POST_FIELDS = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'summary', label: 'Short summary', type: 'textarea', rows: 2, required: true },
    { key: 'tags', label: 'Tags', type: 'list', help: 'Separate with commas.' },
    { key: 'body', label: 'Post text', type: 'textarea', rows: 14, required: true, help: 'Blank line starts a new paragraph. Start a line with "## " for a heading, or "- " for a bullet point.' },
    { key: 'published', label: 'Published (untick to keep as a draft nobody can see)', type: 'checkbox' }
  ];

  function renderPosts(panel, editIndex) {
    const list = data.posts.posts;
    if (editIndex !== undefined) {
      const isNew = editIndex === -1;
      const cur = isNew ? { date: today(), published: true, tags: [] } : list[editIndex];
      const form = buildForm(POST_FIELDS, cur);
      panel.replaceChildren(h('h2', { text: isNew ? 'Write a post' : 'Edit post' }), form,
        editorActions(async function () {
          const r = form.read();
          if (r.errors.length) return setMsg(r.errors.join(' '), 'error');
          const item = Object.assign({}, cur, r.values);
          if (isNew) { item.slug = slugify(item.title); if (list.some(function (p) { return p.slug === item.slug; })) item.slug += '-' + Date.now().toString(36).slice(-3); list.unshift(item); }
          else list[editIndex] = item;
          if (await saveFile('posts', (isNew ? 'Add post: ' : 'Update post: ') + item.title)) renderPosts(panel);
        }, function () { setMsg(''); renderPosts(panel); },
        isNew ? null : async function () {
          if (!confirm('Delete "' + cur.title + '"?')) return;
          list.splice(editIndex, 1);
          if (await saveFile('posts', 'Delete post: ' + cur.title)) renderPosts(panel);
        }));
      return;
    }
    const rows = h('div', { class: 'admin-list' });
    if (!list.length) rows.append(h('p', { class: 'empty', text: 'No posts yet.' }));
    list.forEach(function (p, i) {
      rows.append(h('div', { class: 'admin-row' },
        h('div', { class: 'admin-row-main' }, h('strong', { text: p.title }), ' ', h('span', { class: 'muted small', text: p.date + (p.published ? '' : ' (draft)') })),
        h('div', { class: 'admin-row-actions' },
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', text: 'Edit', 'aria-label': 'Edit ' + p.title, onclick: function () { setMsg(''); renderPosts(panel, i); } }))));
    });
    panel.replaceChildren(h('h2', { text: 'Blog posts' }),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-primary', text: 'Write a post', onclick: function () { setMsg(''); renderPosts(panel, -1); } })),
      rows);
  }

  /* ---------- Settings tab ---------- */
  const SETTINGS_FIELDS = [
    { key: 'availabilityOpen', label: 'Show that I am available for work', type: 'checkbox' },
    { key: 'availabilityText', label: 'Availability message', type: 'text', required: true },
    { key: 'intro', label: 'Home page introduction', type: 'textarea', rows: 5, required: true },
    { key: 'learning', label: 'Currently learning (one per line)', type: 'list', sep: 'line', rows: 6 },
    { key: 'email', label: 'Public email address', type: 'text', required: true },
    { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
    { key: 'github', label: 'GitHub URL', type: 'url' }
  ];

  function renderSettings(panel) {
    const s = data.site;
    const cur = {
      availabilityOpen: s.availability ? s.availability.open !== false : true,
      availabilityText: s.availability ? s.availability.text : '',
      intro: s.intro, learning: s.learning || [], email: s.email, linkedin: s.linkedin, github: s.github
    };
    const form = buildForm(SETTINGS_FIELDS, cur);
    panel.replaceChildren(h('h2', { text: 'Site settings' }),
      h('p', { class: 'muted', text: 'Skills lists are kept in site.json. To change them, edit that file on GitHub (see the Help tab).' }),
      form,
      editorActions(async function () {
        const r = form.read();
        if (r.errors.length) return setMsg(r.errors.join(' '), 'error');
        const v = r.values;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return setMsg('Enter a valid email address.', 'error');
        data.site = Object.assign({}, s, {
          availability: { open: v.availabilityOpen, text: v.availabilityText },
          intro: v.intro, learning: v.learning, email: v.email, linkedin: v.linkedin, github: v.github
        });
        if (await saveFile('site', 'Update site settings')) renderSettings(panel);
      }, function () { setMsg(''); renderSettings(panel); }));
  }

  /* ---------- Tabs ---------- */
  function showTab(name) {
    if (['projects', 'blog', 'settings', 'help'].indexOf(name) < 0) name = 'projects';
    $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
    $$('[data-tabpanel]').forEach(function (p) { p.hidden = p.dataset.tabpanel !== name; });
    setMsg('');
    if (name === 'projects') renderProjects($('[data-tabpanel=projects]'));
    if (name === 'blog') renderPosts($('[data-tabpanel=blog]'));
    if (name === 'settings') renderSettings($('[data-tabpanel=settings]'));
  }

  /* ---------- Start ---------- */
  $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#signout').addEventListener('click', function () { signOut('You are signed out.'); });
  $('#reload').addEventListener('click', async function () {
    try {
      data.site = await loadFile('site'); data.projects = await loadFile('projects'); data.posts = await loadFile('posts');
      showTab($('[data-tab][aria-selected=true]').dataset.tab);
      setMsg('Reloaded the latest content from GitHub.', 'info');
    } catch (e) { setMsg(explain(e), 'error'); }
  });
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    signIn($('#token').value, $('#remember').checked);
  });

  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { $('#remember').checked = true; signIn(saved, true); }
  } catch (e) { /* ignore */ }
})();
