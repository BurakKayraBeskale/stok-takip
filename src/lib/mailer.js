const nodemailer = require('nodemailer');

// EMAIL_USER / EMAIL_PASS ayarlanmamışsa transport oluşturmayız
function getTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your-gmail@gmail.com') {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Kritik stok uyarısı gönderir.
 * EMAIL_USER/PASS ayarlı değilse sessizce devam eder.
 */
async function sendLowStockAlert({ to, productName, sku, warehouseName, quantity, minStock }) {
  const transport = getTransport();
  if (!transport || !to) return;

  const subject = `[KRİTİK STOK] ${productName} (${sku})`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#dc2626;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:1.1rem">⚠ Kritik Stok Uyarısı</h2>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="margin:0 0 16px;color:#334155">
          Aşağıdaki ürünün stok miktarı minimum seviyenin altına düştü:
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
          <tr style="background:#f8fafc">
            <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#475569">Ürün</td>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b">${productName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#475569">SKU</td>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b">${sku}</td>
          </tr>
          <tr style="background:#f8fafc">
            <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#475569">Depo</td>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b">${warehouseName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#475569">Mevcut Stok</td>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#dc2626;font-weight:700">${quantity}</td>
          </tr>
          <tr style="background:#f8fafc">
            <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;color:#475569">Minimum Stok</td>
            <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b">${minStock}</td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:0.8rem;color:#94a3b8">
          Bu mesaj StokTakip sistemi tarafından otomatik gönderilmiştir.
        </p>
      </div>
    </div>
  `;

  await transport.sendMail({
    from: `"StokTakip" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`[mailer] Kritik stok emaili gönderildi → ${to} | ${sku}`);
}

module.exports = { sendLowStockAlert };
