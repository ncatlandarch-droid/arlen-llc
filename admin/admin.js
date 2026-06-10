/* ============================================
   ARLAN LLC — Admin Dashboard Engine
   "Brilliance in Every Detail"
   ============================================ */

(() => {
  'use strict';

  // ─── CONFIG ─────────────────────────────────────────
  const STORAGE_KEYS = {
    jobs: 'arlan_jobs',
    revenue: 'arlan_revenue',
    expenses: 'arlan_expenses',
    subPayments: 'arlan_sub_payments',
    mileage: 'arlan_mileage',
    subs: 'arlan_subs',
    settings: 'arlan_settings',
    auth: 'arlan_auth',
    remember: 'arlan_remember'
  };

  const IRS_MILEAGE_RATE = 0.70;
  const TAX_SE = 0.153;
  const TAX_FED = 0.22;
  const TAX_NC = 0.045;
  const COOP_RATE = 0.10;

  const SERVICE_LABELS = {
    holiday_lighting: 'Holiday Lighting',
    permanent_led: 'Permanent LED',
    landscape_lighting: 'Landscape Lighting',
    window_cleaning: 'Window Cleaning',
    drone_inspection: 'Drone Inspection',
    other: 'Other'
  };

  const STATUS_LABELS = {
    lead: 'Lead',
    estimate: 'Estimate',
    booked: 'Booked',
    in_progress: 'In Progress',
    complete: 'Complete',
    paid: 'Paid'
  };

  // ─── UTILITY ────────────────────────────────────────
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
  const now = () => new Date().toISOString();
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const fmt = (n, dec = 0) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const pct = (n) => (n * 100).toFixed(0) + '%';
  const today = () => new Date().toISOString().split('T')[0];

  // Simple hash for password (not cryptographically secure — Phase 1)
  async function hashPwd(pwd) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd + '_arlan_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─── STORAGE LAYER ─────────────────────────────────
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function loadArr(key) { return load(key) || []; }

  // ─── DEMO DATA SEED ────────────────────────────────
  function seedDemoData() {
    if (load(STORAGE_KEYS.jobs)) return; // already seeded

    const demoJobs = [
      { id: uuid(), customer: 'Jennifer Roberts', phone: '336-555-0101', email: 'jen@email.com', address: '1234 Elm St, Greensboro, NC', service: 'holiday_lighting', quoted: 2800, status: 'booked', date: '2026-06-15', assigned: 'dylan', source: 'website', notes: 'Large colonial home, roofline + trees', createdAt: now(), updatedAt: now() },
      { id: uuid(), customer: 'Marcus Thompson', phone: '828-555-0202', email: 'marcus@email.com', address: '567 Mountain View Dr, Asheville, NC', service: 'permanent_led', quoted: 4500, status: 'in_progress', date: '2026-06-08', assigned: 'nick', source: 'referral', notes: 'Full roofline permanent LED, color-changing', createdAt: now(), updatedAt: now() },
      { id: uuid(), customer: 'Sarah Palmer', phone: '828-555-0303', email: 'sarah@booneshops.com', address: '890 King St, Boone, NC', service: 'holiday_lighting', quoted: 6200, status: 'estimate', date: '2026-06-20', assigned: 'dylan', source: 'door_hanger', notes: 'Commercial storefront, 3 buildings', createdAt: now(), updatedAt: now() },
      { id: uuid(), customer: 'David Chen', phone: '336-555-0404', email: 'dchen@gmail.com', address: '2345 Oak Ridge Blvd, Greensboro, NC', service: 'landscape_lighting', quoted: 3100, status: 'complete', date: '2026-05-28', assigned: 'dylan', source: 'ai_chat', notes: 'Pathway + uplighting, 12 fixtures', createdAt: now(), updatedAt: now() },
      { id: uuid(), customer: 'Lisa Washington', phone: '336-555-0505', email: 'lisaw@yahoo.com', address: '678 Sunset Dr, Greensboro, NC', service: 'window_cleaning', quoted: 450, status: 'paid', date: '2026-05-15', assigned: 'nick', source: 'flyer', notes: '2-story home, 24 windows', createdAt: now(), updatedAt: now() }
    ];

    const demoRevenue = [
      { id: uuid(), amount: 2800, service: 'holiday_lighting', date: '2026-05-05', method: 'stripe', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 4200, service: 'permanent_led', date: '2026-05-12', method: 'check', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 3100, service: 'landscape_lighting', date: '2026-05-28', method: 'venmo', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 450, service: 'window_cleaning', date: '2026-05-15', method: 'cash', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 1800, service: 'holiday_lighting', date: '2026-06-02', method: 'stripe', linkedJob: '', createdAt: now(), updatedAt: now() }
    ];

    const demoExpenses = [
      { id: uuid(), amount: 420, category: 'materials', description: 'LED light strings & clips bulk order', date: '2026-05-03', deductible: 'yes', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 85, category: 'gas', description: 'Truck fuel — Asheville round trip', date: '2026-05-10', deductible: 'yes', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 250, category: 'insurance', description: 'Monthly GL insurance premium', date: '2026-05-01', deductible: 'yes', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 180, category: 'marketing', description: 'Door hanger printing — 500 count', date: '2026-05-08', deductible: 'yes', createdAt: now(), updatedAt: now() },
      { id: uuid(), amount: 75, category: 'tools', description: 'Replacement drill battery set', date: '2026-05-20', deductible: 'yes', createdAt: now(), updatedAt: now() }
    ];

    const demoSubs = [
      { id: uuid(), name: 'Nick', llcName: '', phone: '336-555-0606', email: 'nick@email.com', ein: '', w9: 'not_received', createdAt: now(), updatedAt: now() }
    ];

    const demoSubPayments = [
      { id: uuid(), subId: demoSubs[0].id, amount: 450, date: '2026-05-16', jobRef: '', service: 'window_cleaning', createdAt: now(), updatedAt: now() },
      { id: uuid(), subId: demoSubs[0].id, amount: 800, date: '2026-05-30', jobRef: '', service: 'permanent_led', createdAt: now(), updatedAt: now() }
    ];

    const demoMileage = [
      { id: uuid(), date: '2026-05-05', from: 'Greensboro HQ', to: 'Elm St Job', miles: 12, purpose: 'Holiday lighting install', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), date: '2026-05-10', from: 'Greensboro HQ', to: 'Asheville, NC', miles: 165, purpose: 'Permanent LED consultation', linkedJob: '', createdAt: now(), updatedAt: now() },
      { id: uuid(), date: '2026-05-15', from: 'Greensboro HQ', to: 'Sunset Dr', miles: 8, purpose: 'Window cleaning job', linkedJob: '', createdAt: now(), updatedAt: now() }
    ];

    save(STORAGE_KEYS.jobs, demoJobs);
    save(STORAGE_KEYS.revenue, demoRevenue);
    save(STORAGE_KEYS.expenses, demoExpenses);
    save(STORAGE_KEYS.subs, demoSubs);
    save(STORAGE_KEYS.subPayments, demoSubPayments);
    save(STORAGE_KEYS.mileage, demoMileage);
  }

  // ─── AUTH ───────────────────────────────────────────
  async function initAuth() {
    let storedHash = load(STORAGE_KEYS.auth);
    if (!storedHash) {
      storedHash = await hashPwd('arlan2026');
      save(STORAGE_KEYS.auth, storedHash);
    }

    // Check remember me
    const remembered = load(STORAGE_KEYS.remember);
    if (remembered === true) {
      showDashboard();
      return;
    }

    // Show login
    $('#loginScreen').style.display = 'flex';
    $('#dashboard').style.display = 'none';
    $('#mobileNav').style.display = 'none';

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = $('#loginPassword').value;
      const hash = await hashPwd(pwd);
      if (hash === load(STORAGE_KEYS.auth)) {
        if ($('#rememberMe').checked) save(STORAGE_KEYS.remember, true);
        showDashboard();
      } else {
        $('#loginError').textContent = 'Incorrect password. Try again.';
        $('#loginPassword').value = '';
        $('#loginPassword').focus();
      }
    });

    // Toggle password visibility
    $('#togglePwdVis').addEventListener('click', () => {
      const inp = $('#loginPassword');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  }

  function showDashboard() {
    $('#loginScreen').style.display = 'none';
    $('#dashboard').style.display = 'flex';
    if (window.innerWidth <= 768) {
      $('#mobileNav').style.display = 'flex';
    }
    initDashboard();
  }

  // ─── DASHBOARD INIT ────────────────────────────────
  function initDashboard() {
    seedDemoData();
    setupClock();
    setupNav();
    setupModals();
    setupJobsTab();
    setupFinancesTab();
    setupTaxTab();
    setupSubsTab();
    setupSettings();
    renderAll();
  }

  // ─── CLOCK ──────────────────────────────────────────
  function setupClock() {
    const dateEl = $('#topbarDate');
    const clockEl = $('#topbarClock');
    function tick() {
      const d = new Date();
      dateEl.textContent = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      clockEl.textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── NAVIGATION ────────────────────────────────────
  function setupNav() {
    const allTabBtns = $$('[data-tab]');
    allTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        // Update sidebar
        $$('.sidebar__link').forEach(b => b.classList.remove('active'));
        $$('.sidebar__link[data-tab="' + tab + '"]').forEach(b => b.classList.add('active'));
        // Update mobile nav
        $$('.mobile-nav__btn').forEach(b => b.classList.remove('active'));
        $$('.mobile-nav__btn[data-tab="' + tab + '"]').forEach(b => b.classList.add('active'));
        // Show panel
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = $('#panel-' + tab);
        if (panel) panel.classList.add('active');
        // Close mobile sidebar
        $('#sidebar').classList.remove('open');
        // Re-render active tab
        renderAll();
      });
    });

    // Mobile menu toggle
    $('#mobileMenuBtn').addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      const sidebar = $('#sidebar');
      const menuBtn = $('#mobileMenuBtn');
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ─── MODAL SYSTEM ──────────────────────────────────
  function openModal(id) {
    const modal = $('#' + id);
    if (modal) modal.classList.add('open');
  }

  function closeModal(id) {
    const modal = $('#' + id);
    if (modal) modal.classList.remove('open');
  }

  function setupModals() {
    // Close buttons
    $$('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    // Overlay click to close
    $$('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });
  }

  // ─── TOAST ─────────────────────────────────────────
  function toast(message, type = 'success') {
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast' + (type !== 'success' ? ' toast--' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  // ─── RENDER ALL ────────────────────────────────────
  function renderAll() {
    renderJobsKPIs();
    renderPipeline();
    renderFinancesKPIs();
    renderCharts();
    renderPNL();
    renderTaxCalc();
    renderDueDates();
    renderDeductions();
    renderMileage();
    renderYearEnd();
    renderSubs();
    renderSubJobs();
    renderSubPayments();
    render1099();
  }

  // ═══════════════════════════════════════════════════
  //  TAB 1: JOBS & APPOINTMENTS
  // ═══════════════════════════════════════════════════
  function setupJobsTab() {
    // Add Job button
    $('#btnAddJob').addEventListener('click', () => {
      resetJobForm();
      $('#modalJobTitle').textContent = 'Add New Job';
      $('#btnDeleteJob').style.display = 'none';
      openModal('modalJob');
    });

    // Job form submit
    $('#formJob').addEventListener('submit', (e) => {
      e.preventDefault();
      saveJob();
    });

    // Delete job
    $('#btnDeleteJob').addEventListener('click', () => {
      const id = $('#jobId').value;
      if (id && confirm('Delete this job?')) {
        let jobs = loadArr(STORAGE_KEYS.jobs);
        jobs = jobs.filter(j => j.id !== id);
        save(STORAGE_KEYS.jobs, jobs);
        closeModal('modalJob');
        renderAll();
        toast('Job deleted');
      }
    });

    // Pipeline / Calendar toggle
    $$('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        $('#pipelineView').style.display = view === 'pipeline' ? 'grid' : 'none';
        $('#calendarView').style.display = view === 'calendar' ? 'block' : 'none';
        if (view === 'calendar') renderCalendar();
      });
    });

    // Filters
    $('#filterService').addEventListener('change', renderPipeline);
    $('#filterStatus').addEventListener('change', renderPipeline);

    // Calendar nav
    let calMonth = new Date().getMonth();
    let calYear = new Date().getFullYear();
    let calViewMode = 'month';

    $('#calPrev').addEventListener('click', () => {
      if (calViewMode === 'month') {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
      } else {
        calMonth--; // simplified week nav
        if (calMonth < 0) { calMonth = 11; calYear--; }
      }
      renderCalendar();
    });

    $('#calNext').addEventListener('click', () => {
      if (calViewMode === 'month') {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
      } else {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
      }
      renderCalendar();
    });

    $$('[data-calview]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-calview]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calViewMode = btn.dataset.calview;
        renderCalendar();
      });
    });

    window._calState = { get month() { return calMonth; }, get year() { return calYear; }, get mode() { return calViewMode; } };
  }

  function resetJobForm() {
    $('#jobId').value = '';
    $('#jobCustomer').value = '';
    $('#jobPhone').value = '';
    $('#jobEmail').value = '';
    $('#jobAddress').value = '';
    $('#jobService').value = '';
    $('#jobQuoted').value = '';
    $('#jobStatus').value = 'lead';
    $('#jobDate').value = today();
    $('#jobAssigned').value = 'dylan';
    $('#jobSource').value = 'website';
    $('#jobNotes').value = '';
  }

  function saveJob() {
    let jobs = loadArr(STORAGE_KEYS.jobs);
    const id = $('#jobId').value;
    const jobData = {
      customer: $('#jobCustomer').value,
      phone: $('#jobPhone').value,
      email: $('#jobEmail').value,
      address: $('#jobAddress').value,
      service: $('#jobService').value,
      quoted: parseFloat($('#jobQuoted').value) || 0,
      status: $('#jobStatus').value,
      date: $('#jobDate').value || today(),
      assigned: $('#jobAssigned').value,
      source: $('#jobSource').value,
      notes: $('#jobNotes').value,
      updatedAt: now()
    };

    if (id) {
      const idx = jobs.findIndex(j => j.id === id);
      if (idx >= 0) {
        jobs[idx] = { ...jobs[idx], ...jobData };
      }
      toast('Job updated');
    } else {
      jobData.id = uuid();
      jobData.createdAt = now();
      jobs.push(jobData);
      toast('Job created');
    }

    save(STORAGE_KEYS.jobs, jobs);
    closeModal('modalJob');
    renderAll();
  }

  function editJob(id) {
    const jobs = loadArr(STORAGE_KEYS.jobs);
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    $('#modalJobTitle').textContent = 'Edit Job';
    $('#btnDeleteJob').style.display = 'block';
    $('#jobId').value = job.id;
    $('#jobCustomer').value = job.customer || '';
    $('#jobPhone').value = job.phone || '';
    $('#jobEmail').value = job.email || '';
    $('#jobAddress').value = job.address || '';
    $('#jobService').value = job.service || '';
    $('#jobQuoted').value = job.quoted || '';
    $('#jobStatus').value = job.status || 'lead';
    $('#jobDate').value = job.date || '';
    $('#jobAssigned').value = job.assigned || 'dylan';
    $('#jobSource').value = job.source || 'website';
    $('#jobNotes').value = job.notes || '';
    openModal('modalJob');
  }

  function renderJobsKPIs() {
    const jobs = loadArr(STORAGE_KEYS.jobs);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthJobs = jobs.filter(j => {
      const d = new Date(j.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const totalPipeline = jobs.reduce((s, j) => s + (j.quoted || 0), 0);
    const closedStatuses = ['booked', 'in_progress', 'complete', 'paid'];
    const closed = jobs.filter(j => closedStatuses.includes(j.status)).length;
    const closeRate = jobs.length > 0 ? closed / jobs.length : 0;
    const avgJob = jobs.length > 0 ? totalPipeline / jobs.length : 0;

    $('#kpiJobsMonth').textContent = monthJobs.length;
    $('#kpiPipeline').textContent = fmt(totalPipeline);
    $('#kpiCloseRate').textContent = pct(closeRate);
    $('#kpiAvgJob').textContent = fmt(avgJob);
  }

  function renderPipeline() {
    const jobs = loadArr(STORAGE_KEYS.jobs);
    const serviceFilter = $('#filterService').value;
    const statusFilter = $('#filterStatus').value;

    let filtered = jobs;
    if (serviceFilter) filtered = filtered.filter(j => j.service === serviceFilter);
    if (statusFilter) filtered = filtered.filter(j => j.status === statusFilter);

    const statuses = ['lead', 'estimate', 'booked', 'in_progress', 'complete', 'paid'];
    const colIds = { lead: 'colLead', estimate: 'colEstimate', booked: 'colBooked', in_progress: 'colInProgress', complete: 'colComplete', paid: 'colPaid' };
    const countIds = { lead: 'countLead', estimate: 'countEstimate', booked: 'countBooked', in_progress: 'countInProgress', complete: 'countComplete', paid: 'countPaid' };

    statuses.forEach(status => {
      const col = $('#' + colIds[status]);
      const statusJobs = filtered.filter(j => j.status === status);
      $('#' + countIds[status]).textContent = statusJobs.length;

      col.innerHTML = statusJobs.map(job => `
        <div class="job-card" data-job-id="${job.id}">
          <div class="job-card__assigned">${(job.assigned || 'D')[0].toUpperCase()}</div>
          <div class="job-card__name">${escHtml(job.customer)}</div>
          <span class="job-card__service service--${job.service}">${SERVICE_LABELS[job.service] || job.service}</span>
          <div class="job-card__meta">
            ${job.address ? '<span>📍 ' + escHtml(truncate(job.address, 30)) + '</span>' : ''}
            <span>📅 ${formatDate(job.date)}</span>
          </div>
          ${job.quoted ? '<div class="job-card__amount">' + fmt(job.quoted) + '</div>' : ''}
        </div>
      `).join('');

      // Click to edit
      col.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', () => editJob(card.dataset.jobId));
      });
    });
  }

  function renderCalendar() {
    const state = window._calState;
    const grid = $('#calGrid');
    const title = $('#calTitle');
    const d = new Date(state.year, state.month, 1);
    title.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const jobs = loadArr(STORAGE_KEYS.jobs);
    const firstDay = d.getDay();
    const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    const todayDate = new Date();

    let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-header">${d}</div>`).join('');

    // Previous month days
    const prevMonthDays = new Date(state.year, state.month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-day other-month"><div class="cal-day__number">${prevMonthDays - i}</div></div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = todayDate.getDate() === day && todayDate.getMonth() === state.month && todayDate.getFullYear() === state.year;
      const dayJobs = jobs.filter(j => j.date === dateStr);

      html += `<div class="cal-day${isToday ? ' today' : ''}">
        <div class="cal-day__number">${day}</div>
        ${dayJobs.slice(0, 3).map(j => `<div class="cal-day__job" data-job-id="${j.id}">${escHtml(truncate(j.customer, 12))}</div>`).join('')}
        ${dayJobs.length > 3 ? `<div style="font-size:9px;color:var(--text-muted);">+${dayJobs.length - 3} more</div>` : ''}
      </div>`;
    }

    // Fill remaining cells
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="cal-day other-month"><div class="cal-day__number">${i}</div></div>`;
    }

    grid.innerHTML = html;

    // Click calendar job to edit
    grid.querySelectorAll('.cal-day__job').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        editJob(el.dataset.jobId);
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  TAB 2: FINANCES
  // ═══════════════════════════════════════════════════
  let revenueChart = null;
  let serviceChart = null;

  function setupFinancesTab() {
    // Log Revenue
    $('#btnLogRevenue').addEventListener('click', () => {
      $('#revId').value = '';
      $('#revAmount').value = '';
      $('#revService').value = 'holiday_lighting';
      $('#revDate').value = today();
      $('#revMethod').value = 'cash';
      populateJobDropdown('revLinkedJob');
      openModal('modalRevenue');
    });

    $('#formRevenue').addEventListener('submit', (e) => {
      e.preventDefault();
      const rev = loadArr(STORAGE_KEYS.revenue);
      rev.push({
        id: uuid(), amount: parseFloat($('#revAmount').value) || 0,
        service: $('#revService').value, date: $('#revDate').value || today(),
        method: $('#revMethod').value, linkedJob: $('#revLinkedJob').value,
        createdAt: now(), updatedAt: now()
      });
      save(STORAGE_KEYS.revenue, rev);
      closeModal('modalRevenue');
      renderAll();
      toast('Revenue logged');
    });

    // Log Expense
    $('#btnLogExpense').addEventListener('click', () => {
      $('#expId').value = '';
      $('#expAmount').value = '';
      $('#expCategory').value = 'materials';
      $('#expDescription').value = '';
      $('#expDate').value = today();
      $('#expDeductible').value = 'yes';
      openModal('modalExpense');
    });

    $('#formExpense').addEventListener('submit', (e) => {
      e.preventDefault();
      const exp = loadArr(STORAGE_KEYS.expenses);
      exp.push({
        id: uuid(), amount: parseFloat($('#expAmount').value) || 0,
        category: $('#expCategory').value, description: $('#expDescription').value,
        date: $('#expDate').value || today(), deductible: $('#expDeductible').value,
        createdAt: now(), updatedAt: now()
      });
      save(STORAGE_KEYS.expenses, exp);
      closeModal('modalExpense');
      renderAll();
      toast('Expense logged');
    });

    // Period toggle
    $$('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFinancesKPIs();
        renderPNL();
      });
    });

    // Export CSV
    $('#btnExportCSV').addEventListener('click', exportFinanceCSV);
  }

  function getActivePeriod() {
    const active = document.querySelector('[data-period].active');
    return active ? active.dataset.period : 'monthly';
  }

  function filterByPeriod(arr, dateField = 'date') {
    const period = getActivePeriod();
    const now2 = new Date();
    const year = now2.getFullYear();
    const month = now2.getMonth();
    const quarter = Math.floor(month / 3);

    return arr.filter(item => {
      const d = new Date(item[dateField]);
      if (period === 'monthly') return d.getMonth() === month && d.getFullYear() === year;
      if (period === 'quarterly') return Math.floor(d.getMonth() / 3) === quarter && d.getFullYear() === year;
      if (period === 'ytd') return d.getFullYear() === year;
      return true;
    });
  }

  function renderFinancesKPIs() {
    const revenue = filterByPeriod(loadArr(STORAGE_KEYS.revenue));
    const expenses = filterByPeriod(loadArr(STORAGE_KEYS.expenses));

    const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRev - totalExp;
    const coop = netProfit > 0 ? netProfit * COOP_RATE : 0;
    const afterCoop = netProfit - coop;
    const chrisSplit = afterCoop > 0 ? afterCoop * 0.5 : 0;
    const dylanSplit = afterCoop > 0 ? afterCoop * 0.5 : 0;

    $('#kpiRevenue').textContent = fmt(totalRev);
    $('#kpiExpenses').textContent = fmt(totalExp);
    $('#kpiNetProfit').textContent = fmt(netProfit);
    $('#kpiNetProfit').className = 'kpi-card__value ' + (netProfit >= 0 ? 'kpi--positive' : 'kpi--negative');
    $('#kpiCoop').textContent = fmt(coop);
    $('#kpiChris').textContent = fmt(chrisSplit);
    $('#kpiDylan').textContent = fmt(dylanSplit);
  }

  function renderCharts() {
    renderRevenueChart();
    renderServiceChart();
  }

  function renderRevenueChart() {
    const revenue = loadArr(STORAGE_KEYS.revenue);
    const year = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);

    revenue.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year) data[d.getMonth()] += r.amount;
    });

    const ctx = $('#chartRevenue');
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue',
          data: data,
          backgroundColor: 'rgba(245, 166, 35, 0.6)',
          borderColor: '#f5a623',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 31, 56, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { label: ctx => fmt(ctx.raw) }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', callback: v => '$' + v.toLocaleString(), font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderServiceChart() {
    const revenue = loadArr(STORAGE_KEYS.revenue);
    const byService = {};
    revenue.forEach(r => {
      byService[r.service] = (byService[r.service] || 0) + r.amount;
    });

    const labels = Object.keys(byService).map(k => SERVICE_LABELS[k] || k);
    const data = Object.values(byService);
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f5a623', '#64748b'];

    const ctx = $('#chartService');
    if (serviceChart) serviceChart.destroy();
    serviceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: 'rgba(10, 22, 40, 0.8)',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 31, 56, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { label: ctx => ctx.label + ': ' + fmt(ctx.raw) }
          }
        }
      }
    });
  }

  function renderPNL() {
    const revenue = filterByPeriod(loadArr(STORAGE_KEYS.revenue));
    const expenses = filterByPeriod(loadArr(STORAGE_KEYS.expenses));
    const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRev - totalExp;
    const coop = netProfit > 0 ? netProfit * COOP_RATE : 0;
    const afterCoop = netProfit - coop;
    const chrisSplit = afterCoop > 0 ? afterCoop * 0.5 : 0;
    const dylanSplit = afterCoop > 0 ? afterCoop * 0.5 : 0;

    // Expense breakdown by category
    const expByCat = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      expByCat[cat] = (expByCat[cat] || 0) + e.amount;
    });

    const period = getActivePeriod();
    const periodLabel = period === 'ytd' ? 'Year-to-Date' : period === 'quarterly' ? 'Quarterly' : 'Monthly';

    let html = `
      <div class="pnl-row pnl-row--header"><span>Profit & Loss — ${periodLabel}</span><span></span></div>
      <div class="pnl-row"><span class="pnl-row__label">Total Revenue</span><span class="pnl-row__value kpi--positive">${fmt(totalRev)}</span></div>
    `;

    Object.entries(expByCat).forEach(([cat, amt]) => {
      html += `<div class="pnl-row"><span class="pnl-row__label">&nbsp;&nbsp;${capitalize(cat.replace(/_/g, ' '))}</span><span class="pnl-row__value kpi--negative">-${fmt(amt)}</span></div>`;
    });

    html += `
      <div class="pnl-row"><span class="pnl-row__label"><strong>Total Expenses</strong></span><span class="pnl-row__value kpi--negative">-${fmt(totalExp)}</span></div>
      <div class="pnl-row pnl-row--total"><span>Net Profit</span><span>${fmt(netProfit)}</span></div>
      <div class="pnl-row"><span class="pnl-row__label">Co-op Share (10%)</span><span class="pnl-row__value">-${fmt(coop)}</span></div>
      <div class="pnl-row"><span class="pnl-row__label">Chris's Split (50%)</span><span class="pnl-row__value">${fmt(chrisSplit)}</span></div>
      <div class="pnl-row"><span class="pnl-row__label">Dylan's Split (50%)</span><span class="pnl-row__value">${fmt(dylanSplit)}</span></div>
    `;

    $('#pnlTable').innerHTML = html;
  }

  function exportFinanceCSV() {
    const revenue = loadArr(STORAGE_KEYS.revenue);
    const expenses = loadArr(STORAGE_KEYS.expenses);

    let csv = 'Type,Amount,Service/Category,Description,Date,Method\n';
    revenue.forEach(r => {
      csv += `Revenue,${r.amount},${SERVICE_LABELS[r.service] || r.service},,${r.date},${r.method}\n`;
    });
    expenses.forEach(e => {
      csv += `Expense,${e.amount},${capitalize(e.category || '')},${e.description || ''},${e.date},\n`;
    });

    downloadFile(csv, 'arlan_finances_' + today() + '.csv', 'text/csv');
    toast('CSV exported');
  }

  // ═══════════════════════════════════════════════════
  //  TAB 3: TAX PREP
  // ═══════════════════════════════════════════════════
  function setupTaxTab() {
    // Mileage
    $('#btnAddMileage').addEventListener('click', () => {
      $('#mileDate').value = today();
      $('#mileMiles').value = '';
      $('#mileFrom').value = '';
      $('#mileTo').value = '';
      $('#milePurpose').value = '';
      populateJobDropdown('mileLinkedJob');
      openModal('modalMileage');
    });

    $('#formMileage').addEventListener('submit', (e) => {
      e.preventDefault();
      const mileage = loadArr(STORAGE_KEYS.mileage);
      mileage.push({
        id: uuid(), date: $('#mileDate').value || today(),
        miles: parseFloat($('#mileMiles').value) || 0,
        from: $('#mileFrom').value, to: $('#mileTo').value,
        purpose: $('#milePurpose').value, linkedJob: $('#mileLinkedJob').value,
        createdAt: now(), updatedAt: now()
      });
      save(STORAGE_KEYS.mileage, mileage);
      closeModal('modalMileage');
      renderAll();
      toast('Mileage logged');
    });

    // Export tax CSV
    $('#btnExportTaxCSV').addEventListener('click', exportTaxCSV);
  }

  function renderTaxCalc() {
    const year = new Date().getFullYear();
    const revenue = loadArr(STORAGE_KEYS.revenue).filter(r => new Date(r.date).getFullYear() === year);
    const expenses = loadArr(STORAGE_KEYS.expenses).filter(e => new Date(e.date).getFullYear() === year);
    const mileage = loadArr(STORAGE_KEYS.mileage).filter(m => new Date(m.date).getFullYear() === year);

    const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const mileDeduction = mileage.reduce((s, m) => s + (m.miles || 0), 0) * IRS_MILEAGE_RATE;
    const netIncome = Math.max(0, totalRev - totalExp - mileDeduction);

    const seTax = netIncome * TAX_SE;
    const fedTax = netIncome * TAX_FED;
    const stateTax = netIncome * TAX_NC;
    const totalTax = seTax + fedTax + stateTax;
    const setAside = netIncome * 0.275; // midpoint of 25-30%

    $('#kpiSETax').textContent = fmt(seTax);
    $('#kpiFedTax').textContent = fmt(fedTax);
    $('#kpiStateTax').textContent = fmt(stateTax);
    $('#kpiTotalTax').textContent = fmt(totalTax);
    $('#taxSetAside').textContent = fmt(setAside);
  }

  function renderDueDates() {
    const year = new Date().getFullYear();
    const dueDates = [
      { label: 'Q1 (Jan-Mar)', date: new Date(year, 3, 15) },      // Apr 15
      { label: 'Q2 (Apr-May)', date: new Date(year, 5, 15) },      // Jun 15
      { label: 'Q3 (Jun-Aug)', date: new Date(year, 8, 15) },      // Sep 15
      { label: 'Q4 (Sep-Dec)', date: new Date(year + 1, 0, 15) }   // Jan 15
    ];

    const today2 = new Date();
    const container = $('#dueDateCards');
    container.innerHTML = dueDates.map(dd => {
      const diff = Math.ceil((dd.date - today2) / (1000 * 60 * 60 * 24));
      let statusClass = 'due-card--upcoming';
      let statusLabel = diff + ' days left';
      if (diff < 0) {
        statusClass = 'due-card--overdue';
        statusLabel = Math.abs(diff) + ' days overdue';
      } else if (diff === 0) {
        statusLabel = 'DUE TODAY';
        statusClass = 'due-card--overdue';
      } else if (diff > 90) {
        statusClass = 'due-card--past';
      }

      return `<div class="due-card ${statusClass}">
        <div class="due-card__date">${dd.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div class="due-card__days">${diff < 0 ? Math.abs(diff) : diff}</div>
        <div class="due-card__label">${statusLabel}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${dd.label}</div>
      </div>`;
    }).join('');
  }

  function renderDeductions() {
    const expenses = loadArr(STORAGE_KEYS.expenses).filter(e => e.deductible === 'yes');
    const tbody = $('#deductionsBody');

    if (expenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No deductible expenses yet</td></tr>';
      return;
    }

    tbody.innerHTML = expenses.sort((a, b) => b.date?.localeCompare(a.date)).map(e => `
      <tr>
        <td><span class="job-card__service service--${e.category}" style="font-size:11px;">${capitalize(e.category?.replace(/_/g, ' ') || '')}</span></td>
        <td>${escHtml(e.description || '')}</td>
        <td class="text-emerald">${fmt(e.amount)}</td>
        <td>${formatDate(e.date)}</td>
      </tr>
    `).join('');
  }

  function renderMileage() {
    const mileage = loadArr(STORAGE_KEYS.mileage);
    const totalMiles = mileage.reduce((s, m) => s + (m.miles || 0), 0);
    const deduction = totalMiles * IRS_MILEAGE_RATE;

    $('#kpiTotalMiles').textContent = totalMiles.toLocaleString();
    $('#kpiMileageDeduction').textContent = fmt(deduction);

    const tbody = $('#mileageBody');
    if (mileage.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No mileage entries yet</td></tr>';
      return;
    }

    tbody.innerHTML = mileage.sort((a, b) => b.date?.localeCompare(a.date)).map(m => `
      <tr>
        <td>${formatDate(m.date)}</td>
        <td>${escHtml(m.from || '')}</td>
        <td>${escHtml(m.to || '')}</td>
        <td>${m.miles}</td>
        <td>${escHtml(m.purpose || '')}</td>
        <td class="text-emerald">${fmt(m.miles * IRS_MILEAGE_RATE)}</td>
      </tr>
    `).join('');
  }

  function renderYearEnd() {
    const year = new Date().getFullYear();
    const revenue = loadArr(STORAGE_KEYS.revenue).filter(r => new Date(r.date).getFullYear() === year);
    const expenses = loadArr(STORAGE_KEYS.expenses).filter(e => new Date(e.date).getFullYear() === year);
    const deductible = expenses.filter(e => e.deductible === 'yes');
    const mileage = loadArr(STORAGE_KEYS.mileage).filter(m => new Date(m.date).getFullYear() === year);

    const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDed = deductible.reduce((s, e) => s + e.amount, 0) + mileage.reduce((s, m) => s + (m.miles || 0), 0) * IRS_MILEAGE_RATE;
    const netTaxable = Math.max(0, totalRev - totalExp - (mileage.reduce((s, m) => s + (m.miles || 0), 0) * IRS_MILEAGE_RATE));
    const estTax = netTaxable * (TAX_SE + TAX_FED + TAX_NC);

    $('#kpiYTDRevenue').textContent = fmt(totalRev);
    $('#kpiYTDExpenses').textContent = fmt(totalExp);
    $('#kpiTotalDeductions').textContent = fmt(totalDed);
    $('#kpiEstTax').textContent = fmt(estTax);
  }

  function exportTaxCSV() {
    const expenses = loadArr(STORAGE_KEYS.expenses).filter(e => e.deductible === 'yes');
    const mileage = loadArr(STORAGE_KEYS.mileage);

    let csv = 'Type,Category,Description,Amount,Date,Miles,Deduction\n';
    expenses.forEach(e => {
      csv += `Expense,${e.category},${e.description || ''},${e.amount},${e.date},,\n`;
    });
    mileage.forEach(m => {
      csv += `Mileage,,${m.purpose || ''},${(m.miles * IRS_MILEAGE_RATE).toFixed(2)},${m.date},${m.miles},${(m.miles * IRS_MILEAGE_RATE).toFixed(2)}\n`;
    });

    downloadFile(csv, 'arlan_tax_prep_' + today() + '.csv', 'text/csv');
    toast('Tax CSV exported');
  }

  // ═══════════════════════════════════════════════════
  //  TAB 4: SUBCONTRACTORS
  // ═══════════════════════════════════════════════════
  function setupSubsTab() {
    // Add Sub
    $('#btnAddSub').addEventListener('click', () => {
      $('#subId').value = '';
      $('#subName').value = '';
      $('#subLLC').value = '';
      $('#subPhone').value = '';
      $('#subEmail').value = '';
      $('#subEIN').value = '';
      $('#subW9').value = 'not_received';
      openModal('modalSub');
    });

    $('#formSub').addEventListener('submit', (e) => {
      e.preventDefault();
      let subs = loadArr(STORAGE_KEYS.subs);
      const id = $('#subId').value;
      const subData = {
        name: $('#subName').value, llcName: $('#subLLC').value,
        phone: $('#subPhone').value, email: $('#subEmail').value,
        ein: $('#subEIN').value, w9: $('#subW9').value,
        updatedAt: now()
      };

      if (id) {
        const idx = subs.findIndex(s => s.id === id);
        if (idx >= 0) subs[idx] = { ...subs[idx], ...subData };
        toast('Subcontractor updated');
      } else {
        subData.id = uuid();
        subData.createdAt = now();
        subs.push(subData);
        toast('Subcontractor added');
      }

      save(STORAGE_KEYS.subs, subs);
      closeModal('modalSub');
      renderAll();
    });

    // Add Sub Payment
    $('#btnAddSubPayment').addEventListener('click', () => {
      populateSubDropdown('spSub');
      populateJobDropdown('spJob');
      $('#spAmount').value = '';
      $('#spDate').value = today();
      $('#spService').value = 'holiday_lighting';
      openModal('modalSubPayment');
    });

    $('#formSubPayment').addEventListener('submit', (e) => {
      e.preventDefault();
      const payments = loadArr(STORAGE_KEYS.subPayments);
      payments.push({
        id: uuid(), subId: $('#spSub').value,
        amount: parseFloat($('#spAmount').value) || 0,
        date: $('#spDate').value || today(),
        jobRef: $('#spJob').value,
        service: $('#spService').value,
        createdAt: now(), updatedAt: now()
      });
      save(STORAGE_KEYS.subPayments, payments);
      closeModal('modalSubPayment');
      renderAll();
      toast('Sub payment recorded');
    });
  }

  function renderSubs() {
    const subs = loadArr(STORAGE_KEYS.subs);
    const grid = $('#subsGrid');

    if (subs.length === 0) {
      grid.innerHTML = '<div class="glass-panel" style="text-align:center;color:var(--text-muted);">No subcontractors yet. Click "Add Subcontractor" to start.</div>';
      return;
    }

    grid.innerHTML = subs.map(s => `
      <div class="sub-card">
        <div class="sub-card__header">
          <div class="sub-card__name">${escHtml(s.name)}</div>
          <span class="sub-card__w9 sub-card__w9--${s.w9 === 'received' ? 'received' : 'pending'}">${s.w9 === 'received' ? '✓ W-9 Received' : '⚠ W-9 Needed'}</span>
        </div>
        <div class="sub-card__details">
          ${s.llcName ? `<div class="sub-card__detail"><span class="sub-card__detail-label">LLC</span><span>${escHtml(s.llcName)}</span></div>` : ''}
          ${s.phone ? `<div class="sub-card__detail"><span class="sub-card__detail-label">Phone</span><span>${escHtml(s.phone)}</span></div>` : ''}
          ${s.email ? `<div class="sub-card__detail"><span class="sub-card__detail-label">Email</span><span>${escHtml(s.email)}</span></div>` : ''}
          ${s.ein ? `<div class="sub-card__detail"><span class="sub-card__detail-label">EIN</span><span>${escHtml(s.ein)}</span></div>` : ''}
        </div>
        <div class="sub-card__actions">
          <button class="btn btn--sm btn--outline" onclick="window._editSub('${s.id}')">Edit</button>
        </div>
      </div>
    `).join('');
  }

  window._editSub = function (id) {
    const subs = loadArr(STORAGE_KEYS.subs);
    const s = subs.find(sub => sub.id === id);
    if (!s) return;
    $('#subId').value = s.id;
    $('#subName').value = s.name || '';
    $('#subLLC').value = s.llcName || '';
    $('#subPhone').value = s.phone || '';
    $('#subEmail').value = s.email || '';
    $('#subEIN').value = s.ein || '';
    $('#subW9').value = s.w9 || 'not_received';
    openModal('modalSub');
  };

  function renderSubJobs() {
    const jobs = loadArr(STORAGE_KEYS.jobs).filter(j => j.assigned && j.assigned !== 'dylan');
    const tbody = $('#subJobsBody');

    if (jobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No sub-assigned jobs</td></tr>';
      return;
    }

    tbody.innerHTML = jobs.map(j => `
      <tr>
        <td>${escHtml(j.customer)}</td>
        <td><span class="job-card__service service--${j.service}" style="font-size:11px;">${SERVICE_LABELS[j.service] || j.service}</span></td>
        <td>${fmt(j.quoted)}</td>
        <td>${STATUS_LABELS[j.status] || j.status}</td>
        <td>${capitalize(j.assigned || '')}</td>
        <td>${formatDate(j.date)}</td>
      </tr>
    `).join('');
  }

  function renderSubPayments() {
    const payments = loadArr(STORAGE_KEYS.subPayments);
    const subs = loadArr(STORAGE_KEYS.subs);
    const tbody = $('#subPaymentsBody');

    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No sub payments recorded</td></tr>';
      return;
    }

    tbody.innerHTML = payments.sort((a, b) => b.date?.localeCompare(a.date)).map(p => {
      const sub = subs.find(s => s.id === p.subId);
      return `
        <tr>
          <td>${escHtml(sub ? sub.name : 'Unknown')}</td>
          <td class="text-gold">${fmt(p.amount)}</td>
          <td>${formatDate(p.date)}</td>
          <td>${p.jobRef || '—'}</td>
          <td><span class="job-card__service service--${p.service}" style="font-size:11px;">${SERVICE_LABELS[p.service] || p.service}</span></td>
        </tr>
      `;
    }).join('');
  }

  function render1099() {
    const subs = loadArr(STORAGE_KEYS.subs);
    const payments = loadArr(STORAGE_KEYS.subPayments);
    const year = new Date().getFullYear();
    const container = $('#subs1099');

    if (subs.length === 0) {
      container.innerHTML = '<div class="glass-panel" style="text-align:center;color:var(--text-muted);">Add subcontractors to see 1099 summaries</div>';
      return;
    }

    container.innerHTML = subs.map(sub => {
      const subPayments = payments.filter(p => p.subId === sub.id && new Date(p.date).getFullYear() === year);
      const total = subPayments.reduce((s, p) => s + p.amount, 0);
      const threshold = 600;
      const progress = Math.min(100, (total / threshold) * 100);
      const over = total >= threshold;

      return `
        <div class="nec-card">
          <div class="nec-card__name">${escHtml(sub.name)}${sub.llcName ? ' — ' + escHtml(sub.llcName) : ''}</div>
          <div class="nec-card__total ${over ? 'text-red' : 'text-gold'}">${fmt(total)}</div>
          <div class="nec-card__bar">
            <div class="nec-card__bar-fill" style="width:${progress}%;background:${over ? 'var(--red)' : 'var(--gold)'};"></div>
          </div>
          <div class="nec-card__threshold">${over ? '⚠ 1099-NEC REQUIRED (≥$600)' : fmt(threshold - total) + ' until 1099 threshold'}</div>
          ${sub.w9 !== 'received' && over ? '<div style="margin-top:8px;font-size:12px;color:var(--red);font-weight:600;">⚠ Missing W-9!</div>' : ''}
        </div>
      `;
    }).join('');
  }

  // ═══════════════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════════════
  function setupSettings() {
    // Load biz info
    const settings = load(STORAGE_KEYS.settings) || {};
    $('#settBizName').value = settings.bizName || 'Arlan LLC';
    $('#settBizPhone').value = settings.bizPhone || '';
    $('#settBizEmail').value = settings.bizEmail || '';
    $('#settBizAddress').value = settings.bizAddress || '';

    // Change password
    $('#formChangePassword').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentHash = await hashPwd($('#settCurrentPwd').value);
      if (currentHash !== load(STORAGE_KEYS.auth)) {
        toast('Current password incorrect', 'error');
        return;
      }
      if ($('#settNewPwd').value !== $('#settConfirmPwd').value) {
        toast('New passwords don\'t match', 'error');
        return;
      }
      if ($('#settNewPwd').value.length < 4) {
        toast('Password too short', 'error');
        return;
      }
      const newHash = await hashPwd($('#settNewPwd').value);
      save(STORAGE_KEYS.auth, newHash);
      $('#settCurrentPwd').value = '';
      $('#settNewPwd').value = '';
      $('#settConfirmPwd').value = '';
      toast('Password updated');
    });

    // Biz info
    $('#formBizInfo').addEventListener('submit', (e) => {
      e.preventDefault();
      save(STORAGE_KEYS.settings, {
        bizName: $('#settBizName').value,
        bizPhone: $('#settBizPhone').value,
        bizEmail: $('#settBizEmail').value,
        bizAddress: $('#settBizAddress').value
      });
      toast('Business info saved');
    });

    // Export JSON
    $('#btnExportJSON').addEventListener('click', () => {
      const data = {};
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        data[storageKey] = load(storageKey);
      });
      downloadFile(JSON.stringify(data, null, 2), 'arlan_backup_' + today() + '.json', 'application/json');
      toast('Data exported');
    });

    // Import JSON
    $('#btnImportJSON').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        try {
          const data = JSON.parse(ev.target.result);
          Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('arlan_')) {
              save(key, value);
            }
          });
          renderAll();
          toast('Data imported successfully');
        } catch {
          toast('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Clear all
    $('#btnClearAll').addEventListener('click', () => {
      if (!confirm('⚠ This will DELETE all dashboard data. This cannot be undone.\n\nAre you sure?')) return;
      if (!confirm('Really? ALL data — jobs, finances, mileage, subs — gone forever?')) return;
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      toast('All data cleared', 'warning');
      setTimeout(() => location.reload(), 1000);
    });
  }

  // ═══════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════
  function populateJobDropdown(selectId) {
    const jobs = loadArr(STORAGE_KEYS.jobs);
    const sel = $('#' + selectId);
    sel.innerHTML = '<option value="">None</option>' +
      jobs.map(j => `<option value="${j.id}">${escHtml(j.customer)} — ${SERVICE_LABELS[j.service] || j.service}</option>`).join('');
  }

  function populateSubDropdown(selectId) {
    const subs = loadArr(STORAGE_KEYS.subs);
    const sel = $('#' + selectId);
    sel.innerHTML = '<option value="">Select...</option>' +
      subs.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── RESPONSIVE CHECK ──────────────────────────────
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      $('#sidebar').classList.remove('open');
      $('#mobileNav').style.display = 'none';
    } else {
      if ($('#dashboard').style.display !== 'none') {
        $('#mobileNav').style.display = 'flex';
      }
    }
  });

  // ─── BOOT ──────────────────────────────────────────
  initAuth();

})();
