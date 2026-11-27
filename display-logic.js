/* ==========================================================
   Display Logic popup — per the Figma frames (App configuration – Display Logic):
   each condition is its own "If" box: Page | Field, Operator,
   Enter Value / Use Another Field, then Value (or Page | Field).
   Boxes are joined by "And"; summary reads "If … on page … equals … Then show …".
   ========================================================== */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const live = $('live');
  const announce = msg => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); };

  const ICON = {
    info: '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    add: '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    addSq: '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>',
    trash: '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7z"/></svg>',
    pencilU: '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>',
    binX: '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14"/><path d="M10 11l4 4M14 11l-4 4"/></svg>',
    logic: '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="currentColor"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
    close: '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };
  const tip = (id, label, text) => `
    <span class="tip">
      <button type="button" class="tip-btn" aria-label="About ${label}" aria-describedby="${id}">${ICON.info}</button>
      <span class="tip-bubble" role="tooltip" id="${id}">${text}</span>
    </span>`;

  /* ---------- Sample form: pages with fields (as in the Figma filled states) ---------- */
  const form = { sections: [
    { id: 'p-loc', heading: 'Location Details', fields: [
      { id: 'f-loctype', label: 'Location Type', type: 'dropdown', options: ['Outside Household', 'Transit Post'] },
      { id: 'f-locname', label: 'Location Name', type: 'text' },
    ] },
  ] };
  // the field whose display logic is being set: Location Name
  const target = form.sections[0].fields[1];
  const cond = value => ({ page: 'p-loc', field: 'f-loctype', op: 'eq', mode: 'value', value, page2: '', field2: '' });
  target.logic = { dep: { on: true, items: [
    { name: 'Logic 1', conds: [cond('Outside Household')] },
    { name: 'Logic 2', conds: [cond('Transit Post')] },
  ] } };

  /* ---------- Display Logic card (Logic tab → Dependent Field) ---------- */
  function renderCard(focusSel) {
    const items = target.logic.dep.items;
    $('dl-host').innerHTML = `<div class="dl-card">
      <h4 class="dl-title" id="dl-title">Display Logic ${tip('tip-dl', 'display logic', 'Display logic decides when this field is shown or hidden for applicants, based on their answers to other fields.')}</h4>
      ${items.length ? `<ul class="dl-list" aria-labelledby="dl-title">${items.map((it, i) => `
        <li class="dl-entry">${i ? '<span class="dl-or">Or</span>' : ''}
          <div class="dl-item">
            <span class="dl-name">${esc(it.name)}</span>
            <button type="button" class="dl-btn" data-act="editLogic" data-i="${i}" aria-label="Edit ${esc(it.name)}" aria-haspopup="dialog">${ICON.pencilU}</button>
            <button type="button" class="dl-btn" data-act="delLogic" data-i="${i}" aria-label="Delete ${esc(it.name)}">${ICON.binX}</button>
          </div>
        </li>`).join('')}</ul>` : ''}
      <button type="button" class="btn btn-secondary dl-add" data-act="addLogic" aria-haspopup="dialog">${ICON.add} Add Display Logic</button>
    </div>`;
    if (focusSel) $('dl-host').querySelector(focusSel)?.focus();
  }
  $('dl-host').addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const act = t.dataset.act;
    if (act === 'addLogic') openLogicDialog(target, -1, t);
    else if (act === 'editLogic') openLogicDialog(target, +t.dataset.i, t);
    else if (act === 'delLogic') { const [gone] = target.logic.dep.items.splice(+t.dataset.i, 1); renderCard('[data-act="addLogic"]'); announce(`${gone.name} deleted.`); }
  });

  /* ======================================================
     Display Logic popup
     ====================================================== */
  const OPS = [
    { v: 'eq', t: 'Is Equal to', s: 'equals' },
    { v: 'ne', t: 'Is not equal to', s: 'does not equal' },
    { v: 'gt', t: 'Is greater than', s: 'Is more than' },
    { v: 'lt', t: 'Is less than', s: 'is less than' },
  ];
  const blankCond = () => ({ page: '', field: '', op: '', mode: 'value', value: '', page2: '', field2: '' });
  let lg = null;   // { f, index, conds, opener, errors }

  const secById = id => form.sections.find(x => x.id === id);
  const fieldById = fid => { for (const sec of form.sections) { const x = sec.fields.find(y => y.id === fid); if (x) return x; } };
  const pageOpts = () => form.sections.map(x => ({ v: x.id, t: x.heading }));
  const fieldOpts = pid => (secById(pid)?.fields || []).filter(x => x.id !== lg.f.id).map(x => ({ v: x.id, t: x.label }));
  const opt = (v, t, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(t)}</option>`;
  function selectHTML(id, label, placeholder, options, cur, key, i, err, cls = '') {
    return `<div class="lg-field ${cls}">
      <label class="lg-label" for="${id}">${label}</label>
      <select class="pf-input pf-select lg-select${cur ? '' : ' is-ph'}" id="${id}" data-k="${key}" data-i="${i}"${err ? ' aria-invalid="true"' : ''}>
        <option value="">${placeholder}</option>${options.map(o => opt(o.v, o.t, cur)).join('')}
      </select></div>`;
  }
  function modeHTML(c, i) {
    const card = (v, t, d) => `<label class="lg-mode${c.mode === v ? ' is-on' : ''}"><input type="radio" name="lg-mode-${i}" value="${v}" data-k="mode" data-i="${i}"${c.mode === v ? ' checked' : ''}>
      <span class="rc-dot" aria-hidden="true"></span><span><strong>${t}</strong><small>${d}</small></span></label>`;
    return `<fieldset class="lg-modes"><legend class="sr-only">Compare with</legend>
      ${card('value', 'Enter Value', 'Enter a number or text (or) choose value from the options')}
      ${card('field', 'Use Another Field', 'Compare with an existing field')}
    </fieldset>`;
  }
  function valueHTML(c, i, err) {
    if (c.mode === 'field') return `<div class="lg-two">
      ${selectHTML(`lg-page2-${i}`, 'Page', 'Choose a page', pageOpts(), c.page2, 'page2', i, err.page2)}
      ${selectHTML(`lg-field2-${i}`, 'Field', 'Choose a Field', fieldOpts(c.page2), c.field2, 'field2', i, err.field2)}
    </div>`;
    const src = fieldById(c.field);
    if (src && src.type === 'dropdown') return selectHTML(`lg-val-${i}`, 'Value', 'Value', src.options.map(x => ({ v: x, t: x })), c.value, 'value', i, err.value, 'lg-narrow');
    return `<div class="lg-field lg-narrow"><label class="lg-label" for="lg-val-${i}">Enter Value</label>
      <input class="pf-input" id="lg-val-${i}" type="text" placeholder="Value" value="${esc(c.value)}" data-k="value" data-i="${i}"${err.value ? ' aria-invalid="true"' : ''} autocomplete="off"></div>`;
  }
  function condHTML(c, i) {
    const err = lg.errors[i] || {};
    let html = `<div class="lg-cond" role="group" aria-label="Condition ${i + 1}">
      <div class="lg-cond-head"><span class="lg-if">If</span>
        <button type="button" class="lg-del" data-del="${i}" aria-label="Delete Condition ${i + 1}">${ICON.trash} Delete Condition</button></div>
      <div class="lg-two">
        ${selectHTML(`lg-page-${i}`, 'Page', 'Choose a page', pageOpts(), c.page, 'page', i, err.page)}
        ${selectHTML(`lg-field-${i}`, 'Field', 'Choose a Field', fieldOpts(c.page), c.field, 'field', i, err.field)}
      </div>
      ${selectHTML(`lg-op-${i}`, 'Operator', 'Choose an operator for comparison', OPS.map(o => ({ v: o.v, t: o.t })), c.op, 'op', i, err.op)}
      ${modeHTML(c, i)}
      ${valueHTML(c, i, err)}`;
    if (Object.keys(err).length) html += `<p class="fp-error" id="lg-err-${i}">Complete every part of this condition.</p>`;
    return html + `</div>`;
  }
  const isDone = c => c.page && c.field && c.op && (c.mode === 'field' ? c.page2 && c.field2 : String(c.value).trim());
  function summaryHTML() {
    const done = lg.conds.filter(isDone);
    if (!done.length) return '';
    const tag = t => `<span class="lg-tag">${esc(t)}</span>`;
    const rhs = c => c.mode === 'field' ? `${tag(fieldById(c.field2)?.label)} on page ${tag(secById(c.page2)?.heading)}` : tag(c.value);
    return `<div class="lg-summary" aria-label="Summary">
      ${done.map((c, i) => `${i ? '<p class="lg-and-s">And</p>' : ''}<p class="lg-sum-row lg-sum-box">If ${tag(fieldById(c.field)?.label)} on page ${tag(secById(c.page)?.heading)}
        ${OPS.find(o => o.v === c.op).s} ${rhs(c)}</p>`).join('')}
      <p class="lg-sum-row lg-then">Then show ${tag(lg.f.label)}</p>
    </div>`;
  }
  function renderLogic(focusSel) {
    $('lg-body').innerHTML = lg.conds.map((c, i) => (i ? '<p class="lg-and">And</p>' : '') + condHTML(c, i)).join('')
      + `<button type="button" class="btn btn-secondary lg-add" id="lg-add">${ICON.addSq} Add Condition</button>` + summaryHTML();
    if (focusSel) $('logic-dialog').querySelector(focusSel)?.focus();
  }
  function openLogicDialog(f, index, opener) {
    const item = index >= 0 ? f.logic.dep.items[index] : null;
    lg = { f, index, opener, errors: [], conds: item && item.conds.length ? JSON.parse(JSON.stringify(item.conds)) : [blankCond()] };
    renderLogic();
    $('logic-dialog').showModal();
    $('lg-page-0')?.focus();
  }
  $('lg-body').addEventListener('change', e => {
    const k = e.target.dataset.k; if (!k || !lg) return;
    const i = +e.target.dataset.i, c = lg.conds[i];
    c[k] = e.target.value;
    if (k === 'page') { c.field = ''; c.value = ''; }
    if (k === 'field') c.value = '';
    if (k === 'page2') c.field2 = '';
    if (lg.errors[i]) { delete lg.errors[i][k]; if (k === 'mode') ['value', 'page2', 'field2'].forEach(x => delete lg.errors[i][x]); }
    renderLogic(k === 'mode' ? `input[name="lg-mode-${i}"][value="${c.mode}"]` : `#${e.target.id}`);
  });
  $('lg-body').addEventListener('input', e => {
    if (e.target.dataset.k !== 'value' || e.target.tagName !== 'INPUT' || !lg) return;
    lg.conds[+e.target.dataset.i].value = e.target.value;
  });
  $('lg-body').addEventListener('focusout', e => {   // refresh the summary once a typed value is finished
    if (e.target.dataset.k === 'value' && e.target.tagName === 'INPUT') { const id = e.relatedTarget?.id; renderLogic(id ? `#${id}` : null); }
  });
  $('lg-body').addEventListener('click', e => {
    if (e.target.closest('#lg-add')) { lg.conds.push(blankCond()); renderLogic(`#lg-page-${lg.conds.length - 1}`); announce(`Condition ${lg.conds.length} added.`); return; }
    const d = e.target.closest('[data-del]');
    if (d) {
      const i = +d.dataset.del;
      if (lg.conds.length === 1) { lg.conds = [blankCond()]; lg.errors = []; renderLogic('#lg-page-0'); announce('Condition cleared.'); return; }
      lg.conds.splice(i, 1); lg.errors.splice(i, 1); renderLogic(`#lg-page-${Math.max(0, i - 1)}`); announce(`Condition ${i + 1} deleted.`);
    }
  });
  $('lg-form').addEventListener('submit', e => {
    e.preventDefault();
    lg.errors = lg.conds.map(c => {
      const er = {};
      ['page', 'field', 'op'].forEach(k => { if (!c[k]) er[k] = 1; });
      if (c.mode === 'field') { if (!c.page2) er.page2 = 1; if (!c.field2) er.field2 = 1; }
      else if (!String(c.value).trim()) er.value = 1;
      return er;
    });
    const bad = lg.errors.findIndex(er => Object.keys(er).length);
    if (bad >= 0) {
      renderLogic();
      const k = Object.keys(lg.errors[bad])[0];
      $('logic-dialog').querySelector(`[data-k="${k}"][data-i="${bad}"]`)?.focus();
      announce(`Complete every part of condition ${bad + 1}.`);
      return;
    }
    const items = lg.f.logic.dep.items;
    if (lg.index >= 0) items[lg.index].conds = lg.conds;
    else items.push({ name: `Logic ${items.length + 1}`, conds: lg.conds });
    const name = lg.index >= 0 ? items[lg.index].name : items[items.length - 1].name;
    lg.saved = true;
    $('logic-dialog').close();
    renderCard('[data-act="addLogic"]');
    announce(`${name} saved.`);
  });
  $('logic-dialog').querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $('logic-dialog').close()));
  $('logic-dialog').addEventListener('click', e => { if (e.target === $('logic-dialog')) $('logic-dialog').close(); });
  $('logic-dialog').addEventListener('close', () => { if (lg && !lg.saved && lg.opener && document.contains(lg.opener)) lg.opener.focus(); });

  $('lg-close').innerHTML = ICON.close;
  $('lg-ico').innerHTML = ICON.logic;
  renderCard();
})();
