import { useEffect, useState } from 'react';
import api from '../api/axios.js';

async function downloadStockPDF() {
  const { data } = await api.get('/reports/stock', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'stok-raporu.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Son 7 günün tarihlerini üretir: ['2025-04-09', ..., '2025-04-15']
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.in, d.out)), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, padding: '0 4px' }}>
      {data.map(d => (
        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* barlar yan yana */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', height: 140 }}>
            <div
              title={`Giriş: ${d.in}`}
              style={{
                flex: 1,
                height: d.in > 0 ? Math.max((d.in / maxVal) * 130, 4) : 2,
                background: '#22c55e',
                borderRadius: '3px 3px 0 0',
                transition: 'height .3s',
              }}
            />
            <div
              title={`Çıkış: ${d.out}`}
              style={{
                flex: 1,
                height: d.out > 0 ? Math.max((d.out / maxVal) * 130, 4) : 2,
                background: '#ef4444',
                borderRadius: '3px 3px 0 0',
                transition: 'height .3s',
              }}
            />
            {d.adj > 0 && (
              <div
                title={`Düzeltme: ${d.adj}`}
                style={{
                  flex: 1,
                  height: Math.max((d.adj / maxVal) * 130, 4),
                  background: '#f59e0b',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height .3s',
                }}
              />
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats,       setStats]       = useState(null);
  const [lowStock,    setLowStock]    = useState([]);
  const [chartData,   setChartData]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [pdfError,    setPdfError]    = useState('');

  useEffect(() => {
    const days    = getLast7Days();
    const dateFrom = days[0];   // 6 gün öncesi
    const today   = days[6];    // bugün

    Promise.all([
      api.get('/products'),
      api.get(`/stock-movements?dateFrom=${dateFrom}`),
      api.get('/purchase-orders?status=pending'),
      api.get('/inventory/low-stock'),
      api.get('/inventory'),
    ])
      .then(([p, sm, po, ls, inv]) => {
        // ── Toplam stok değeri ──────────────────────────────
        const totalValue = inv.data.reduce((sum, item) => {
          return sum + item.quantity * Number(item.product?.unitPrice ?? 0);
        }, 0);

        // ── Bugünkü hareket sayısı ──────────────────────────
        const todayMovements = sm.data.filter(m =>
          new Date(m.createdAt).toISOString().slice(0, 10) === today
        ).length;

        setStats({
          products:      p.data.length,
          totalValue,
          todayMovements,
          pendingOrders: po.data.length,
        });

        // ── Son 7 gün grafik verisi ─────────────────────────
        const byDay = {};
        days.forEach(d => { byDay[d] = { in: 0, out: 0, adj: 0 }; });

        sm.data.forEach(m => {
          const day = new Date(m.createdAt).toISOString().slice(0, 10);
          if (!byDay[day]) return;
          if (m.type === 'in')         byDay[day].in  += 1;
          else if (m.type === 'out')   byDay[day].out += 1;
          else                         byDay[day].adj += 1;
        });

        setChartData(days.map(d => ({
          date:  d,
          label: new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
          in:    byDay[d].in,
          out:   byDay[d].out,
          adj:   byDay[d].adj,
        })));

        setLowStock(ls.data.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            {new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' })}
          </span>
          <button
            className="btn btn-secondary"
            disabled={pdfLoading}
            onClick={async () => {
              setPdfError('');
              setPdfLoading(true);
              try { await downloadStockPDF(); }
              catch { setPdfError('PDF oluşturulamadı'); }
              finally { setPdfLoading(false); }
            }}
          >
            {pdfLoading ? 'Hazırlanıyor…' : '↓ PDF Rapor İndir'}
          </button>
        </div>
      </div>
      {pdfError && <div className="alert-error">{pdfError}</div>}

      {/* ── Stat kartları ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="sc-label">Toplam Ürün</div>
          <div className="sc-value">{stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="sc-label">Toplam Stok Değeri</div>
          <div className="sc-value" style={{ fontSize: '1.4rem' }}>
            {stats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺
          </div>
        </div>
        <div className="stat-card warn">
          <div className="sc-label">Bugünkü Hareketler</div>
          <div className="sc-value">{stats.todayMovements}</div>
        </div>
        <div className="stat-card danger">
          <div className="sc-label">Bekleyen Sipariş</div>
          <div className="sc-value">{stats.pendingOrders}</div>
        </div>
      </div>

      {/* ── Son 7 günün stok hareketleri grafiği ── */}
      <div className="section-title" style={{ marginTop: 28 }}>Son 7 Günün Stok Hareketleri</div>
      <div className="table-wrap" style={{ padding: '20px 24px 16px' }}>
        {/* Lejant */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 14, fontSize: '0.78rem', color: '#475569' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
            Giriş
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
            Çıkış
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
            Düzeltme
          </span>
        </div>
        <BarChart data={chartData} />
        {chartData.every(d => d.in === 0 && d.out === 0 && d.adj === 0) && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
            Son 7 günde hareket kaydı yok
          </div>
        )}
      </div>

      {/* ── Kritik stok ── */}
      <div className="section-title" style={{ marginTop: 28 }}>Kritik Stok Seviyeleri</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Ürün</th>
              <th>Depo</th>
              <th>Mevcut</th>
              <th>Min. Stok</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr><td colSpan={5} className="empty">Kritik stok yok</td></tr>
            ) : lowStock.map(item => (
              <tr key={item.id}>
                <td>{item.product.sku}</td>
                <td>{item.product.name}</td>
                <td>{item.warehouse.name}</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>
                  {item.quantity} {item.product.unit}
                </td>
                <td>{item.minStock} {item.product.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
