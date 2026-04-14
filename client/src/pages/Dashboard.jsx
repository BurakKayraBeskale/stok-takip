import { useEffect, useState } from 'react';
import api from '../api/axios.js';

export default function Dashboard() {
  const [stats, setStats]       = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      api.get('/products'),
      api.get('/warehouses'),
      api.get(`/stock-movements?dateFrom=${today}`),
      api.get('/purchase-orders?status=pending'),
      api.get('/inventory/low-stock'),
    ])
      .then(([p, w, sm, po, ls]) => {
        setStats({
          products:        p.data.length,
          warehouses:      w.data.length,
          todayMovements:  sm.data.length,
          pendingOrders:   po.data.length,
        });
        setLowStock(ls.data.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
          {new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' })}
        </span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="sc-label">Toplam Ürün</div>
          <div className="sc-value">{stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="sc-label">Depolar</div>
          <div className="sc-value">{stats.warehouses}</div>
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

      <div className="section-title">Kritik Stok Seviyeleri</div>
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
