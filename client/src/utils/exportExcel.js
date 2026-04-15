import * as XLSX from 'xlsx';

/**
 * rows  : array of plain objects (keys = sütun başlıkları)
 * filename : dosya adı (.xlsx otomatik eklenir)
 */
export function exportToExcel(rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);

  // Sütun genişliklerini otomatik ayarla
  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Veri');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
