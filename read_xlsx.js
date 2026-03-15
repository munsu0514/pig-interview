const XLSX = require('xlsx');
const wb = XLSX.readFile('2026-1 PIG \uBA74\uC811\uC790&\uC0C1\uC8FC \uBA85\uB2E8.xlsx');
console.log('SheetNames:', wb.SheetNames);
wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('\n=== Sheet:', name, '===');
  data.slice(0, 15).forEach((row, i) => console.log(i, JSON.stringify(row, null, 0)));
});
