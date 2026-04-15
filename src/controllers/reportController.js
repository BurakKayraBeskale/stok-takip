const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');

// PDFKit'in yerleşik fontları Türkçe karakterleri desteklemez;
// basit dönüşüm ile ASCII'ye çeviriyoruz.
function t(str) {
  return String(str ?? '')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

async function stockReport(req, res) {
  const organizationId = req.user.organizationId;

  const [org, inventory] = await Promise.all([
    prisma.organization.findUnique({
      where:  { id: organizationId },
      select: { name: true },
    }),
    prisma.inventory.findMany({
      where: { organizationId },
      include: {
        product:   { select: { sku: true, name: true, unit: true, unitPrice: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    }),
  ]);

  // ── Sayfa ve margin ayarları ──────────────────────────────────────
  const doc = new PDFDocument({ margin: 45, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="stok-raporu.pdf"');
  doc.pipe(res);

  const PAGE_W  = doc.page.width  - 90; // kullanılabilir genişlik
  const LEFT    = 45;
  const NOW     = new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' });
  const GRAY    = '#64748b';
  const DARK    = '#0f172a';
  const ACCENT  = '#3b82f6';

  // ── Başlık ────────────────────────────────────────────────────────
  doc.rect(LEFT - 5, doc.y - 5, PAGE_W + 10, 64).fill('#1e293b');
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(17)
     .text(t('Stok Raporu'), LEFT, doc.y - 50, { align: 'center', width: PAGE_W });
  doc.font('Helvetica').fontSize(10)
     .text(t(org?.name ?? ''), LEFT, doc.y + 2, { align: 'center', width: PAGE_W });
  doc.fontSize(8).fillColor('#94a3b8')
     .text(NOW, LEFT, doc.y + 4, { align: 'center', width: PAGE_W });

  doc.moveDown(2.5);

  // ── Özet kutuları ─────────────────────────────────────────────────
  const totalQty   = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * Number(i.product.unitPrice), 0);
  const lowCount   = inventory.filter(i => i.quantity <= (i.minStock ?? 0)).length;

  const summaries = [
    { label: 'Toplam Kayit', value: String(inventory.length) },
    { label: 'Toplam Miktar', value: String(totalQty) },
    { label: 'Stok Degeri', value: totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL' },
    { label: 'Kritik Stok', value: String(lowCount) },
  ];

  const boxW = PAGE_W / summaries.length - 6;
  let bx = LEFT;
  summaries.forEach(({ label, value }) => {
    doc.rect(bx, doc.y, boxW, 44).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor(GRAY).font('Helvetica').fontSize(7)
       .text(label.toUpperCase(), bx + 8, doc.y - 38, { width: boxW - 16 });
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(14)
       .text(value, bx + 8, doc.y - 24, { width: boxW - 16 });
    bx += boxW + 8;
  });

  doc.moveDown(3.8);

  // ── Tablo başlığı ─────────────────────────────────────────────────
  const cols = [
    { label: 'SKU',       w: 70,  align: 'left'  },
    { label: 'Urun Adi',  w: 150, align: 'left'  },
    { label: 'Depo',      w: 100, align: 'left'  },
    { label: 'Miktar',    w: 55,  align: 'right' },
    { label: 'Birim',     w: 40,  align: 'center'},
    { label: 'B.Fiyat',   w: 65,  align: 'right' },
    { label: 'Toplam',    w: 75,  align: 'right' },
  ];
  const ROW_H = 20;

  function drawRowBg(y, fill) {
    doc.rect(LEFT, y, PAGE_W, ROW_H).fill(fill);
  }

  function drawRow(cells, y, opts = {}) {
    let cx = LEFT;
    cells.forEach((cell, i) => {
      const col = cols[i];
      doc.fillColor(opts.color ?? DARK)
         .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(opts.fontSize ?? 8)
         .text(t(String(cell ?? '')), cx + 4, y + 6, {
           width:   col.w - 8,
           align:   col.align,
           ellipsis: true,
           lineBreak: false,
         });
      cx += col.w;
    });
  }

  // Başlık satırı
  drawRowBg(doc.y, ACCENT);
  drawRow(cols.map(c => c.label), doc.y, { bold: true, color: '#ffffff', fontSize: 7.5 });
  doc.moveDown(1.35);

  // ── Veri satırları ────────────────────────────────────────────────
  let rowIndex = 0;
  for (const item of inventory) {
    // Sayfa taştıysa yeni sayfa aç ve başlığı tekrar çiz
    if (doc.y + ROW_H > doc.page.height - 60) {
      doc.addPage();
      drawRowBg(doc.y, ACCENT);
      drawRow(cols.map(c => c.label), doc.y, { bold: true, color: '#ffffff', fontSize: 7.5 });
      doc.moveDown(1.35);
      rowIndex = 0;
    }

    const isLow  = item.quantity <= (item.minStock ?? 0) && item.minStock != null;
    const fill   = isLow ? '#fef2f2' : (rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc');
    const color  = isLow ? '#b91c1c' : DARK;
    const rowY   = doc.y;

    drawRowBg(rowY, fill);
    // İnce sol kenarlık — kritik stok için kırmızı
    if (isLow) {
      doc.rect(LEFT, rowY, 3, ROW_H).fill('#dc2626');
    }
    drawRow([
      item.product.sku,
      item.product.name,
      item.warehouse.name,
      item.quantity,
      item.product.unit,
      Number(item.product.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      (item.quantity * Number(item.product.unitPrice)).toLocaleString('tr-TR', { maximumFractionDigits: 0 }),
    ], rowY, { color });

    doc.moveDown(1.35);
    rowIndex++;
  }

  // ── Alt çizgi ────────────────────────────────────────────────────
  doc.moveDown(0.5);
  doc.moveTo(LEFT, doc.y).lineTo(LEFT + PAGE_W, doc.y).stroke('#e2e8f0');
  doc.moveDown(0.4);
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
     .text(
       t(`StokTakip — Bu rapor ${NOW} tarihinde otomatik olarak olusturulmustur.`),
       LEFT, doc.y, { align: 'center', width: PAGE_W }
     );

  doc.end();
}

module.exports = { stockReport };
