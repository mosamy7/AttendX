/* ══════════════════════════════════════════
   نظام معالجة البصمة - app.js
   ══════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
let rawLines  = [];   // سطور الملف الخام
let parsedRows = [];  // الصفوف بعد المعالجة

const LEAVE_TYPES = [
  'إجازة اعتيادية',
  'إجازة عارضة',
  'راحة أسبوعية',
  'عطلة رسمية',
  'إجازة زواج',
  'إجازة حج',
  'إجازة مرضية',
  'إجازة وضع',
  'مأمورية',
  'تعليمية',
];

// ══════════════════════════════════════════
//  UPLOAD
// ══════════════════════════════════════════
const fileInput  = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) readFile(fileInput.files[0]);
});

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    rawLines = text.split(/\r?\n/).filter((l) => l.trim());
    document.getElementById('fileName').textContent =
      file.name + ` (${rawLines.length} سطر)`;
    document.getElementById('fileBadge').style.display = 'inline-flex';
    showToast(`✅ تم تحميل الملف: ${rawLines.length} سجل`, 'success');
  };
  reader.onerror = () => showToast('❌ فشل قراءة الملف', 'error');
  reader.readAsText(file, 'UTF-8');
}

// ══════════════════════════════════════════
//  SHIFTS
// ══════════════════════════════════════════

/**
 * إضافة وردية جديدة
 * @param {string} code   - كود الموظف (فارغ = للكل)
 * @param {string} start  - وقت بداية الوردية HH:MM
 * @param {string} end    - وقت نهاية الوردية HH:MM
 */
function addShift(code = '', start = '08:00', end = '16:00') {
  const id  = Date.now();
  const div = document.createElement('div');
  div.className = 'shift-row';
  div.id = 'shift_' + id;

  div.innerHTML = `
    <div>
      <label>كود الموظف (فارغ = للكل)</label>
      <input type="text" placeholder="مثال: 10097" class="sh-code" value="${code}">
    </div>
    <div>
      <label>بداية الوردية</label>
      <input type="time" class="sh-start" value="${start}">
    </div>
    <div>
      <label>نهاية الوردية</label>
      <input type="time" class="sh-end" value="${end}">
    </div>
    <div>
      <button class="btn btn-danger btn-sm"
        onclick="document.getElementById('shift_${id}').remove()">🗑</button>
    </div>
  `;

  document.getElementById('shiftList').appendChild(div);
}

/** قراءة كل الورديات المُدخلة */
function getShifts() {
  return [...document.querySelectorAll('[id^="shift_"]')].map((el) => ({
    code:  el.querySelector('.sh-code').value.trim(),
    start: el.querySelector('.sh-start').value,
    end:   el.querySelector('.sh-end').value,
  }));
}

/** الحصول على وردية موظف معين */
function getShiftFor(code) {
  const shifts = getShifts();
  return (
    shifts.find((s) => s.code === code) ||
    shifts.find((s) => s.code === '') ||
    { start: '08:00', end: '16:00' }
  );
}

// ══════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════

/** إضافة إجازة / مؤثر جديد */
function addLeave() {
  const id   = Date.now();
  const opts = LEAVE_TYPES.map(
    (t) => `<option value="${t}">${t}</option>`
  ).join('');

  const div = document.createElement('div');
  div.className = 'leave-item';
  div.id = 'leave_' + id;

  div.innerHTML = `
    <div>
      <label>نوع الإجازة / المؤثر</label>
      <select class="lv-type">${opts}</select>
    </div>
    <div>
      <label>كود الموظف (فارغ = للكل)</label>
      <input type="text" placeholder="فارغ = كل الموظفين" class="lv-code">
    </div>
    <div>
      <label>من تاريخ</label>
      <input type="date" class="lv-from">
    </div>
    <div>
      <label>إلى تاريخ</label>
      <input type="date" class="lv-to">
    </div>
    <div>
      <button class="btn btn-danger btn-sm"
        onclick="document.getElementById('leave_${id}').remove()">🗑</button>
    </div>
  `;

  document.getElementById('leaveList').appendChild(div);
}

