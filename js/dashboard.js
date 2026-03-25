/* ================================================
   PRO HANDS — Internal Dashboard (Full Version)
   ================================================ */
(function () {
  'use strict';

  /* ---- Config ---- */
  const USERS = [
    { user: 'prohandsdashboard', pass: 'ProHands2026' }
  ];

  /* ---- State ---- */
  let volunteers = [];
  let newsletter = [];
  let volStatuses  = JSON.parse(localStorage.getItem('ph_volStatuses')  || '{}');
  let volNotes     = JSON.parse(localStorage.getItem('ph_volNotes')     || '{}');
  let todos        = JSON.parse(localStorage.getItem('ph_todos')        || '[]');
  let announcements= JSON.parse(localStorage.getItem('ph_announcements')|| '[]');
  let notifications= JSON.parse(localStorage.getItem('ph_notifications')|| '[]');
  let projects     = JSON.parse(localStorage.getItem('ph_projects')     || '[]');

  /* ---- DOM refs ---- */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  /* ================================================
     1. LOGIN
     ================================================ */
  const loginScreen = $('#loginScreen');
  const dashboard   = $('#dashboard');
  const loginForm   = $('#loginForm');
  const loginError  = $('#loginError');

  function checkSession () {
    if (sessionStorage.getItem('ph_auth')) {
      showDashboard();
      return true;
    }
    return false;
  }

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const u = $('#loginUser').value.trim().toLowerCase();
    const p = $('#loginPass').value;
    const ok = USERS.find(c => c.user === u && c.pass === p);
    if (ok) {
      sessionStorage.setItem('ph_auth', ok.user);
      loginError.textContent = '';
      showDashboard();
    } else {
      loginError.textContent = 'Invalid username or password.';
    }
  });

  $('.toggle-pass').addEventListener('click', () => {
    const inp = $('#loginPass');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  function showDashboard () {
    loginScreen.style.display = 'none';
    dashboard.style.display   = 'flex';
    $('#dashUsername').textContent = sessionStorage.getItem('ph_auth') || 'Admin';
    loadData();
  }

  $('#logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('ph_auth');
    location.reload();
  });

  /* ================================================
     2. SIDEBAR NAV
     ================================================ */
  const navItems = $$('.dash-nav-item');
  const sections = $$('.dash-section');
  const dashTitle = $('#dashTitle');

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sec = item.dataset.section;
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      $(`#sec-${sec}`).classList.add('active');
      dashTitle.textContent = item.textContent.trim();
    });
  });

  $$('[data-goto]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const sec = link.dataset.goto;
      const navItem = $(`.dash-nav-item[data-section="${sec}"]`);
      if (navItem) navItem.click();
    });
  });

  /* Sidebar toggle (mobile) */
  const sidebar = $('#dashSidebar');
  $('#sidebarToggle').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== $('#sidebarToggle') && !$('#sidebarToggle').contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  /* ================================================
     3. DATA LOADING (from Google Sheets via Apps Script)
     ================================================ */
  const API_URL = PRO_HANDS_CONFIG.API_URL;

  async function loadData () {
    try {
      const res  = await fetch(API_URL);
      const json = await res.json();

      // Map to standardised property names
      volunteers = (json.volunteers || []).map(v => ({
        Timestamp: v.Timestamp || '',
        Name:      v.Name      || '',
        Email:     v.Email     || '',
        Phone:     v.Phone     || '',
        Role:      v.Role      || '',
        Message:   v.Message   || '',
        Status:    v.Status    || 'pending'
      }));

      newsletter = (json.newsletter || []).map(s => ({
        Timestamp: s.Timestamp || '',
        Email:     s.Email     || ''
      }));
    } catch (e) {
      console.error('Google Sheets load error:', e);
      volunteers = [];
      newsletter = [];
    }

    // Detect new entries for notifications
    const prevVolCount = parseInt(localStorage.getItem('ph_volCount') || '0');
    const prevSubCount = parseInt(localStorage.getItem('ph_subCount') || '0');

    localStorage.setItem('ph_volCount', volunteers.length);
    localStorage.setItem('ph_subCount', newsletter.length);

    // Generate notifications for new entries
    if (prevVolCount > 0 && volunteers.length > prevVolCount) {
      const diff = volunteers.length - prevVolCount;
      addNotification(`${diff} new volunteer application${diff > 1 ? 's' : ''} received!`, 'volunteer');
    }
    if (prevSubCount > 0 && newsletter.length > prevSubCount) {
      const diff = newsletter.length - prevSubCount;
      addNotification(`${diff} new newsletter subscriber${diff > 1 ? 's' : ''} added!`, 'newsletter');
    }

    renderOverview();
    renderVolunteers();
    renderNewsletter();
    drawMonthlyChart();
    drawRoleChart();
    renderNotifications();
  }

  /* ================================================
     4. OVERVIEW
     ================================================ */
  function renderOverview () {
    $('#statVolunteers').textContent  = volunteers.length;
    $('#statNewsletter').textContent  = newsletter.length;
    $('#statLastUpdate').textContent  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Recent tables
    renderRecentTable('recentVolunteers', volunteers.slice(-5).reverse(), ['Name', 'Email', 'Role', 'Timestamp']);
    renderRecentTable('recentNewsletter', newsletter.slice(-5).reverse(), ['Email', 'Timestamp']);
  }

  function renderRecentTable (id, rows, cols) {
    const tbody = $(`#${id}`);
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="${cols.length}" class="dash-table__empty">No data yet</td></tr>`; return; }
    tbody.innerHTML = rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c] || '—')}</td>`).join('')}</tr>`).join('');
  }

  /* ================================================
     5. CHARTS
     ================================================ */
  function drawMonthlyChart () {
    const canvas = $('#monthlyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth - 16;
    const H = 220;
    canvas.width = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Aggregate by month
    const volMonths = monthCounts(volunteers);
    const subMonths = monthCounts(newsletter);
    const labels = getLast6Months();

    const volData = labels.map(l => volMonths[l] || 0);
    const subData = labels.map(l => subMonths[l] || 0);
    const maxVal  = Math.max(5, ...volData, ...subData);

    const padL = 40, padR = 20, padT = 20, padB = 40;
    const cW = W - padL - padR;
    const cH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = '#a0aec0'; ctx.font = '11px Lato'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padL - 8, y + 4);
    }

    // X labels
    ctx.fillStyle = '#a0aec0'; ctx.font = '11px Lato'; ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      const x = padL + (cW / (labels.length - 1 || 1)) * i;
      ctx.fillText(l, x, H - 10);
    });

    // Draw lines
    drawLine(ctx, volData, maxVal, padL, padT, cW, cH, labels.length, '#3DBFB8', 'Volunteers');
    drawLine(ctx, subData, maxVal, padL, padT, cW, cH, labels.length, '#E8445A', 'Subscribers');

    // Legend
    ctx.font = '12px Lato'; ctx.textAlign = 'left';
    ctx.fillStyle = '#3DBFB8'; ctx.fillRect(padL, H - 2, 12, 4);
    ctx.fillText('Volunteers', padL + 16, H + 2);
    ctx.fillStyle = '#E8445A'; ctx.fillRect(padL + 110, H - 2, 12, 4);
    ctx.fillText('Subscribers', padL + 126, H + 2);
  }

  function drawLine (ctx, data, max, pL, pT, cW, cH, len, color) {
    if (len < 2) return;
    const pts = data.map((v, i) => ({
      x: pL + (cW / (len - 1)) * i,
      y: pT + cH - (v / max) * cH
    }));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
    // dots
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
  }

  function drawRoleChart () {
    const canvas = $('#roleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const roles = {};
    volunteers.forEach(v => {
      const r = v.Role || v.role || 'Other';
      roles[r] = (roles[r] || 0) + 1;
    });

    const entries = Object.entries(roles);
    if (!entries.length) {
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a0aec0'; ctx.font = '13px Lato'; ctx.textAlign = 'center'; ctx.fillText('No data', 100, 104);
      return;
    }

    const colors = ['#3DBFB8', '#E8445A', '#F5A623', '#2D3B55', '#F5C518', '#6C63FF', '#E056A0'];
    const total = entries.reduce((a, [, c]) => a + c, 0);
    let angle = -Math.PI / 2;

    entries.forEach(([label, count], i) => {
      const slice = (count / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(100, 100);
      ctx.arc(100, 100, 80, angle, angle + slice);
      ctx.fillStyle = colors[i % colors.length]; ctx.fill();
      angle += slice;
    });

    // Donut hole
    ctx.beginPath(); ctx.arc(100, 100, 45, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#2D3B55'; ctx.font = 'bold 22px Outfit'; ctx.textAlign = 'center'; ctx.fillText(total, 100, 104);
    ctx.fillStyle = '#a0aec0'; ctx.font = '11px Lato'; ctx.fillText('Total', 100, 118);

    // Legend
    const legend = $('#roleLegend');
    legend.innerHTML = entries.map(([label, count], i) =>
      `<div class="dash-legend-item"><span class="dash-legend-dot" style="background:${colors[i % colors.length]}"></span>${esc(label)}: ${count}</div>`
    ).join('');
  }

  function monthCounts (arr) {
    const counts = {};
    arr.forEach(r => {
      const d = new Date(r.Timestamp || r.timestamp || r.Date);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function getLast6Months () {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    return out;
  }

  /* ================================================
     6. VOLUNTEERS TABLE
     ================================================ */
  function renderVolunteers (filter = '') {
    const tbody = $('#allVolunteers');
    let data = [...volunteers];
    if (filter) data = data.filter(v => JSON.stringify(v).toLowerCase().includes(filter.toLowerCase()));
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="8" class="dash-table__empty">No volunteers found</td></tr>`; return; }

    tbody.innerHTML = data.map((v, i) => {
      const email = v.Email || v.email || '';
      const phone = v.Phone || v.phone || '';
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(v.Name || v.name || '—')}</td>
        <td>${esc(email)}</td>
        <td>${esc(phone || '—')}</td>
        <td>${esc(v.Role || v.role || '—')}</td>
        <td title="${esc(v.Message || v.message || '')}">${esc((v.Message || v.message || '—').substring(0, 30))}</td>
        <td>${esc(v.Timestamp || v.timestamp || '—')}</td>
        <td class="dash-vol-actions">
          <button class="dash-vol-btn dash-vol-btn--view" data-idx="${i}" title="View Details">👁</button>
          <button class="dash-vol-btn dash-vol-btn--email" data-email="${esc(email)}" title="Send Email">✉</button>
          <button class="dash-vol-btn dash-vol-btn--whatsapp" data-phone="${esc(phone)}" title="WhatsApp">💬</button>
        </td>
      </tr>`;
    }).join('');

    // Bind action buttons
    tbody.querySelectorAll('[data-email]').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        if (email && email !== '—') {
          window.location.href = `mailto:${email}`;
        } else {
          alert('No email address available for this volunteer.');
        }
      });
    });
    tbody.querySelectorAll('[data-phone]').forEach(btn => {
      btn.addEventListener('click', () => {
        let phone = btn.dataset.phone.replace(/[\s\-()]/g, '');
        if (!phone || phone === '—') {
          alert('No phone number available for this volunteer.');
          return;
        }
        // Add Jordan country code if not present
        if (phone.startsWith('07')) phone = '962' + phone.substring(1);
        else if (!phone.startsWith('+') && !phone.startsWith('962')) phone = '962' + phone;
        phone = phone.replace('+', '');
        window.open(`https://wa.me/${phone}`, '_blank');
      });
    });
    tbody.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => openVolunteerDetail(parseInt(btn.dataset.idx)));
    });
  }

  $('#searchVolunteers').addEventListener('input', e => renderVolunteers(e.target.value));
  $('#refreshVolunteers').addEventListener('click', loadData);
  $('#exportVolunteers').addEventListener('click', () => exportCSV(volunteers, 'pro-hands-volunteers.csv'));

  /* ================================================
     7. VOLUNTEER DETAIL MODAL
     ================================================ */
  function openVolunteerDetail (idx) {
    const v = volunteers[idx];
    if (!v) return;
    const email = v.Email || v.email || '';
    const key = `row_${idx}`;
    const phone = v.Phone || v.phone || '';
    const notes = volNotes[key] || [];

    // Build WhatsApp link
    let waLink = '';
    if (phone && phone !== '—') {
      let waPhone = phone.replace(/[\s\-()]/g, '');
      if (waPhone.startsWith('07')) waPhone = '962' + waPhone.substring(1);
      else if (!waPhone.startsWith('+') && !waPhone.startsWith('962')) waPhone = '962' + waPhone;
      waPhone = waPhone.replace('+', '');
      waLink = `https://wa.me/${waPhone}`;
    }

    $('#volDetailName').textContent = v.Name || v.name || 'Volunteer Details';
    $('#volDetailBody').innerHTML = `
      <div class="dash-vol-info-grid">
        <div class="dash-vol-info-item"><label>Email</label><span>${esc(email)}</span></div>
        <div class="dash-vol-info-item"><label>Phone</label><span>${esc(phone || '—')}</span></div>
        <div class="dash-vol-info-item"><label>Role</label><span>${esc(v.Role || v.role || '—')}</span></div>
        <div class="dash-vol-info-item"><label>Submitted</label><span>${esc(v.Timestamp || v.timestamp || '—')}</span></div>
        <div class="dash-vol-info-item" style="grid-column:1/-1"><label>Message</label><span>${esc(v.Message || v.message || '—')}</span></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        ${email && email !== '—' ? `<a href="mailto:${esc(email)}" class="btn btn--teal btn--sm" style="text-decoration:none;">✉ Send Email</a>` : ''}
        ${waLink ? `<a href="${waLink}" target="_blank" class="btn btn--sm" style="background:#25D366;color:#fff;text-decoration:none;">💬 WhatsApp</a>` : ''}
      </div>
      <div class="dash-vol-notes">
        <h4>Internal Notes</h4>
        <div class="dash-vol-notes-list" id="volNotesList">${
          notes.length ? notes.map((n, ni) =>
            `<div class="dash-vol-note"><span>${esc(n.text)}</span><br><span class="dash-vol-note__time">${n.time}</span><button class="dash-vol-note__delete" data-ni="${ni}">&times;</button></div>`
          ).join('') : '<p style="color:var(--text-muted);font-size:0.85rem;">No notes yet.</p>'
        }</div>
        <div class="dash-vol-notes-add">
          <input type="text" id="volNoteInput" placeholder="Add a note...">
          <button class="btn btn--teal btn--sm" id="addNoteBtn">Add</button>
        </div>
      </div>`;

    // bind note actions
    $('#addNoteBtn').addEventListener('click', () => {
      const text = $('#volNoteInput').value.trim();
      if (!text) return;
      if (!volNotes[key]) volNotes[key] = [];
      volNotes[key].push({ text, time: new Date().toLocaleString() });
      localStorage.setItem('ph_volNotes', JSON.stringify(volNotes));
      openVolunteerDetail(idx); // re-render
    });
    $$('.dash-vol-note__delete').forEach(btn => {
      btn.addEventListener('click', () => {
        volNotes[key].splice(parseInt(btn.dataset.ni), 1);
        localStorage.setItem('ph_volNotes', JSON.stringify(volNotes));
        openVolunteerDetail(idx);
      });
    });

    openModal('volunteerDetailModal');
  }
  $('#closeVolDetail').addEventListener('click', () => closeModal('volunteerDetailModal'));

  /* ================================================
     8. NEWSLETTER TABLE
     ================================================ */
  function renderNewsletter (filter = '') {
    const tbody = $('#allNewsletter');
    let data = [...newsletter];
    if (filter) data = data.filter(s => JSON.stringify(s).toLowerCase().includes(filter.toLowerCase()));
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="3" class="dash-table__empty">No subscribers found</td></tr>`; return; }
    tbody.innerHTML = data.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.Email || s.email || '—')}</td><td>${esc(s.Timestamp || s.timestamp || '—')}</td></tr>`).join('');
  }

  $('#searchNewsletter').addEventListener('input', e => renderNewsletter(e.target.value));
  $('#refreshNewsletter').addEventListener('click', loadData);
  $('#exportNewsletter').addEventListener('click', () => exportCSV(newsletter, 'pro-hands-newsletter.csv'));

  /* ================================================
     9. CSV EXPORT
     ================================================ */
  function exportCSV (data, filename) {
    if (!data.length) return alert('No data to export.');
    const keys = Object.keys(data[0]);
    const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${(r[k] || '').toString().replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
  }

  /* ================================================
     10. PROJECTS (localStorage-based)
     ================================================ */
  const addProjectBtn = $('#addProjectBtn');
  const addProjectModal = $('#addProjectModal');
  const closeProjectModal = $('#closeProjectModal');
  const addProjectForm = $('#addProjectForm');

  addProjectBtn.addEventListener('click', () => openModal('addProjectModal'));
  closeProjectModal.addEventListener('click', () => closeModal('addProjectModal'));

  addProjectForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(addProjectForm);
    const p = {
      id: Date.now(),
      name: fd.get('projectName'),
      category: fd.get('projectCategory'),
      target: fd.get('projectTarget'),
      status: fd.get('projectStatus'),
      desc: fd.get('projectDesc'),
      progress: 0,
      funding: 0
    };
    projects.push(p);
    save('ph_projects', projects);
    renderProjects();
    closeModal('addProjectModal');
    addProjectForm.reset();
  });

  function renderProjects () {
    const grid = $('#projectsGrid');
    // Keep hardcoded cards, append dynamic ones
    const existingCards = grid.querySelectorAll('.dash-project-card[data-dynamic]');
    existingCards.forEach(c => c.remove());

    const colors = ['teal', 'coral', 'navy', 'orange'];
    projects.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'dash-project-card';
      card.dataset.dynamic = 'true';
      const color = colors[i % colors.length];
      card.innerHTML = `
        <div class="dash-project-card__header dash-project-card__header--${color}">
          <h4>${esc(p.name)}</h4>
          <span class="dash-badge dash-badge--${p.status === 'Active' ? 'active' : p.status === 'Completed' ? 'completed' : 'planning'}">${esc(p.status)}</span>
        </div>
        <div class="dash-project-card__body">
          <div class="dash-project-meta"><span>Category: <strong>${esc(p.category)}</strong></span><span>Target: <strong>${esc(p.target || '—')}</strong></span></div>
          <div class="dash-progress-group"><div class="dash-progress-label"><span>Progress</span><span>${p.progress}%</span></div><div class="dash-progress-bar"><div class="dash-progress-bar__fill" style="width:${p.progress}%"></div></div></div>
          ${p.desc ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">${esc(p.desc)}</p>` : ''}
        </div>
        <div class="dash-project-card__footer"><button class="dash-link" onclick="this.closest('.dash-project-card').remove(); void(0);">Remove</button></div>`;
      grid.appendChild(card);
    });
  }

  /* ================================================
     12. TASKS / TODO
     ================================================ */
  let todoFilter = 'all';

  $('#todoAddForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#todoInput').value.trim();
    if (!text) return;
    todos.push({
      id: Date.now(),
      text,
      priority: $('#todoPriority').value,
      done: false,
      created: new Date().toLocaleDateString()
    });
    save('ph_todos', todos);
    $('#todoInput').value = '';
    renderTodos();
  });

  $$('.dash-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.dash-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      todoFilter = btn.dataset.filter;
      renderTodos();
    });
  });

  function renderTodos () {
    const list = $('#todoList');
    let filtered = [...todos];
    if (todoFilter === 'active')    filtered = filtered.filter(t => !t.done);
    if (todoFilter === 'completed') filtered = filtered.filter(t => t.done);

    const done  = todos.filter(t => t.done).length;
    $('#taskCounter').textContent = `${done} / ${todos.length}`;

    if (!filtered.length) { list.innerHTML = `<li class="dash-todo-empty">${todoFilter === 'completed' ? 'No completed tasks' : todoFilter === 'active' ? 'All tasks completed!' : 'No tasks yet – add one above!'}</li>`; return; }

    list.innerHTML = filtered.map(t => `
      <li class="dash-todo-item${t.done ? ' completed' : ''}" data-id="${t.id}">
        <div class="dash-todo-check${t.done ? ' checked' : ''}" data-toggle="${t.id}"></div>
        <span class="dash-todo-text">${esc(t.text)}</span>
        <span class="dash-todo-priority dash-todo-priority--${t.priority}">${t.priority}</span>
        <button class="dash-todo-delete" data-del="${t.id}">&times;</button>
      </li>`).join('');

    list.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const todo = todos.find(t => t.id === parseInt(el.dataset.toggle));
        if (todo) { todo.done = !todo.done; save('ph_todos', todos); renderTodos(); }
      });
    });
    list.querySelectorAll('[data-del]').forEach(el => {
      el.addEventListener('click', () => {
        todos = todos.filter(t => t.id !== parseInt(el.dataset.del));
        save('ph_todos', todos); renderTodos();
      });
    });
  }

  renderTodos();

  /* ================================================
     13. ANNOUNCEMENTS
     ================================================ */
  $('#addAnnouncementBtn').addEventListener('click', () => openModal('addAnnouncementModal'));
  $('#closeAnnouncementModal').addEventListener('click', () => closeModal('addAnnouncementModal'));

  $('#addAnnouncementForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData($('#addAnnouncementForm'));
    announcements.unshift({
      id: Date.now(),
      title: fd.get('annTitle'),
      category: fd.get('annCategory'),
      message: fd.get('annMessage'),
      date: new Date().toLocaleDateString(),
      author: sessionStorage.getItem('ph_auth') || 'Admin'
    });
    save('ph_announcements', announcements);
    closeModal('addAnnouncementModal');
    $('#addAnnouncementForm').reset();
    renderAnnouncements();
  });

  function renderAnnouncements () {
    const container = $('#announcementsList');
    if (!announcements.length) { container.innerHTML = '<p class="dash-announcements-empty">No announcements yet. Click "+ New Post" to create one.</p>'; return; }

    container.innerHTML = announcements.map(a => `
      <div class="dash-announcement dash-announcement--${a.category.toLowerCase()}">
        <div class="dash-announcement__header">
          <span class="dash-announcement__category dash-announcement__category--${a.category.toLowerCase()}">${esc(a.category)}</span>
          <h4>${esc(a.title)}</h4>
          <button class="dash-announcement__delete" data-aid="${a.id}">&times;</button>
        </div>
        <p>${esc(a.message)}</p>
        <div class="dash-announcement__meta">Posted by <strong>${esc(a.author)}</strong> on ${esc(a.date)}</div>
      </div>`).join('');

    container.querySelectorAll('.dash-announcement__delete').forEach(btn => {
      btn.addEventListener('click', () => {
        announcements = announcements.filter(a => a.id !== parseInt(btn.dataset.aid));
        save('ph_announcements', announcements);
        renderAnnouncements();
      });
    });
  }

  renderAnnouncements();

  /* ================================================
     14. NOTIFICATIONS
     ================================================ */
  const notifBtn   = $('#notifBtn');
  const notifDrop  = $('#notifDropdown');
  const notifBadge = $('#notifBadge');
  const notifList  = $('#notifList');

  notifBtn.addEventListener('click', e => {
    e.stopPropagation();
    notifDrop.classList.toggle('open');
  });
  document.addEventListener('click', e => { if (!notifDrop.contains(e.target)) notifDrop.classList.remove('open'); });
  $('#notifClear').addEventListener('click', () => {
    notifications = [];
    save('ph_notifications', notifications);
    renderNotifications();
  });

  function addNotification (text, type) {
    notifications.unshift({ text, type, time: new Date().toLocaleString(), id: Date.now() });
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    save('ph_notifications', notifications);
    renderNotifications();
  }

  function renderNotifications () {
    const unread = notifications.length;
    if (unread > 0) {
      notifBadge.style.display = '';
      notifBadge.textContent = unread > 99 ? '99+' : unread;
    } else {
      notifBadge.style.display = 'none';
    }

    if (!notifications.length) { notifList.innerHTML = '<p class="dash-notif-empty">No new notifications</p>'; return; }

    notifList.innerHTML = notifications.slice(0, 20).map(n => `
      <div class="dash-notif-item">
        <div class="dash-notif-item__dot" style="background:${n.type === 'volunteer' ? 'var(--teal)' : 'var(--coral)'}"></div>
        <div><div class="dash-notif-item__text">${esc(n.text)}</div><div class="dash-notif-item__time">${esc(n.time)}</div></div>
      </div>`).join('');
  }

  renderNotifications();

  /* ================================================
     15. PDF EXPORT
     ================================================ */
  $('#exportPdfBtn').addEventListener('click', () => {
    const report = window.open('', '_blank');
    report.document.write(`<!DOCTYPE html><html><head><title>Pro Hands Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#2D3B55;}
        h1{color:#3DBFB8;border-bottom:3px solid #3DBFB8;padding-bottom:8px;}
        h2{color:#2D3B55;margin-top:32px;}
        table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;}
        th,td{border:1px solid #ddd;padding:8px 10px;text-align:left;}
        th{background:#2D3B55;color:#fff;}
        .stat{display:inline-block;background:#f7f8fc;padding:12px 24px;margin:4px;border-radius:8px;text-align:center;}
        .stat strong{display:block;font-size:1.4rem;color:#3DBFB8;}
        @media print{body{padding:20px;}}
      </style></head><body>
      <h1>Pro Hands — Dashboard Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
      <div class="stat"><strong>${volunteers.length}</strong>Volunteers</div>
      <div class="stat"><strong>${newsletter.length}</strong>Subscribers</div>
      <div class="stat"><strong>3</strong>Projects</div>
      <h2>Volunteers</h2>
      <table><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr>
      ${volunteers.map((v, i) => {
        const key = v.Email || v.email || `vol_${i}`;
        return `<tr><td>${i + 1}</td><td>${esc(v.Name || v.name || '')}</td><td>${esc(v.Email || v.email || '')}</td><td>${esc(v.Phone || v.phone || '')}</td><td>${esc(v.Role || v.role || '')}</td><td>${volStatuses[key] || 'pending'}</td></tr>`;
      }).join('')}</table>
      <h2>Newsletter Subscribers</h2>
      <table><tr><th>#</th><th>Email</th><th>Date</th></tr>
      ${newsletter.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.Email || s.email || '')}</td><td>${esc(s.Timestamp || s.timestamp || '')}</td></tr>`).join('')}</table>
      <h2>Team Tasks</h2>
      ${todos.length ? `<table><tr><th>Task</th><th>Priority</th><th>Status</th></tr>${todos.map(t=>`<tr><td>${esc(t.text)}</td><td>${t.priority}</td><td>${t.done?'Completed':'Active'}</td></tr>`).join('')}</table>` : '<p>No tasks.</p>'}
      </body></html>`);
    report.document.close();
    setTimeout(() => report.print(), 500);
  });

  /* ================================================
     HELPERS
     ================================================ */
  function openModal (id) { $(`#${id}`).classList.add('open'); }
  function closeModal (id) { $(`#${id}`).classList.remove('open'); }
  function save (key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function esc (str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

  /* Close modals on backdrop click */
  $$('.dash-modal').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  });

  /* Resize handler for charts */
  window.addEventListener('resize', () => { drawMonthlyChart(); drawRoleChart(); });

  /* Init */
  if (!checkSession()) {
    loginScreen.style.display = 'flex';
    dashboard.style.display   = 'none';
  }

  /* Render saved projects */
  renderProjects();

})();
