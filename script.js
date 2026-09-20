/* =====================================================
   Rohan Das Kathabaniya - shared site script
   Runs on every public page.
   - Builds the header and footer (edit them here, once)
   - Loads content from the *.json files (site.json, projects.json, posts.json)
   - Never uses innerHTML with data, so content can't inject code
   ===================================================== */
(function () {
  'use strict';

  /* ---------- Fallback settings (used if site.json fails to load) ---------- */
  const DEFAULTS = {
    name: 'Rohan Das Kathabaniya',
    email: 'contact@rohandaskathabaniya.com.np',
    linkedin: 'https://www.linkedin.com/in/rohan-das-kathabaniya-435199326',
    github: 'https://github.com/rohandaskathabaniya-art',
    location: 'Nepal',
    availability: { open: true, text: 'Open to Internships, Freelance Projects & Entry-Level Opportunities' },
    learning: [],
    skills: []
  };

  const NAV = [
    ['about.html', 'About'],
    ['projects.html', 'Projects'],
    ['services.html', 'Services'],
    ['tools.html', 'Free Tools'],
    ['career.html', 'Work With Me'],
    ['resume.html', 'Resume'],
    ['blog.html', 'Blog'],
    ['contact.html', 'Contact']
  ];

  const STATUS = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'planned': 'Planned'
  };

  /* ---------- Small helpers ---------- */
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

  // Only allow normal web links. Blocks things like javascript: URLs.
  function safeUrl(u) {
    if (!u || typeof u !== 'string') return '';
    try {
      const x = new URL(u, location.href);
      return (x.protocol === 'https:' || x.protocol === 'http:' || x.protocol === 'mailto:') ? u : '';
    } catch (e) { return ''; }
  }

  function isExternal(u) {
    try { return new URL(u, location.href).origin !== location.origin; } catch (e) { return false; }
  }

  const cache = {};
  function loadJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    return cache[path];
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function toast(msg) {
    const old = $('.toast');
    if (old) old.remove();
    const t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.append(t);
    setTimeout(function () { t.remove(); }, 5000);
  }
  window.RDK = { h: h, safeUrl: safeUrl, toast: toast, loadJSON: loadJSON };

  function formatDate(iso) {
    const p = String(iso || '').split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return '';
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function linkBtn(label, url, cls) {
    const u = safeUrl(url);
    if (!u) return h('span', { class: 'btn btn-small btn-disabled', 'aria-disabled': 'true', text: label + ' (soon)' });
    const ext = isExternal(u);
    return h('a', { class: 'btn btn-small ' + cls, href: u, target: ext ? '_blank' : null, rel: ext ? 'noopener noreferrer' : null, text: label });
  }

  /* ---------- Theme (light / dark) ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked: ignore */ }
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    const mount = $('#site-header');
    if (!mount) return;
    const page = location.pathname.split('/').pop() || 'index.html';

    const list = h('ul');
    NAV.forEach(function (item) {
      const a = h('a', { href: item[0], text: item[1] });
      if (page === item[0]) a.setAttribute('aria-current', 'page');
      list.append(h('li', null, a));
    });
    const nav = h('nav', { id: 'nav', 'aria-label': 'Primary' }, list);

    const themeBtn = h('button', {
      id: 'theme-toggle', class: 'icon-btn', type: 'button', 'aria-label': 'Switch between light and dark mode',
      onclick: function () { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }
    });
    themeBtn.append(h('span', { class: 'theme-icon', 'aria-hidden': 'true' }));
    const menuBtn = h('button', {
      class: 'icon-btn nav-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav', 'aria-label': 'Open menu', text: '☰',
      onclick: function () {
        const open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuBtn.textContent = open ? '✕' : '☰';
      }
    });

    const header = h('header', { class: 'site-header' },
      h('div', { class: 'container nav-wrap' },
        h('a', { class: 'brand', href: 'index.html', 'aria-label': 'Rohan Das, home' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true', text: 'RD' }),
          h('span', { text: 'Rohan Das' })),
        nav,
        h('div', { class: 'nav-actions' }, themeBtn, menuBtn)));
    mount.replaceChildren(header);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { menuBtn.click(); menuBtn.focus(); }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('open')) menuBtn.click();
    });
  }

  /* ---------- Footer ---------- */
  function renderFooter(site) {
    const mount = $('#site-footer');
    if (!mount) return;
    const mail = 'mailto:' + site.email;
    const footer = h('footer', { class: 'site-footer' },
      h('div', { class: 'container' },
        h('div', { class: 'footer-grid' },
          h('div', null,
            h('h2', { text: site.name }),
            h('p', { text: 'B.E. Computer Engineering Student' }),
            h('p', { text: site.location })),
          h('div', null,
            h('h2', { text: 'Quick links' }),
            h('ul', null,
              h('li', null, h('a', { href: 'projects.html', text: 'Projects' })),
              h('li', null, h('a', { href: 'tools.html', text: 'Free tools' })),
              h('li', null, h('a', { href: 'resume.html', text: 'Resume' })),
              h('li', null, h('a', { href: 'resources.html', text: 'Resources' })),
              h('li', null, h('a', { href: 'privacy.html', text: 'Privacy' })))),
          h('div', null,
            h('h2', { text: 'Find me' }),
            h('ul', null,
              h('li', null, h('a', { href: safeUrl(site.github) || '#', target: '_blank', rel: 'noopener noreferrer', text: 'GitHub' })),
              h('li', null, h('a', { href: safeUrl(site.linkedin) || '#', target: '_blank', rel: 'noopener noreferrer', text: 'LinkedIn' })),
              h('li', null, h('a', { href: mail, text: site.email }))))),
        h('div', { class: 'footer-bottom' },
          h('span', { text: '© ' + new Date().getFullYear() + ' ' + site.name + '. All rights reserved.' }),
          h('span', { text: 'Built with HTML, CSS and JavaScript. Hosted free on GitHub Pages.' }))));
    mount.replaceChildren(footer);
  }

  /* ---------- Site settings applied to the page ---------- */
  function applySite(site) {
    $$('[data-availability]').forEach(function (el) {
      el.textContent = site.availability.open ? site.availability.text : 'Not taking new work right now';
      const badge = el.closest('.badge');
      if (badge) badge.classList.toggle('closed', !site.availability.open);
    });
    $$('[data-site="intro"]').forEach(function (el) { if (site.intro) el.textContent = site.intro; });
    $$('[data-site="email"]').forEach(function (el) {
      el.textContent = site.email;
      if (el.tagName === 'A') el.href = 'mailto:' + site.email;
    });
    $$('[data-site="linkedin"]').forEach(function (el) { el.href = safeUrl(site.linkedin) || '#'; });
    $$('[data-site="github"]').forEach(function (el) { el.href = safeUrl(site.github) || '#'; });
    $$('[data-site="learning"]').forEach(function (el) {
      el.replaceChildren.apply(el, (site.learning || []).map(function (t) { return h('li', { class: 'chip learning', text: t }); }));
    });
  }

  /* ---------- Skills ---------- */
  function renderSkills(site) {
    $$('[data-skills]').forEach(function (mount) {
      const compact = mount.dataset.skills === 'compact';
      if (!site.skills || !site.skills.length) {
        mount.replaceChildren(h('p', { class: 'empty', text: 'Skills could not be loaded.' }));
        return;
      }
      const legend = h('div', { class: 'legend' },
        h('span', null, h('i', { class: 'chip', text: 'Working knowledge' }), ' I can use this for small, real tasks.'),
        h('span', null, h('i', { class: 'chip learning', text: 'Currently learning' }), ' I am still building this skill.'));
      const grid = h('div', { class: 'grid grid-3' });
      site.skills.forEach(function (cat) {
        const chips = h('ul', { class: 'chips' });
        cat.items.forEach(function (it) {
          const learning = it.level === 'learning';
          chips.append(h('li', { class: 'chip' + (learning ? ' learning' : '') },
            it.name, h('span', { class: 'sr-only', text: learning ? ' (currently learning)' : ' (working knowledge)' })));
        });
        grid.append(h('div', { class: 'card' + (compact ? ' flat' : '') }, h('h3', { text: cat.category }), chips));
      });
      mount.replaceChildren(legend, grid);
    });
  }

  /* ---------- Projects ---------- */
  function projectCard(p, onDetails) {
    const tech = h('ul', { class: 'chips' });
    (p.tech || []).forEach(function (t) { tech.append(h('li', { class: 'chip plain', text: t })); });
    return h('article', { class: 'card project' },
      h('div', { class: 'project-top' },
        h('div', { class: 'project-icon', 'aria-hidden': 'true', text: p.icon || '📁' }),
        h('span', { class: 'status status-' + p.status, text: STATUS[p.status] || p.status })),
      h('h3', { text: p.name }),
      h('p', { text: p.summary }),
      h('p', { class: 'problem' }, h('strong', { text: 'Problem solved: ' }), p.problem),
      tech,
      h('div', { class: 'btn-row' },
        linkBtn('GitHub', p.github, 'btn-secondary'),
        linkBtn('Live Demo', p.live, 'btn-primary'),
        h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: function () { onDetails(p); }, text: 'View Details' })));
  }

  function makeDialog() {
    const dlg = h('dialog', { class: 'modal', 'aria-labelledby': 'dlg-title' });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    document.body.append(dlg);
    return dlg;
  }

  function showDetails(dlg, p) {
    const tech = h('ul', { class: 'chips' });
    (p.tech || []).forEach(function (t) { tech.append(h('li', { class: 'chip plain', text: t })); });
    dlg.replaceChildren(h('div', { class: 'modal-body' },
      h('button', { class: 'btn btn-small btn-ghost modal-close', type: 'button', onclick: function () { dlg.close(); }, text: 'Close' }),
      h('span', { class: 'status status-' + p.status, text: STATUS[p.status] || p.status }),
      h('h2', { id: 'dlg-title', text: p.name }),
      h('p', { text: p.summary }),
      h('h3', { text: 'Problem it solves' }), h('p', { text: p.problem }),
      h('h3', { text: 'About this project' }), h('p', { text: p.details || 'More details coming soon.' }),
      h('h3', { text: 'Built with' }), tech,
      h('div', { class: 'btn-row' }, linkBtn('GitHub', p.github, 'btn-secondary'), linkBtn('Live Demo', p.live, 'btn-primary'))));
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  async function initProjects(page) {
    let projects = [];
    try { projects = (await loadJSON('projects.json')).projects || []; }
    catch (e) {
      $$('[data-projects],[data-featured],[data-resume-projects]').forEach(function (m) {
        m.replaceChildren(h('p', { class: 'empty', text: 'Projects could not be loaded. Open the site through its web address (not by double-clicking the file).' }));
      });
      return null;
    }

    const full = $('[data-projects]');
    if (full) {
      const dlg = makeDialog();
      const grid = h('div', { class: 'grid grid-3' });
      const bar = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter projects by status' });
      const live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
      let current = 'all';
      function draw() {
        const shown = projects.filter(function (p) { return current === 'all' || p.status === current; });
        grid.replaceChildren.apply(grid, shown.map(function (p) { return projectCard(p, function (x) { showDetails(dlg, x); }); }));
        if (!shown.length) grid.replaceChildren(h('p', { class: 'empty', text: 'No projects in this group yet.' }));
        live.textContent = shown.length + ' projects shown';
        $$('button', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.f === current)); });
      }
      [['all', 'All'], ['completed', 'Completed'], ['in-progress', 'In Progress'], ['planned', 'Planned']].forEach(function (f) {
        bar.append(h('button', { type: 'button', 'data-f': f[0], text: f[1], onclick: function () { current = f[0]; draw(); } }));
      });
      full.replaceChildren(bar, live, grid);
      draw();
    }

    const feat = $('[data-featured]');
    if (feat) {
      const dlg = makeDialog();
      const picks = projects.filter(function (p) { return p.featured; }).slice(0, 3);
      feat.replaceChildren.apply(feat, picks.map(function (p) { return projectCard(p, function (x) { showDetails(dlg, x); }); }));
    }

    const resume = $('[data-resume-projects]');
    if (resume) {
      const shown = projects.filter(function (p) { return p.status !== 'planned'; });
      resume.replaceChildren.apply(resume, shown.map(function (p) {
        return h('div', { class: 'entry' },
          h('h3', { text: p.name }),
          h('span', { class: 'when' }, STATUS[p.status] + '. ' + (p.tech || []).join(', ')),
          h('p', { text: p.summary }));
      }));
    }

    const counts = { 'completed': 0, 'in-progress': 0, 'planned': 0 };
    projects.forEach(function (p) { if (counts[p.status] !== undefined) counts[p.status]++; });
    return counts;
  }

  /* ---------- Home: "at a glance" ---------- */
  function renderGlance(site, counts) {
    const mount = $('[data-glance]');
    if (!mount) return;
    const rows = [
      ['Who I am', 'A B.E. Computer Engineering student in ' + site.location + ', building practical skills.'],
      ['What I am learning', (site.learning || []).join(', ') || 'Web development, programming and databases'],
      ['What I can build', 'Responsive websites, small browser tools, and clean, formatted documents.'],
      ['Projects', counts ? counts.completed + ' completed, ' + counts['in-progress'] + ' in progress and ' + counts.planned + ' planned.' : 'See the projects page.', ['projects.html', 'See all projects']],
      ['Services', 'Portfolio sites, CV websites, document formatting and AI-assisted productivity.', ['services.html', 'See services']],
      ['Availability', site.availability.open ? site.availability.text : 'Not taking new work right now.'],
      ['Contact', site.email, ['contact.html', 'Contact page']]
    ];
    const dl = h('dl', { class: 'glance' });
    rows.forEach(function (r) {
      const dd = h('dd', null, r[1]);
      if (r[2]) dd.append(' ', h('a', { href: r[2][0], text: r[2][1] }));
      dl.append(h('div', null, h('dt', { text: r[0] }), dd));
    });
    mount.replaceChildren(dl);
  }

  /* ---------- Blog ---------- */
  function renderBody(text) {
    const box = h('div', { class: 'post-body' });
    let list = null;
    let para = [];
    function flushPara() { if (para.length) { box.append(h('p', { text: para.join(' ') })); para = []; } }
    String(text || '').split('\n').forEach(function (raw) {
      const line = raw.trim();
      if (!line) { flushPara(); list = null; return; }
      if (line.indexOf('## ') === 0) { flushPara(); list = null; box.append(h('h2', { text: line.slice(3) })); return; }
      if (line.indexOf('### ') === 0) { flushPara(); list = null; box.append(h('h3', { text: line.slice(4) })); return; }
      if (line.indexOf('- ') === 0) {
        flushPara();
        if (!list) { list = h('ul'); box.append(list); }
        list.append(h('li', { text: line.slice(2) }));
        return;
      }
      list = null; para.push(line);
    });
    flushPara();
    return box;
  }

  function postCard(p) {
    const tags = h('ul', { class: 'chips' });
    (p.tags || []).forEach(function (t) { tags.append(h('li', { class: 'chip plain', text: t })); });
    return h('article', { class: 'card' },
      h('p', { class: 'post-meta', text: formatDate(p.date) }),
      h('h3', null, h('a', { href: 'blog.html?post=' + encodeURIComponent(p.slug), text: p.title })),
      h('p', { text: p.summary }), tags);
  }

  async function initBlog() {
    const list = $('[data-posts]');
    const latest = $('[data-latest-posts]');
    if (!list && !latest) return;
    let posts = [];
    try { posts = ((await loadJSON('posts.json')).posts || []).filter(function (p) { return p.published; }); }
    catch (e) {
      (list || latest).replaceChildren(h('p', { class: 'empty', text: 'Posts could not be loaded.' }));
      return;
    }
    posts.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });

    if (latest) {
      const three = posts.slice(0, 3);
      latest.replaceChildren.apply(latest, three.length ? three.map(postCard) : [h('p', { class: 'empty', text: 'No posts yet.' })]);
    }
    if (list) {
      const slug = new URLSearchParams(location.search).get('post');
      const post = slug && posts.find(function (p) { return p.slug === slug; });
      if (post) {
        $$('[data-blog-head]').forEach(function (x) { x.hidden = true; });
        document.title = post.title + ' | Rohan Das Kathabaniya';
        const tags = h('ul', { class: 'chips' });
        (post.tags || []).forEach(function (t) { tags.append(h('li', { class: 'chip plain', text: t })); });
        list.replaceChildren(
          h('p', null, h('a', { href: 'blog.html', text: 'Back to all posts' })),
          h('h1', { text: post.title }),
          h('p', { class: 'post-meta', text: formatDate(post.date) }),
          tags, renderBody(post.body));
      } else if (!posts.length) {
        list.replaceChildren(h('p', { class: 'empty', text: 'No posts yet. The first ones are on their way.' }));
      } else {
        const grid = h('div', { class: 'grid grid-2' });
        posts.forEach(function (p) { grid.append(postCard(p)); });
        list.replaceChildren(grid);
      }
    }
  }

  /* ---------- CV download button ---------- */
  function initCv() {
    $$('a[data-cv]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        const href = a.getAttribute('href');
        fetch(href, { method: 'HEAD' }).then(function (r) {
          if (!r.ok) throw new Error('missing');
          const d = h('a', { href: href, download: 'Rohan-Das-Kathabaniya-CV.pdf' });
          document.body.append(d); d.click(); d.remove();
        }).catch(function () {
          toast('The PDF CV is not uploaded yet. Please read my online CV or email me for a copy.');
        });
      });
    });
    $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  }

  /* ---------- Profile photo fallback ---------- */
  function initAvatar() {
    $$('.avatar img').forEach(function (img) {
      function hide() { img.hidden = true; }
      img.addEventListener('error', hide);
      if (img.complete && img.naturalWidth === 0) hide();
    });
  }

  /* ---------- Contact form: opens the visitor's own email app ---------- */
  function initContact(site) {
    const form = $('#contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const name = form.elements.name.value.trim();
      const from = form.elements.email.value.trim();
      const subject = form.elements.subject.value.trim() || 'Message from my website';
      const msg = form.elements.message.value.trim();
      const body = msg + '\n\n' + name + '\n' + from;
      location.href = 'mailto:' + site.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------- Start ---------- */
  async function init() {
    renderHeader();
    initCv();
    initAvatar();
    let site = DEFAULTS;
    try {
      const j = await loadJSON('site.json');
      site = Object.assign({}, DEFAULTS, j, { availability: Object.assign({}, DEFAULTS.availability, j.availability) });
    } catch (e) { /* offline or opened as a file: use defaults */ }
    renderFooter(site);
    applySite(site);
    renderSkills(site);
    initContact(site);
    const counts = await initProjects();
    renderGlance(site, counts);
    initBlog();
  }
  init();
})();