/** قراءة كل الإجازات المُدخلة */
function getLeaves() {
  return [...document.querySelectorAll('[id^="leave_"]')]
    .map((el) => ({
      type: el.querySelector('.lv-type').value,
      code: el.querySelector('.lv-code').value.trim(),
      from: el.querySelector('.lv-from').value,
      to:   el.querySelector('.lv-to').value,
    }))
    .filter((l) => l.from);
}

/**
 * هل هذا اليوم إجازة لهذا الموظف؟
 * @returns {object|null} كائن الإجازة أو null
 */
function getLeaveForDay(code, dateStr) {
  return (
    getLeaves().find(
      (l) =>
        (l.code === '' || l.code === code) &&
        dateStr >= l.from &&
        dateStr <= (l.to || l.from)
    ) || null
  );
}

// ══════════════════════════════════════════
//  PARSE log.dat
//  يدعم الصيغ الشائعة:
//    1. "000123  2024-01-15  08:03:22"
//    2. "000123,2024/01/15,08:03:22"
//    3. "000123\t15/01/2024\t08:03:22"
// ══════════════════════════════════════════

/**
 * تحليل سطر واحد من الملف
 * @returns {{ code, date, time }|null}
 */
function parseLine(line) {
  line = line.trim();
  if (!line) return null;

  // تقسيم بالفواصل الشائعة أولاً
  let parts = line.split(/[\t,;|]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2)
    parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2)
    parts = line.split(/\s+/).map((p) => p.trim()).filter(Boolean);

  let code = '', dateStr = '', timeStr = '';

  for (const p of parts) {
    // صيغة YYYY-MM-DD أو YYYY/MM/DD
    if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(p)) {
      dateStr = p.replace(/\//g, '-');
      // تأكد من zero-padding
      const [y, m, d] = dateStr.split('-');
      dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    // صيغة DD-MM-YYYY أو DD/MM/YYYY
    } else if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(p)) {
      const [d, m, y] = p.replace(/\//g, '-').split('-');
      dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    // وقت HH:MM أو HH:MM:SS
    } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(p)) {
      timeStr = p.substring(0, 5);

    // كود رقمي
    } else if (/^\d+$/.test(p) && !code) {
      code = p;
    }
  }

  // محاولة تاريخ + وقت مدموجين "2024-01-15 08:03"
  if (!dateStr && !timeStr) {
    const combined = parts.find((p) =>
      /\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{2}:\d{2}/.test(p)
    );
    if (combined) {
      const [d, t] = combined.split(/\s+/);
      dateStr = d;
      timeStr = t.substring(0, 5);
    }
  }

  if (!dateStr || !timeStr) return null;
  return { code, date: dateStr, time: timeStr };
}

// ══════════════════════════════════════════
//  TIME HELPERS
// ══════════════════════════════════════════

