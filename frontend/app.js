
const API = '/api/opportunities';

const els = {
  list: document.getElementById('list'),
  loading: document.getElementById('loading'),
  count: document.getElementById('count'),
  alertArea: document.getElementById('alert-area'),
  form: document.getElementById('opp-form'),
  formTitle: document.getElementById('formTitle'),
  btnSave: document.getElementById('btn-save'),
  detailsTitle: document.getElementById('detailsTitle'),
  detailsBody: document.getElementById('detailsBody'),
  detailsFooter: document.getElementById('detailsFooter'),
  deleteName: document.getElementById('deleteName'),
};

const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
const formModal = new bootstrap.Modal(document.getElementById('formModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

const FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department',
                'required_skills', 'available_positions', 'deadline', 'status'];

let pendingDeleteId = null;

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function showAlert(message, type = 'success') {
  const div = document.createElement('div');
  div.className = `alert alert-${type} alert-dismissible fade show`;
  div.setAttribute('role', 'alert');
  div.innerHTML = `${esc(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
  els.alertArea.prepend(div);
  setTimeout(() => bootstrap.Alert.getOrCreateInstance(div).close(), 6000);
}

async function api(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (e) {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const details = body && body.errors ? ': ' + body.errors.join('; ') : '';
    throw new Error(((body && body.message) || `Request failed (${res.status})`) + details);
  }
  return body;
}

function statusBadge(status) {
  return `<span class="badge ${status === 'Open' ? 'text-bg-success' : 'text-bg-secondary'}">${esc(status)}</span>`;
}

// ---------- list ----------
async function loadList() {
  els.loading.style.display = 'block';
  try {
    const items = await api(API);
    els.count.textContent = `${items.length} opportunit${items.length === 1 ? 'y' : 'ies'}`;
    if (items.length === 0) {
      els.list.innerHTML = '<div class="col-12"><div class="alert alert-info mb-0">No research opportunities yet. Click "New Opportunity" to add one.</div></div>';
    } else {
      els.list.innerHTML = items.map(cardHtml).join('');
    }
  } catch (e) {
    els.list.innerHTML = '';
    showAlert(e.message, 'danger');
  } finally {
    els.loading.style.display = 'none';
  }
}

function cardHtml(o) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card opp-card h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h3 class="h6 card-title mb-0 me-2">${esc(o.title)}</h3>
            ${statusBadge(o.status)}
          </div>
          <div class="small text-muted mb-2">${esc(o.research_area)} &middot; ${esc(o.department)}</div>
          <p class="card-text small">${esc(o.description)}</p>
          <div class="small mt-auto mb-3">
            <div><strong>Faculty:</strong> ${esc(o.faculty_name)}</div>
            <div><strong>Positions:</strong> ${esc(o.available_positions)} &middot; <strong>Deadline:</strong> ${esc(o.deadline)}</div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-outline-primary btn-sm" data-action="view" data-id="${o.id}">View</button>
            <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-id="${o.id}">Edit</button>
            ${o.status === 'Open'
              ? `<button class="btn btn-outline-warning btn-sm" data-action="close" data-id="${o.id}">Close</button>` : ''}
            <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${o.id}" data-title="${esc(o.title)}">Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ---------- view details ----------
async function viewDetails(id) {
  try {
    const o = await api(`${API}/${id}`);
    els.detailsTitle.textContent = o.title;
    const row = (label, value) => `
      <div class="col-md-6 mb-3">
        <div class="detail-label">${label}</div>
        <div class="detail-value">${value}</div>
      </div>`;
    els.detailsBody.innerHTML = `
      <div class="row">
        <div class="col-12 mb-3">
          <div class="detail-label">Description</div>
          <div class="detail-value">${esc(o.description)}</div>
        </div>
        ${row('ID', esc(o.id))}
        ${row('Status', statusBadge(o.status))}
        ${row('Research Area', esc(o.research_area))}
        ${row('Faculty Member', esc(o.faculty_name))}
        ${row('Department', esc(o.department))}
        ${row('Required Skills', esc(o.required_skills))}
        ${row('Available Positions', esc(o.available_positions))}
        ${row('Application Deadline', esc(o.deadline))}
      </div>`;
    els.detailsFooter.innerHTML = `
      <button class="btn btn-outline-secondary" data-action="edit" data-id="${o.id}" data-from="details">Edit</button>
      ${o.status === 'Open' ? `<button class="btn btn-outline-warning" data-action="close" data-id="${o.id}" data-from="details">Close Opportunity</button>` : ''}
      <button class="btn btn-secondary" data-bs-dismiss="modal">Done</button>`;
    detailsModal.show();
  } catch (e) {
    showAlert(e.message, 'danger');
    loadList(); // item may have been removed elsewhere
  }
}

// ---------- create / edit ----------
function resetForm() {
  els.form.reset();
  els.form.classList.remove('was-validated');
  document.getElementById('f-id').value = '';
}

function openCreate() {
  resetForm();
  els.formTitle.textContent = 'New Opportunity';
  formModal.show();
}

async function openEdit(id) {
  try {
    const o = await api(`${API}/${id}`);
    resetForm();
    document.getElementById('f-id').value = o.id;
    FIELDS.forEach((f) => { document.getElementById(`f-${f}`).value = o[f]; });
    els.formTitle.textContent = `Edit Opportunity #${o.id}`;
    formModal.show();
  } catch (e) {
    showAlert(e.message, 'danger');
    loadList();
  }
}

