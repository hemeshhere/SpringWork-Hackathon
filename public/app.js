const STATES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
let vendors = [];
let summaryCache = {};

async function loadVendors() {
  const res = await fetch('/api/vendors');
  vendors = await res.json();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// FIX (Bug 6): Filter out inactive vendors from the dropdown options
function vendorOptionsHtml(currentVendorId) {
  // Retain the current vendor even if it became inactive, otherwise only show active
  const activeVendors = vendors.filter(v => v.active || v.id === currentVendorId);
  
  const opts = ['<option value="">Unassigned</option>']
    .concat(activeVendors.map((v) => {
      const selected = v.id === currentVendorId ? 'selected' : '';
      return `<option value="${v.id}" ${selected}>${v.name}</option>`;
    }));
  return opts.join('');
}

// FIX (Bug 10 [UI]): Only enable the exact next logical state button, disable select on complete
function cardHtml(r) {
  const currentIdx = STATES.indexOf(r.state);
  
  const stateButtons = STATES.map((s, idx) => {
    // Only enable if it is exactly one step forward
    const disabled = (idx - currentIdx !== 1) ? 'disabled' : '';
    return `<button class="state-btn" data-id="${r.id}" data-to="${s}" ${disabled}>${s}</button>`;
  }).join('');

  // Lock the dropdown completely if in COMPLETED state
  const selectDisabled = r.state === 'COMPLETED' ? 'disabled' : '';

  return `
    <div class="card" data-id="${r.id}">
      <div class="card-title">${r.candidateName}</div>
      <div class="card-sub">${r.checkType}</div>
      <select class="vendor-select" data-id="${r.id}" ${selectDisabled}>${vendorOptionsHtml(r.vendorId)}</select>
      <div class="state-buttons">${stateButtons}</div>
    </div>
  `;
}

async function loadBoard() {
  const [summaryRes, ...stateResults] = await Promise.all([
    fetch('/api/requests/summary'),
    ...STATES.map((s) => fetch(`/api/requests?state=${s}`))
  ]);
  summaryCache = await summaryRes.json();
  const byState = {};
  for (let i = 0; i < STATES.length; i++) {
    byState[STATES[i]] = await stateResults[i].json();
  }

  const board = document.getElementById('board');
  board.innerHTML = STATES.map((s) => `
    <div class="column">
      <div class="column-header">${s} <span class="count">${summaryCache[s] ?? 0}</span></div>
      <div class="column-body">${byState[s].map(cardHtml).join('') || '<div class="empty">No requests</div>'}</div>
    </div>
  `).join('');

  board.querySelectorAll('.vendor-select').forEach((sel) => {
    sel.addEventListener('change', () => onAssign(sel));
  });
  board.querySelectorAll('.state-btn').forEach((btn) => {
    btn.addEventListener('click', () => onTransition(btn));
  });
}

// FIX (Bug 9): Handle network failures visibly for state transitions
async function onTransition(btn) {
  const id = btn.dataset.id;
  const to = btn.dataset.to;
  try {
    const res = await fetch(`/api/requests/${id}/transition`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to })
    });
    
    if (!res.ok) throw new Error('Transition rejected');
    showToast(`Moved to ${to}`);
  } catch (err) {
    showToast(`Error: Failed to move to ${to}`);
  } finally {
    // Always reload the board to sync UI with server truth
    await loadBoard(); 
  }
}

// FIX (Bug 8): Handle network failures visibly and revert optimistic dropdown selection
async function onAssign(sel) {
  const id = sel.dataset.id;
  try {
    const res = await fetch(`/api/requests/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: sel.value || null })
    });
    
    if (!res.ok) throw new Error('Assignment rejected');
    showToast('Vendor assigned');
  } catch (err) {
    showToast('Error assigning vendor');
  } finally {
    // Reloading board reverts failed optimistic selections back to previous server state
    await loadBoard();
  }
}

async function init() {
  await loadVendors();
  await loadBoard();
}

init();

// Testing utility — not part of the app under test.
document.getElementById('reset-data-btn').addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  await loadVendors();
  await loadBoard();
  showToast('Data reset');
});
