const XLSX = require('xlsx');
const wb = XLSX.readFile('2026-1 PIG \uBA74\uC811\uC790&\uC0C1\uC8FC \uBA85\uB2E8.xlsx');

// Excel serial time to HH:MM string
function excelTimeToStr(t) {
  const totalMinutes = Math.round(t * 24 * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('\n=== Sheet:', name, '(total rows:', data.length, ') ===');
  data.forEach((row, i) => {
    if (i === 0) { console.log(i, JSON.stringify(row)); return; }
    const out = [row[0]];
    if (typeof row[1] === 'number') out.push(excelTimeToStr(row[1]));
    else out.push(row[1]);
    if (typeof row[2] === 'number') out.push(excelTimeToStr(row[2]));
    else out.push(row[2]);
    out.push(row[3], row[4]);
    console.log(i, JSON.stringify(out));
  });
});