els.form.addEventListener('submit', async (ev) => {
  ev.preventDefault();

  // Basic client-side validation of required fields
  let valid = true;
  FIELDS.forEach((f) => {
    const el = document.getElementById(`f-${f}`);
    if (typeof el.value === 'string') el.value = el.value.trim();
  });
  if (!els.form.checkValidity()) valid = false;
  els.form.classList.add('was-validated');
  if (!valid) return;

  const payload = {};
  FIELDS.forEach((f) => { payload[f] = document.getElementById(`f-${f}`).value; });
  payload.available_positions = Number(payload.available_positions);

  const id = document.getElementById('f-id').value;
  els.btnSave.disabled = true;
  try {
    if (id) {
      await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showAlert('Opportunity updated successfully.');
    } else {
      await api(API, { method: 'POST', body: JSON.stringify(payload) });
      showAlert('Opportunity created successfully.');
    }
    formModal.hide();
    loadList();
  } catch (e) {
    showAlert(e.message, 'danger');
  } finally {
    els.btnSave.disabled = false;
  }
});

// ---------- close (Open -> Closed) ----------
async function closeOpportunity(id) {
  try {
    await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) });
    showAlert('Opportunity closed.');
    loadList();
  } catch (e) {
    showAlert(e.message, 'danger');
  }
}

// ---------- delete ----------
function askDelete(id, title) {
  pendingDeleteId = id;
  els.deleteName.textContent = title;
  deleteModal.show();
}

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
  if (pendingDeleteId == null) return;
  const id = pendingDeleteId;
  pendingDeleteId = null;
  try {
    const r = await api(`${API}/${id}`, { method: 'DELETE' });
    showAlert(r.message || 'Opportunity deleted.');
  } catch (e) {
    showAlert(e.message, 'danger');
  } finally {
    deleteModal.hide();
    loadList();
  }
});

// ---------- event wiring ----------
document.getElementById('btn-new').addEventListener('click', openCreate);

document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn) return;
  const { action, id, title, from } = btn.dataset;
  if (from === 'details') detailsModal.hide();
  if (action === 'view') viewDetails(id);
  else if (action === 'edit') openEdit(id);
  else if (action === 'close') closeOpportunity(id);
  else if (action === 'delete') askDelete(id, title);
});

loadList();
