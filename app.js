
// ============================================================
// Iris Outreach — NJ Contractor Prospect Tracker
// Persistence: localStorage. Data seeded from data.js
// ============================================================

const STORAGE_KEY = \'iris_outreach_v1\';
const STATUSES = [\'Not Started\', \'Contacted\', \'In Progress\', \'Follow Up\', \'Closed Won\', \'Closed Lost\'];
const OUTCOMES = [\'Reached\', \'Voicemail\', \'No Answer\', \'Not Interested\', \'Callback Requested\'];

// ---- State ----
let state = {
  prospects: [],
  view: \'table\',
  filters: { search: \'\', trade: \'\', status: \'\', county: \'\' },
  sort: \'rank\'
};

// ---- Init ----
function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { state.prospects = JSON.parse(saved); } catch(e) { seedData(); }
  } else {
    seedData();
  }
  populateFilters();
  renderAll();
  bindEvents();
}

function seedData() {
  state.prospects = SHEET_PROSPECTS.map((p, i) => ({
    id: \'p\' + (i + 1),
    rank: parseInt(p[\'Rank\']) || (i + 1),
    score: parseInt(p[\'ICP Score (0-13)\']) || 0,
    company: p[\'Company Name\'] || \'\',
    trade: p[\'Trade\'] || \'\',
    city: p[\'City\'] || \'\',
    county: p[\'County\'] || \'\',
    website: p[\'Website\'] || \'\',
    employees: p[\'Employee Estimate\'] || \'\',
    revenue: p[\'Revenue Estimate\'] || \'\',
    scoreBreakdown: p[\'Score Breakdown\'] || \'\',
    contactName: p[\'Decision Maker Name\'] || \'\',
    contactTitle: p[\'Decision Maker Title\'] || \'\',
    linkedIn: p[\'LinkedIn URL\'] || \'\',
    email: p[\'Email\'] || \'\',
    emailConfidence: p[\'Email Confidence\'] || \'\',
    fsmTool: p[\'FSM Tool\'] || \'\',
    googleAds: p[\'Google Ads\'] || \'\',
    facebookAds: p[\'Facebook Ads\'] || \'\',
    quickbooks: p[\'QuickBooks\'] || \'\',
    painSignal1: p[\'Pain Signal 1\'] || \'\',
    painSignal2: p[\'Pain Signal 2\'] || \'\',
    painSignal3: p[\'Pain Signal 3\'] || \'\',
    growthSignals: p[\'Growth Signals\'] || \'\',
    openingAngle: p[\'Opening Angle\'] || \'\',
    // Tracking fields
    status: \'Not Started\',
    nextAction: \'\',
    notes: \'\',
    followUpDate: \'\',
    callLog: []
  }));
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prospects));
}

// ---- Filters & Sort ----
function getFiltered() {
  let list = [...state.prospects];
  const { search, trade, status, county } = state.filters;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.company.toLowerCase().includes(q) ||
      p.contactName.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.county.toLowerCase().includes(q)
    );
  }
  if (trade) list = list.filter(p => p.trade === trade);
  if (status) list = list.filter(p => p.status === status);
  if (county) list = list.filter(p => p.county === county);
  // Sort
  list.sort((a, b) => {
    if (state.sort === \'rank\') return a.rank - b.rank;
    if (state.sort === \'score\') return b.score - a.score;
    if (state.sort === \'company\') return a.company.localeCompare(b.company);
    if (state.sort === \'status\') return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
    if (state.sort === \'followup\') {
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return a.followUpDate.localeCompare(b.followUpDate);
    }
    return 0;
  });
  return list;
}

function populateFilters() {
  const trades = [...new Set(state.prospects.map(p => p.trade).filter(Boolean))].sort();
  const counties = [...new Set(state.prospects.map(p => p.county).filter(Boolean))].sort();
  const tradeEl = document.getElementById(\'tradeFilter\');
  const countyEl = document.getElementById(\'countyFilter\');
  trades.forEach(t => { const o = document.createElement(\'option\'); o.value = t; o.textContent = t; tradeEl.appendChild(o); });
  counties.forEach(c => { const o = document.createElement(\'option\'); o.value = c; o.textContent = c; countyEl.appendChild(o); });
}

// ---- Render ----
function renderAll() {
  renderStats();
  if (state.view === \'table\') renderTable();
  else renderKanban();
}

function renderStats() {
  const total = state.prospects.length;
  const contacted = state.prospects.filter(p => p.status !== \'Not Started\').length;
  const won = state.prospects.filter(p => p.status === \'Closed Won\').length;
  const followUp = state.prospects.filter(p => p.status === \'Follow Up\').length;
  const today = new Date().toISOString().slice(0,10);
  const overdue = state.prospects.filter(p => p.followUpDate && p.followUpDate < today && p.status !== \'Closed Won\' && p.status !== \'Closed Lost\').length;
  const totalCalls = state.prospects.reduce((s, p) => s + (p.callLog ? p.callLog.length : 0), 0);
  document.getElementById(\'statsBar\').innerHTML = `
    <div class="stat-chip">Total <span class="stat-val">${total}</span></div>
    <div class="stat-chip">Contacted <span class="stat-val">${contacted}</span></div>
    <div class="stat-chip">&#127881; Won <span class="stat-val">${won}</span></div>
    <div class="stat-chip">Follow Up <span class="stat-val">${followUp}</span></div>
    <div class="stat-chip">&#128197; Overdue <span class="stat-val" style="color:var(--red)">${overdue}</span></div>
    <div class="stat-chip">&#128222; Total Calls <span class="stat-val">${totalCalls}</span></div>
  `;
}

function statusClass(s) {
  const m = { \'Not Started\': \'not-started\', \'Contacted\': \'contacted\', \'In Progress\': \'in-progress\', \'Follow Up\': \'follow-up\', \'Closed Won\': \'won\', \'Closed Lost\': \'lost\' };
  return m[s] || \'not-started\';
}

function statusBadge(s) {
  return `<span class="status-badge status-${statusClass(s)}">${s}</span>`;
}

function scoreBadge(score) {
  const cls = score >= 9 ? \'score-high\' : score >= 7 ? \'score-mid\' : \'score-low\';
  return `<span class="score-badge ${cls}">${score}</span>`;
}

function followUpDisplay(date) {
  if (!date) return \'<span class="tag-unknown">—</span>\';
  const today = new Date().toISOString().slice(0,10);
  if (date < today) return `<span class="followup-overdue">&#9888; ${date}</span>`;
  if (date === today) return `<span class="followup-today">&#128197; Today</span>`;
  return `<span class="followup-upcoming">${date}</span>`;
}

function tradePill(trade) {
  const key = trade.replace(/ /g, \'-\');
  return `<span class="trade-pill trade-${key}">${trade}</span>`;
}

function renderTable() {
  const list = getFiltered();
  const tbody = document.getElementById(\'prospectsBody\');
  if (!list.length) {
    tbody.innerHTML = \'<tr><td colspan="12"><div class="empty-state"><div class="empty-icon">&#128269;</div><div>No prospects match your filters</div></div></td></tr>\';
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td><span style="color:var(--text-muted);font-size:12px">#${p.rank}</span></td>
      <td>
        <div class="company-name">${p.company}</div>
        <div class="company-website"><a href="${p.website}" target="_blank" style="color:var(--text-muted);font-size:11px">${p.website ? new URL(p.website.startsWith(\'http\') ? p.website : \'https://\' + p.website).hostname : \'\'}</a></div>
      </td>
      <td>${tradePill(p.trade)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${p.city || p.county || \'\u2014\'}</td>
      <td>
        <div class="contact-name">${p.contactName && p.contactName !== \'not found\' ? p.contactName : \'<span style="color:var(--text-muted)">Unknown</span>\'}</div>
        <div class="contact-title">${p.contactTitle && p.contactTitle !== \'not found\' ? p.contactTitle : \'\' }</div>
      </td>
      <td class="email-cell">${p.email && p.email !== \'not found\' ? `<a href="mailto:${p.email}" style="color:var(--blue)">${p.email}</a>` : \'<span style="color:var(--text-muted)">—</span>\'}</td>
      <td>${scoreBadge(p.score)}</td>
      <td>
        <select class="form-control" style="padding:4px 6px;font-size:12px;min-width:110px" onchange="quickUpdateStatus(\'${p.id}\', this.value)">
          ${STATUSES.map(s => `<option value="${s}" ${p.status===s?\'selected\':\'\'} >${s}</option>`).join(\'\')}
        </select>
      </td>
      <td style="max-width:140px">
        <input type="text" class="form-control" style="padding:4px 6px;font-size:12px" placeholder="Next action..." value="${(p.nextAction||\'\')}" onchange="quickUpdateField(\'${p.id}\', \'nextAction\', this.value)" />
      </td>
      <td>${followUpDisplay(p.followUpDate)}</td>
      <td><span class="calls-badge" onclick="openModal(\'${p.id}\')">&#128222; ${(p.callLog||[]).length}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-outline btn-sm" onclick="openModal(\'${p.id}\')">&#9998; Details</button>
        </div>
      </td>
    </tr>
  `).join(\'\');
}

function renderKanban() {
  const list = getFiltered();
  STATUSES.forEach(status => {
    const col = document.getElementById(\'kanban-\' + status);
    const cnt = document.getElementById(\'cnt-\' + status);
    const cards = list.filter(p => p.status === status);
    cnt.textContent = cards.length;
    col.innerHTML = cards.length === 0
      ? \'<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px">Empty</div>\'
      : cards.map(p => `
        <div class="kanban-card" onclick="openModal(\'${p.id}\')">
          <div class="kanban-card-title">${p.company}</div>
          <div class="kanban-card-meta">${tradePill(p.trade)} ${scoreBadge(p.score)} &bull; ${p.city || p.county || \'NJ\'}</div>
          ${p.contactName && p.contactName !== \'not found\' ? `<div class="kanban-card-meta" style="margin-top:4px">&#128100; ${p.contactName}</div>` : \'\'}
          ${p.nextAction ? `<div class="kanban-card-meta" style="margin-top:4px">&#8594; ${p.nextAction}</div>` : \'\'}
          ${p.followUpDate ? `<div class="kanban-card-followup">${followUpDisplay(p.followUpDate)}</div>` : \'\'}
        </div>
      `).join(\'\');
  });
}

// ---- Quick Updates ----
function quickUpdateStatus(id, value) {
  const p = state.prospects.find(x => x.id === id);
  if (p) { p.status = value; saveData(); renderStats(); if (state.view === \'kanban\') renderKanban(); }
}

function quickUpdateField(id, field, value) {
  const p = state.prospects.find(x => x.id === id);
  if (p) { p[field] = value; saveData(); }
}

// ---- Modal ----
function openModal(id) {
  const p = state.prospects.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById(\'prospectModal\');
  document.getElementById(\'modalContent\').innerHTML = buildModalHTML(p);
  modal.style.display = \'flex\';
  document.body.style.overflow = \'hidden\';
  // Bind modal form events
  bindModalEvents(p);
}

function closeModal() {
  document.getElementById(\'prospectModal\').style.display = \'none\';
  document.body.style.overflow = \'\';
  renderAll();
}

function buildModalHTML(p) {
  const calls = p.callLog || [];
  const painSignals = [p.painSignal1, p.painSignal2, p.painSignal3].filter(s => s && s !== \'\');
  return `
    <div class="modal-header">
      <div class="modal-company">${p.company}</div>
      <div class="modal-meta">
        ${tradePill(p.trade)}
        ${scoreBadge(p.score)}
        ${p.city || p.county ? `<span>&#128205; ${p.city || p.county}</span>` : \'\'}
        ${p.website ? `<a href="${p.website}" target="_blank">&#127760; Website</a>` : \'\'}
        ${p.linkedIn && p.linkedIn !== \'not found\' ? `<a href="${p.linkedIn}" target="_blank">&#128101; LinkedIn</a>` : \'\'}
      </div>
    </div>
    <div class="modal-body">

      <div class="modal-section">
        <div class="modal-section-title">Tracking</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="modal-status">
              ${STATUSES.map(s => `<option value="${s}" ${p.status===s?\'selected\':\'\'} >${s}</option>`).join(\'\')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Follow-Up Date</label>
            <input type="date" class="form-control" id="modal-followup" value="${p.followUpDate||\'\'}"/>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Next Action</label>
            <input type="text" class="form-control" id="modal-nextaction" value="${p.nextAction||\'\'}"/>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="modal-notes" rows="3">${p.notes||\'\'}</textarea>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="modal-save">&#10003; Save Changes</button>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Call Log (${calls.length})</div>
        <div class="call-log-list" id="callLogList">${renderCallLog(p)}</div>
        <div class="add-call-form">
          <div class="modal-section-title" style="margin-bottom:8px">+ Log a Call</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-control" id="call-date" value="${new Date().toISOString().slice(0,10)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Outcome</label>
              <select class="form-control" id="call-outcome">
                ${OUTCOMES.map(o => `<option value="${o}">${o}</option>`).join(\'\')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" id="call-notes" rows="2" placeholder="What happened on this call?"></textarea>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="add-call-btn" data-id="${p.id}">&#128222; Log Call</button>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Prospect Intelligence</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Contact</div><div class="info-value">${p.contactName && p.contactName !== \'not found\' ? p.contactName : \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Title</div><div class="info-value">${p.contactTitle && p.contactTitle !== \'not found\' ? p.contactTitle : \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Email</div><div class="info-value">${p.email && p.email !== \'not found\' ? `<a href="mailto:${p.email}" style="color:var(--blue)">${p.email}</a>` : \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Email Confidence</div><div class="info-value">${p.emailConfidence || \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Employees</div><div class="info-value">${p.employees || \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Revenue</div><div class="info-value">${p.revenue || \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">FSM Tool</div><div class="info-value">${p.fsmTool || \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">Google Ads</div><div class="info-value"><span class="tag-${p.googleAds === \'yes\' ? \'yes\' : p.googleAds === \'no\' ? \'no\' : \'unknown\'}">${p.googleAds || \'Unknown\'}</span></div></div>
          <div class="info-item"><div class="info-label">Facebook Ads</div><div class="info-value"><span class="tag-${p.facebookAds === \'yes\' ? \'yes\' : p.facebookAds === \'no\' ? \'no\' : \'unknown\'}">${p.facebookAds || \'Unknown\'}</span></div></div>
          <div class="info-item"><div class="info-label">QuickBooks</div><div class="info-value">${p.quickbooks || \'Unknown\'}</div></div>
          <div class="info-item"><div class="info-label">ICP Score</div><div class="info-value">${scoreBadge(p.score)} <span style="font-size:11px;color:var(--text-muted)">${p.scoreBreakdown}</span></div></div>
          <div class="info-item"><div class="info-label">Growth Signals</div><div class="info-value" style="font-size:12px">${p.growthSignals || \'\u2014\'}</div></div>
        </div>
      </div>

      ${painSignals.length ? `
      <div class="modal-section">
        <div class="modal-section-title">Pain Signals</div>
        <div class="pain-signals">
          ${painSignals.map(s => `<div class="pain-signal">&#9888;&#65039; ${s}</div>`).join(\'\')}
        </div>
      </div>` : \'\'}

      ${p.openingAngle ? `
      <div class="modal-section">
        <div class="modal-section-title">Opening Angle</div>
        <div class="opening-angle">&ldquo;${p.openingAngle}&rdquo;</div>
      </div>` : \'\'}

    </div>
  `;
}

function renderCallLog(p) {
  const calls = p.callLog || [];
  if (!calls.length) return \'<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No calls logged yet.</div>\';
  return calls.slice().reverse().map((c, ri) => {
    const i = calls.length - 1 - ri;
    return `
      <div class="call-entry">
        <button class="call-entry-delete" onclick="deleteCall(\'${p.id}\', ${i})" title="Delete">&#128465;</button>
        <div class="call-entry-header">
          <span class="call-entry-date">&#128197; ${c.date}</span>
          <span class="call-outcome-badge outcome-${c.outcome.toLowerCase().replace(/ /g,\'-\')}">${c.outcome}</span>
        </div>
        <div class="call-entry-notes">${c.notes || \'(no notes)\'}</div>
      </div>
    `;
  }).join(\'\');
}

function bindModalEvents(p) {
  document.getElementById(\'modal-save\').onclick = () => saveModalChanges(p.id);
  document.getElementById(\'add-call-btn\').onclick = () => addCall(p.id);
}

function saveModalChanges(id) {
  const p = state.prospects.find(x => x.id === id);
  if (!p) return;
  p.status = document.getElementById(\'modal-status\').value;
  p.followUpDate = document.getElementById(\'modal-followup\').value;
  p.nextAction = document.getElementById(\'modal-nextaction\').value;
  p.notes = document.getElementById(\'modal-notes\').value;
  saveData();
  // Flash feedback
  const btn = document.getElementById(\'modal-save\');
  btn.textContent = \'&#10003; Saved!\';
  btn.style.background = \'var(--green)\';
  setTimeout(() => { btn.innerHTML = \'&#10003; Save Changes\'; btn.style.background = \'\'; }, 1500);
  renderStats();
}

function addCall(id) {
  const p = state.prospects.find(x => x.id === id);
  if (!p) return;
  const date = document.getElementById(\'call-date\').value;
  const outcome = document.getElementById(\'call-outcome\').value;
  const notes = document.getElementById(\'call-notes\').value;
  if (!date) { alert(\'Please select a date\'); return; }
  if (!p.callLog) p.callLog = [];
  p.callLog.push({ date, outcome, notes });
  // Auto-update status
  if (p.status === \'Not Started\') p.status = \'Contacted\';
  if (outcome === \'Callback Requested\') p.status = \'Follow Up\';
  saveData();
  // Refresh call log in modal
  document.getElementById(\'callLogList\').innerHTML = renderCallLog(p);
  document.getElementById(\'call-notes\').value = \'\';
  renderStats();
}

function deleteCall(id, index) {
  const p = state.prospects.find(x => x.id === id);
  if (!p || !p.callLog) return;
  if (!confirm(\'Delete this call log entry?\')) return;
  p.callLog.splice(index, 1);
  saveData();
  document.getElementById(\'callLogList\').innerHTML = renderCallLog(p);
  renderStats();
}

// ---- CSV Export ----
function exportCSV() {
  const headers = [\'Rank\',\'Company\',\'Trade\',\'City\',\'County\',\'Score\',\'Contact\',\'Title\',\'Email\',\'Website\',\'Status\',\'Next Action\',\'Follow-Up Date\',\'Notes\',\'Call Count\',\'FSM Tool\',\'Google Ads\',\'Opening Angle\'];
  const rows = state.prospects.map(p => [
    p.rank, p.company, p.trade, p.city, p.county, p.score,
    p.contactName, p.contactTitle, p.email, p.website,
    p.status, p.nextAction, p.followUpDate, p.notes,
    (p.callLog||[]).length, p.fsmTool, p.googleAds, p.openingAngle
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v||\'\')}"`.replace(/\n/g,\' \')).join(\',\')).join(\'\n\');
  const blob = new Blob([csv], { type: \'text/csv\' });
  const a = document.createElement(\'a\');
  a.href = URL.createObjectURL(blob);
  a.download = \'iris-outreach-export.csv\';
  a.click();
}

// ---- CSV Import ----
function importCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const lines = e.target.result.split(\'\n\').filter(l => l.trim());
    const headers = lines[0].split(\',\').map(h => h.replace(/"/g,\'\').trim());
    const statusIdx = headers.indexOf(\'Status\');
    const nextActionIdx = headers.indexOf(\'Next Action\');
    const followUpIdx = headers.indexOf(\'Follow-Up Date\');
    const notesIdx = headers.indexOf(\'Notes\');
    const rankIdx = headers.indexOf(\'Rank\');
    if (statusIdx === -1) { alert(\'Invalid CSV format\'); return; }
    lines.slice(1).forEach(line => {
      const cols = line.split(\',\').map(c => c.replace(/"/g,\'\').trim());
      const rank = parseInt(cols[rankIdx]);
      const p = state.prospects.find(x => x.rank === rank);
      if (p) {
        if (statusIdx >= 0) p.status = cols[statusIdx] || p.status;
        if (nextActionIdx >= 0) p.nextAction = cols[nextActionIdx] || p.nextAction;
        if (followUpIdx >= 0) p.followUpDate = cols[followUpIdx] || p.followUpDate;
        if (notesIdx >= 0) p.notes = cols[notesIdx] || p.notes;
      }
    });
    saveData();
    renderAll();
    alert(\'Import complete!\');
  };
  reader.readAsText(file);
}

// ---- Reset ----
function resetData() {
  if (!confirm(\'Reset ALL tracking data? This cannot be undone.\')) return;
  localStorage.removeItem(STORAGE_KEY);
  seedData();
  renderAll();
}

// ---- Events ----
function bindEvents() {
  document.getElementById(\'searchInput\').addEventListener(\'input\', e => { state.filters.search = e.target.value; renderAll(); });
  document.getElementById(\'tradeFilter\').addEventListener(\'change\', e => { state.filters.trade = e.target.value; renderAll(); });
  document.getElementById(\'statusFilter\').addEventListener(\'change\', e => { state.filters.status = e.target.value; renderAll(); });
  document.getElementById(\'countyFilter\').addEventListener(\'change\', e => { state.filters.county = e.target.value; renderAll(); });
  document.getElementById(\'sortSelect\').addEventListener(\'change\', e => { state.sort = e.target.value; renderAll(); });
  document.getElementById(\'clearFiltersBtn\').addEventListener(\'click\', () => {
    state.filters = { search: \'\', trade: \'\', status: \'\', county: \'\' };
    document.getElementById(\'searchInput\').value = \'\';
    document.getElementById(\'tradeFilter\').value = \'\';
    document.getElementById(\'statusFilter\').value = \'\';
    document.getElementById(\'countyFilter\').value = \'\';
    renderAll();
  });
  document.getElementById(\'tableViewBtn\').addEventListener(\'click\', () => {
    state.view = \'table\';
    document.getElementById(\'tableView\').style.display = \'\';
    document.getElementById(\'kanbanView\').style.display = \'none\';
    document.getElementById(\'tableViewBtn\').classList.add(\'active\');
    document.getElementById(\'kanbanViewBtn\').classList.remove(\'active\');
    renderTable();
  });
  document.getElementById(\'kanbanViewBtn\').addEventListener(\'click\', () => {
    state.view = \'kanban\';
    document.getElementById(\'tableView\').style.display = \'none\';
    document.getElementById(\'kanbanView\').style.display = \'flex\';
    document.getElementById(\'tableViewBtn\').classList.remove(\'active\');
    document.getElementById(\'kanbanViewBtn\').classList.add(\'active\');
    renderKanban();
  });
  document.getElementById(\'exportCsvBtn\').addEventListener(\'click\', exportCSV);
  document.getElementById(\'importCsvBtn\').addEventListener(\'click\', () => document.getElementById(\'csvFileInput\').click());
  document.getElementById(\'csvFileInput\').addEventListener(\'change\', e => { if (e.target.files[0]) importCSV(e.target.files[0]); });
  document.getElementById(\'resetBtn\').addEventListener(\'click\', resetData);
  document.getElementById(\'modalClose\').addEventListener(\'click\', closeModal);
  document.getElementById(\'prospectModal\').addEventListener(\'click\', e => { if (e.target === document.getElementById(\'prospectModal\')) closeModal(); });
  document.addEventListener(\'keydown\', e => { if (e.key === \'Escape\') closeModal(); });
}

// ---- Boot ----
document.addEventListener(\'DOMContentLoaded\', init);