/** HH:MM ← دقائق */
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** دقائق → HH:MM */
function fromMinutes(mins) {
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** فرق الوقت بالدقائق (b - a) */
function diffMins(a, b) {
  return toMinutes(b) - toMinutes(a);
}

// ══════════════════════════════════════════
//  CORE PROCESSING
// ══════════════════════════════════════════

/**
 * معالجة بيانات موظف واحد لنطاق تواريخ
 * @returns {Array} صفوف الموظف
 */
function processOneCode(code, empName, dateFrom, dateTo, grouped, dates) {
  const shift = getShiftFor(code);
  let totalOvertimeMins = 0;
  const rows = [];

  for (const date of dates) {
    const leave = getLeaveForDay(code, date);
    const key   = code + '|' + date;
    const entry = grouped[key];

    if (leave) {
      rows.push({ code, name: empName, date, firstIn: '-', lastOut: '-',
        late: '-', earlyLeave: '-', dailyOvertime: '-',
        totalOvertime: fromMinutes(totalOvertimeMins), status: leave.type });
      continue;
    }

    if (!entry || entry.times.length === 0) {
      rows.push({ code, name: empName, date, firstIn: '-', lastOut: '-',
        late: '-', earlyLeave: '-', dailyOvertime: '-',
        totalOvertime: fromMinutes(totalOvertimeMins), status: 'غياب' });
      continue;
    }

    const times   = [...entry.times].sort();
    const firstIn = times[0];
    const lastOut = times[times.length - 1];
    const lateMins  = Math.max(0, diffMins(shift.start, firstIn));
    const earlyMins = Math.max(0, diffMins(lastOut, shift.end));
    const otMins    = Math.max(0, diffMins(shift.end, lastOut));
    totalOvertimeMins += otMins;

    rows.push({ code, name: empName, date, firstIn, lastOut,
      late:          lateMins  > 0 ? fromMinutes(lateMins)  : '-',
      earlyLeave:    earlyMins > 0 ? fromMinutes(earlyMins) : '-',
      dailyOvertime: otMins    > 0 ? fromMinutes(otMins)    : '-',
      totalOvertime: fromMinutes(totalOvertimeMins),
      status: 'حاضر' });
  }
  return rows;
}

/**
 * المعالجة الرئيسية — ترجع { byCode: [{code, name, rows}], allRows }
 */
function process() {
  const empCode  = document.getElementById('empCode').value.trim();
  const empName  = document.getElementById('empName').value.trim();
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo   = document.getElementById('dateTo').value;

  if (!rawLines.length) { showToast('⚠️ يرجى رفع ملف البصمة أولاً', 'error'); return null; }
  if (!dateFrom || !dateTo) { showToast('⚠️ يرجى تحديد نطاق التواريخ', 'error'); return null; }
  if (dateFrom > dateTo) { showToast('⚠️ تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error'); return null; }

  // تحليل السطور
  const records = [];
  for (const line of rawLines) {
    const r = parseLine(line);
    if (!r) continue;
    if (empCode && r.code !== empCode) continue;
    if (r.date < dateFrom || r.date > dateTo) continue;
    records.push(r);
  }

  // تجميع البصمات
  const grouped = {};
  for (const r of records) {
    const key = r.code + '|' + r.date;
    if (!grouped[key]) grouped[key] = { code: r.code, date: r.date, times: [] };
    if (!grouped[key].times.includes(r.time)) grouped[key].times.push(r.time);
  }

  // نطاق التواريخ
  const dates = [];
  const cur = new Date(dateFrom);
  const end = new Date(dateTo);
  while (cur <= end) { dates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }

  // الأكواد
  const codes = empCode ? [empCode] : [...new Set(records.map((r) => r.code))];

  const byCode = [];
  const allRows = [];

  for (const code of codes) {
    const rows = processOneCode(code, empName, dateFrom, dateTo, grouped, dates);
    byCode.push({ code, name: empName || code, rows });
    allRows.push(...rows);
  }

  return { byCode, allRows };
}

// ══════════════════════════════════════════
//  PREVIEW
// ══════════════════════════════════════════

function makeBadge(status) {
  if (status === 'غياب') return `<span class="badge badge-absent">❌ ${status}</span>`;
  if (status === 'حاضر') return `<span class="badge badge-present">✅ ${status}</span>`;
  const idx = LEAVE_TYPES.indexOf(status);
  const cls = idx >= 0 ? `badge-leave-${idx}` : 'badge-leave-0';
  return `<span class="badge ${cls}">🏖 ${status}</span>`;
}

function calcTotals(rows) {
  let workMins = 0, lateMins = 0, earlyMins = 0, otMins = 0;
  let present = 0, absent = 0, leave = 0;
  for (const r of rows) {
    if (r.status === 'حاضر') {
      present++;
      if (r.firstIn !== '-' && r.lastOut !== '-') workMins += Math.max(0, diffMins(r.firstIn, r.lastOut));
      if (r.late          !== '-') lateMins  += toMinutes(r.late);
      if (r.earlyLeave    !== '-') earlyMins += toMinutes(r.earlyLeave);
      if (r.dailyOvertime !== '-') otMins    += toMinutes(r.dailyOvertime);
    } else if (r.status === 'غياب') { absent++; } else { leave++; }
  }
  return { workMins, lateMins, earlyMins, otMins, present, absent, leave };
}

function buildEmployeeTable(code, name, rows) {
  let html = `
    <div class="emp-block">
      <div class="emp-block-header">
        <span class="emp-block-title">👤 ${name || code}</span>
        <span class="emp-block-code">كود: ${code}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>الكود</th><th>الاسم</th><th>التاريخ</th>
            <th>أول بصمة</th><th>آخر بصمة</th>
            <th>التأخير</th><th>الانصراف المبكر</th>
            <th>إضافي اليوم</th><th>إجمالي الإضافي</th><th>الحالة</th>
          </tr></thead>
          <tbody>`;

  for (const r of rows) {
    html += `<tr>
      <td>${r.code}</td><td>${r.name || '-'}</td><td>${r.date}</td>
      <td>${r.firstIn}</td><td>${r.lastOut}</td>
      <td>${r.late}</td><td>${r.earlyLeave}</td>
      <td>${r.dailyOvertime}</td><td>${r.totalOvertime}</td>
      <td>${makeBadge(r.status)}</td>
    </tr>`;
  }

  const t = calcTotals(rows);
  html += `
    <tr class="summary-row">
      <td colspan="3">📊 إجماليات: ${code}</td>
      <td colspan="2">⏱ عمل: <b>${fromMinutes(t.workMins)}</b></td>
      <td>⏰ تأخير: <b>${fromMinutes(t.lateMins)}</b></td>
      <td>🚪 مبكر: <b>${fromMinutes(t.earlyMins)}</b></td>
      <td colspan="2">➕ إضافي: <b>${fromMinutes(t.otMins)}</b></td>
      <td>✅${t.present} ❌${t.absent} 🏖${t.leave}</td>
    </tr>
    </tbody></table></div></div>`;
  return html;
}

function preview() {
  const result = process();
  if (!result) return;

  parsedRows = result.allRows;
  const { byCode } = result;

  const tbody = document.getElementById('previewBody');
  // نستخدم container بدل tbody عشان نحط جداول متعددة
  const previewTable = document.getElementById('previewTable');
  const container    = previewTable.parentElement;

  // إزالة الجدول الأصلي واستبداله بـ div
  if (!document.getElementById('multiTableContainer')) {
    const div = document.createElement('div');
    div.id = 'multiTableContainer';
    container.appendChild(div);
  }
  const mtc = document.getElementById('multiTableContainer');
  mtc.innerHTML = '';
  previewTable.style.display = 'none';

  if (!parsedRows.length) {
    mtc.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>لا توجد بيانات تطابق المعايير المحددة</div>`;
  } else {
    for (const { code, name, rows } of byCode) {
      mtc.innerHTML += buildEmployeeTable(code, name, rows);
    }
  }

  // إحصاءات إجمالية
  const t = calcTotals(parsedRows);
  document.getElementById('previewStats').innerHTML = `
    <span class="stat-badge present">✅ حاضر: <b>${t.present}</b></span>
    <span class="stat-badge absent">❌ غياب: <b>${t.absent}</b></span>
    <span class="stat-badge leave">🏖 إجازات: <b>${t.leave}</b></span>
    <span class="stat-badge total">👥 موظفين: <b>${byCode.length}</b></span>
    <span class="stat-badge total">📋 إجمالي: <b>${parsedRows.length}</b></span>`;

  const previewSection = document.getElementById('previewSection');
  previewSection.style.display = 'block';
  previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`✅ تمت المعاينة: ${byCode.length} موظف، ${parsedRows.length} سجل`, 'success');
}


// ══════════════════════════════════════════
//  EXPORT EXCEL
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  STYLE HELPERS
// ══════════════════════════════════════════

/** تطبيق ستايل على خلية */
function applyStyle(ws, cellRef, style) {
  if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
  ws[cellRef].s = style;
}

/** ستايلات ثابتة */
const S = {
  // رأس التقرير (عنوان كبير)
  reportTitle: {
    font:      { bold: true, sz: 16, color: { rgb: 'FFFFFF' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '1A1A2E' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border:    { bottom: { style: 'medium', color: { rgb: 'F0A500' } } },
  },
  // سطر المعلومات (فترة / موظف)
  infoLabel: {
    font:      { bold: true, sz: 10, color: { rgb: 'F0A500' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '16213E' } },
    alignment: { horizontal: 'right', vertical: 'center' },
  },
  infoValue: {
    font:      { sz: 10, color: { rgb: 'E6EDF3' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '16213E' } },
    alignment: { horizontal: 'right', vertical: 'center' },
  },
  // رأس الجدول
  header: {
    font:      { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: 'F0A500' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'medium', color: { rgb: 'E05C00' } },
      bottom: { style: 'medium', color: { rgb: 'E05C00' } },
      left:   { style: 'thin',   color: { rgb: 'E05C00' } },
      right:  { style: 'thin',   color: { rgb: 'E05C00' } },
    },
  },
  // خلية بيانات عادية (صفوف زوجية)
  cellEven: {
    font:      { sz: 10, color: { rgb: 'E6EDF3' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '161B22' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // خلية بيانات (صفوف فردية - أفتح قليلاً)
  cellOdd: {
    font:      { sz: 10, color: { rgb: 'E6EDF3' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '1C2330' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // خلية غياب
  absent: {
    font:      { bold: true, sz: 10, color: { rgb: 'F85149' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '2D1A19' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // خلية حاضر
  present: {
    font:      { bold: true, sz: 10, color: { rgb: '3FB950' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '0D2318' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // خلية إجازة
  leave: {
    font:      { bold: true, sz: 10, color: { rgb: '58A6FF' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '0D1B2A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // خلية تأخير / إضافي
  warn: {
    font:      { sz: 10, color: { rgb: 'F0A500' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '1C1A0D' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: '30363D' } },
      bottom: { style: 'thin', color: { rgb: '30363D' } },
      left:   { style: 'thin', color: { rgb: '30363D' } },
      right:  { style: 'thin', color: { rgb: '30363D' } },
    },
  },
  // صف الإجماليات
  totals: {
    font:      { bold: true, sz: 11, color: { rgb: '000000' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: 'F0A500' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'medium', color: { rgb: 'E05C00' } },
      bottom: { style: 'medium', color: { rgb: 'E05C00' } },
      left:   { style: 'thin',   color: { rgb: 'E05C00' } },
      right:  { style: 'thin',   color: { rgb: 'E05C00' } },
    },
  },
  // رأس الجدول في شيت الملخص (أخضر)
  headerGreen: {
    font:      { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '2EA043' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'medium', color: { rgb: '3FB950' } },
      bottom: { style: 'medium', color: { rgb: '3FB950' } },
      left:   { style: 'thin',   color: { rgb: '3FB950' } },
      right:  { style: 'thin',   color: { rgb: '3FB950' } },
    },
  },
  // رأس كتلة الموظف
  empHeader: {
    font:      { bold: true, sz: 12, color: { rgb: 'F0A500' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '0D1117' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      bottom: { style: 'medium', color: { rgb: 'F0A500' } },
    },
  },
  // فاصل بين الموظفين
  sep: {
    font:      { sz: 6 },
    fill:      { patternType: 'solid', fgColor: { rgb: '0D1117' } },
    alignment: { horizontal: 'center' },
  },
  // Footer المطور
  footer: {
    font:      { sz: 9, italic: true, color: { rgb: '7D8590' }, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: '0D1117' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'F0A500' } },
    },
  },
};

/** تطبيق ستايل على نطاق كامل */
function styleRange(ws, startRow, startCol, endRow, endCol, style) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = style;
    }
  }
}

// ══════════════════════════════════════════
//  EXPORT EXCEL
// ══════════════════════════════════════════

function exportExcel() {
  const result = process();
  if (!result) return;
  parsedRows = result.allRows;
  const { byCode } = result;

  if (!parsedRows.length) { showToast('⚠️ لا توجد بيانات للتصدير', 'error'); return; }

  const wb        = XLSX.utils.book_new();
  const dateFrom  = document.getElementById('dateFrom').value;
  const dateTo    = document.getElementById('dateTo').value;
  const today     = new Date().toLocaleDateString('ar-EG');
  const COLS      = 10;

  // ══════════════════════════════════════════
  //  SHEET 1 — كل الموظفين في صفحة واحدة
  //  جدول لكل موظف تحت التاني مع فاصل
  // ══════════════════════════════════════════
  const aoa     = [];
  const merges  = [];
  const rowMeta = []; // { type: 'title'|'info'|'header'|'data'|'totals'|'sep'|'emp', rowIdx, isEven, status }

  // ── عنوان عام ──
  aoa.push([`تقرير الحضور والانصراف — AttendX`, ...Array(COLS-1).fill('')]);
  rowMeta.push({ type: 'title' });
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: COLS-1 } });

  aoa.push([`الفترة: ${dateFrom} → ${dateTo}`, '', `عدد الموظفين: ${byCode.length}`, '', '', `تاريخ الطباعة: ${today}`, '', '', '', '']);
  rowMeta.push({ type: 'info' });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } });
  merges.push({ s: { r: 1, c: 5 }, e: { r: 1, c: 9 } });

  for (const { code, name, rows } of byCode) {
    // ── فاصل ──
    aoa.push(Array(COLS).fill(''));
    rowMeta.push({ type: 'sep' });

    // ── رأس الموظف ──
    const empRow = aoa.length;
    aoa.push([`👤 ${name || code}  —  كود: ${code}`, ...Array(COLS-1).fill('')]);
    rowMeta.push({ type: 'emp' });
    merges.push({ s: { r: empRow, c: 0 }, e: { r: empRow, c: COLS-1 } });

    // ── رأس الجدول ──
    aoa.push(['الكود','الاسم','التاريخ','أول بصمة\n(حضور)','آخر بصمة\n(انصراف)','التأخير','الانصراف\nالمبكر','إضافي\nاليوم','إجمالي\nالإضافي','الحالة']);
    rowMeta.push({ type: 'header' });

    // ── صفوف البيانات ──
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      aoa.push([r.code, r.name||'-', r.date, r.firstIn, r.lastOut, r.late, r.earlyLeave, r.dailyOvertime, r.totalOvertime, r.status]);
      rowMeta.push({ type: 'data', isEven: i % 2 === 0, status: r.status, row: r });
    }

    // ── إجماليات الموظف ──
    const t = calcTotals(rows);
    const totRow = aoa.length;
    aoa.push([`إجماليات: ${code}`, '', `${rows.length} يوم`,
      `عمل: ${fromMinutes(t.workMins)}`, '',
      `تأخير: ${fromMinutes(t.lateMins)}`,
      `مبكر: ${fromMinutes(t.earlyMins)}`,
      `إضافي: ${fromMinutes(t.otMins)}`, '',
      `✓${t.present} ✗${t.absent} ⊘${t.leave}`]);
    rowMeta.push({ type: 'totals' });
    merges.push({ s: { r: totRow, c: 0 }, e: { r: totRow, c: 1 } });
    merges.push({ s: { r: totRow, c: 3 }, e: { r: totRow, c: 4 } });
    merges.push({ s: { r: totRow, c: 7 }, e: { r: totRow, c: 8 } });
  }

  // ── إجماليات كل الموظفين ──
  const tAll = calcTotals(parsedRows);
  aoa.push(Array(COLS).fill(''));
  rowMeta.push({ type: 'sep' });
  const grandRow = aoa.length;
  aoa.push([`🏆 الإجمالي الكلي`, '',
    `${parsedRows.length} يوم`,
    `عمل: ${fromMinutes(tAll.workMins)}`, '',
    `تأخير: ${fromMinutes(tAll.lateMins)}`,
    `مبكر: ${fromMinutes(tAll.earlyMins)}`,
    `إضافي: ${fromMinutes(tAll.otMins)}`, '',
    `✓${tAll.present} ✗${tAll.absent} ⊘${tAll.leave}`]);
  rowMeta.push({ type: 'totals' });
  merges.push({ s: { r: grandRow, c: 0 }, e: { r: grandRow, c: 1 } });
  merges.push({ s: { r: grandRow, c: 3 }, e: { r: grandRow, c: 4 } });
  merges.push({ s: { r: grandRow, c: 7 }, e: { r: grandRow, c: 8 } });

  // ── Footer بيانات المطور ──
  aoa.push(Array(COLS).fill(''));
  rowMeta.push({ type: 'sep' });
  const footerRow = aoa.length;
  aoa.push([
    '📱 WhatsApp: +201064266938', '', '',
    '💼 LinkedIn: linkedin.com/in/mosamy7/', '', '',
    '🐙 GitHub: github.com/mosamy7', '', '',
    'Developed by Mohamed Samy — AttendX'
  ]);
  rowMeta.push({ type: 'footer' });
  merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: 2 } });
  merges.push({ s: { r: footerRow, c: 3 }, e: { r: footerRow, c: 5 } });
  merges.push({ s: { r: footerRow, c: 6 }, e: { r: footerRow, c: 8 } });

  // ── بناء الشيت ──
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [12, 16, 13, 13, 13, 10, 12, 11, 12, 18].map((w) => ({ wch: w }));
  ws['!merges'] = merges;

  // ارتفاع الصفوف وستايلات
  ws['!rows'] = [];
  for (let i = 0; i < rowMeta.length; i++) {
    const m = rowMeta[i];
    if (m.type === 'title')  { ws['!rows'][i] = { hpt: 36 }; applyStyleRange1(ws, i, 0, COLS-1, S.reportTitle); }
    else if (m.type === 'info')   { ws['!rows'][i] = { hpt: 20 }; applyStyleRange1(ws, i, 0, COLS-1, S.infoValue); }
    else if (m.type === 'sep')    { ws['!rows'][i] = { hpt: 10 }; applyStyleRange1(ws, i, 0, COLS-1, S.sep); }
    else if (m.type === 'emp')    { ws['!rows'][i] = { hpt: 26 }; applyStyleRange1(ws, i, 0, COLS-1, S.empHeader); }
    else if (m.type === 'header') { ws['!rows'][i] = { hpt: 32 }; applyStyleRange1(ws, i, 0, COLS-1, S.header); }
    else if (m.type === 'totals') { ws['!rows'][i] = { hpt: 26 }; applyStyleRange1(ws, i, 0, COLS-1, S.totals); }
    else if (m.type === 'footer') { ws['!rows'][i] = { hpt: 24 }; applyStyleRange1(ws, i, 0, COLS-1, S.footer); }
    else if (m.type === 'data') {
      ws['!rows'][i] = { hpt: 20 };
      const base = m.isEven ? S.cellEven : S.cellOdd;
      for (let c = 0; c < COLS; c++) {
        const ref = XLSX.utils.encode_cell({ r: i, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        if (c === 9) {
          if (m.status === 'غياب')       ws[ref].s = S.absent;
          else if (m.status === 'حاضر') ws[ref].s = S.present;
          else                            ws[ref].s = S.leave;
        } else if (c >= 5 && c <= 8) {
          const vals = [m.row.late, m.row.earlyLeave, m.row.dailyOvertime, m.row.totalOvertime];
          ws[ref].s = vals[c-5] !== '-' ? S.warn : base;
        } else {
          ws[ref].s = base;
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, '📋 التقرير الكامل');

  // ════════════════════════════════════════
  //  SHEET 2 — ملخص الموظفين
  // ════════════════════════════════════════
  const sumHdr = ['الكود','الاسم','أيام الحضور','أيام الغياب','أيام الإجازة',
    'مرات التأخير','مرات الانصراف\nالمبكر','إجمالي ساعات\nالعمل',
    'إجمالي التأخير','إجمالي الانصراف\nالمبكر','إجمالي الإضافي'];
  const SCOLS = sumHdr.length;

  const sumAoa = [
    [`ملخص الموظفين — AttendX`, ...Array(SCOLS-1).fill('')],
    [`الفترة: ${dateFrom} → ${dateTo}`, ...Array(SCOLS-1).fill('')],
    Array(SCOLS).fill(''),
    sumHdr,
  ];

  for (const { code, name, rows } of byCode) {
    const t = calcTotals(rows);
    let lateTimes = 0, earlyTimes = 0;
    for (const r of rows) {
      if (r.late !== '-') lateTimes++;
      if (r.earlyLeave !== '-') earlyTimes++;
    }
    sumAoa.push([code, name||'-', t.present, t.absent, t.leave,
      lateTimes, earlyTimes,
      fromMinutes(t.workMins), fromMinutes(t.lateMins),
      fromMinutes(t.earlyMins), fromMinutes(t.otMins)]);
  }

  // صف إجمالي
  const tAll2 = calcTotals(parsedRows);
  let lateTimesAll = 0, earlyTimesAll = 0;
  for (const r of parsedRows) { if (r.late !== '-') lateTimesAll++; if (r.earlyLeave !== '-') earlyTimesAll++; }
  sumAoa.push(['الإجمالي الكلي', `${byCode.length} موظف`,
    tAll2.present, tAll2.absent, tAll2.leave,
    lateTimesAll, earlyTimesAll,
    fromMinutes(tAll2.workMins), fromMinutes(tAll2.lateMins),
    fromMinutes(tAll2.earlyMins), fromMinutes(tAll2.otMins)]);

  // Footer
  sumAoa.push(Array(SCOLS).fill(''));
  const sfooterRow = sumAoa.length;
  sumAoa.push(['📱 +201064266938','','','💼 linkedin.com/in/mosamy7/','','','🐙 github.com/mosamy7','','','','Developed by Mohamed Samy']);

  const ws2 = XLSX.utils.aoa_to_sheet(sumAoa);
  ws2['!cols'] = [12,16,12,12,12,12,14,14,14,14,14].map(w=>({wch:w}));
  ws2['!rows'] = [{hpt:32},{hpt:20},{hpt:8},{hpt:30}];
  for (let i=4;i<sumAoa.length-2;i++) ws2['!rows'][i]={hpt:20};
  ws2['!rows'][sumAoa.length-2]={hpt:10};
  ws2['!rows'][sumAoa.length-1]={hpt:22};

  ws2['!merges'] = [
    {s:{r:0,c:0},e:{r:0,c:SCOLS-1}},
    {s:{r:1,c:0},e:{r:1,c:SCOLS-1}},
    {s:{r:sumAoa.length-4,c:0},e:{r:sumAoa.length-4,c:1}},
    {s:{r:sfooterRow,c:0},e:{r:sfooterRow,c:2}},
    {s:{r:sfooterRow,c:3},e:{r:sfooterRow,c:5}},
    {s:{r:sfooterRow,c:6},e:{r:sfooterRow,c:8}},
    {s:{r:sfooterRow,c:9},e:{r:sfooterRow,c:10}},
  ];

  applyStyleRange1(ws2,0,0,SCOLS-1,S.reportTitle);
  applyStyleRange1(ws2,1,0,SCOLS-1,S.infoValue);
  applyStyleRange1(ws2,2,0,SCOLS-1,S.sep);
  applyStyleRange1(ws2,3,0,SCOLS-1,S.headerGreen);
  for (let i=4;i<sumAoa.length-2;i++) {
    const isEven=(i-4)%2===0;
    applyStyleRange1(ws2,i,0,SCOLS-1,isEven?S.cellEven:S.cellOdd);
  }
  applyStyleRange1(ws2,sumAoa.length-2,0,SCOLS-1,S.sep);
  applyStyleRange1(ws2,sumAoa.length-1,0,SCOLS-1,S.footer);
  // صف الإجمالي الكلي
  applyStyleRange1(ws2, sumAoa.length-3, 0, SCOLS-1, S.totals);

  XLSX.utils.book_append_sheet(wb, ws2, '📊 ملخص الموظفين');

  // تصدير
  const fname = `AttendX_${dateFrom}_${dateTo}.xlsx`;
  XLSX.writeFile(wb, fname, { bookSST: false, type: 'binary', cellStyles: true });
  showToast('📥 تم تصدير التقرير بنجاح!', 'success');
}

/** helper: ستايل نطاق صف كامل في شيت */
function applyStyleRange1(ws, row, c1, c2, style) {
  for (let c = c1; c <= c2; c++) {
    const ref = XLSX.utils.encode_cell({ r: row, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = style;
  }
}

// ══════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════

let toastTimer = null;

/**
 * إظهار رسالة Toast
 * @param {string} msg   - نص الرسالة
 * @param {string} type  - 'success' | 'error'
 */
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // وردية افتراضية واحدة
  addShift('', '08:00', '16:00');
});
