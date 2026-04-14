import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_ITEM = { productId: '', quantity: '', unitPrice: '' };

const STATUS_LABELS = {
  pending:   'Bekliyor',
  approved:  'Onaylandı',
  delivered: 'Teslim Alındı',
  cancelled: 'İptal',
};

const NEXT_STATUS = {
  pending:  ['approved', 'cancelled'],
  approved: ['delivered', 'cancelled'],
};

const NEXT_LABELS = {
  approved:  'Onayla',
  delivered: 'Teslim Al',
  cancelled: 'İptal Et',
};

export default function Orders() {
  const [orders,      setOrders]      = useState([]);
  const [products,    setProducts]    = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [warehouses,  setWarehouses]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterStatus,setFilterStatus]= useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [items,       setItems]       = useState([{ ...EMPTY_ITEM }]);
  const [supplierId,  setSupplierId]  = useState('');
  const [deliveryDate,setDeliveryDate]= useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  // delivery modal state
  const [deliverOrder,   setDeliverOrder]   = useState(null);
  const [deliverWH,      setDeliverWH]      = useState('');
  const [deliverLoading, setDeliverLoading] = useState(false);
  const [deliverError,   setDeliverError]   = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/purchase-orders'),
      api.get('/products'),
      api.get('/suppliers'),
      api.get('/warehouses'),
    ]).then(([o, p, s, w]) => {
      setOrders(o.data);
      setProducts(p.data);
      setSuppliers(s.data);
      setWarehouses(w.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  // ── Item rows ──────────────────────────────────────────────
  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  }
  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }
  function updateItem(idx, field, value) {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // auto-fill unitPrice from product catalog
      if (field === 'productId' && value) {
        const p = products.find(p => String(p.id) === value);
        if (p) next[idx].unitPrice = String(p.unitPrice);
      }
      return next;
    });
  }

  const total = items.reduce((sum, i) => {
    const q = Number(i.quantity) || 0;
    const u = Number(i.unitPrice) || 0;
    return sum + q * u;
  }, 0);

  // ── Create order ──────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!supplierId) return setError('Tedarikçi seçin');
    if (items.some(i => !i.productId || !i.quantity || !i.unitPrice))
      return setError('Tüm kalemleri eksiksiz doldurun');

    setSubmitting(true);
    try {
      const { data } = await api.post('/purchase-orders', {
        supplierId:   Number(supplierId),
        deliveryDate: deliveryDate || undefined,
        items: items.map(i => ({
          productId: Number(i.productId),
          quantity:  Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      });
      setOrders(prev => [data, ...prev]);
      setItems([{ ...EMPTY_ITEM }]);
      setSupplierId('');
      setDeliveryDate('');
      setShowForm(false);
      setSuccess(`${data.orderNo} siparişi oluşturuldu.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Sipariş oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Status update ──────────────────────────────────────────
  async function changeStatus(order, newStatus) {
    if (newStatus === 'delivered') {
      setDeliverOrder(order);
      setDeliverWH('');
      setDeliverError('');
      return;
    }
    try {
      const { data } = await api.patch(`/purchase-orders/${order.id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === data.id ? data : o));
    } catch (err) {
      alert(err.response?.data?.error ?? 'Durum güncellenemedi');
    }
  }

  async function confirmDelivery() {
    if (!deliverWH) return setDeliverError('Depo seçin');
    setDeliverLoading(true);
    try {
      const { data } = await api.patch(`/purchase-orders/${deliverOrder.id}/status`, {
        status:      'delivered',
        warehouseId: Number(deliverWH),
      });
      setOrders(prev => prev.map(o => o.id === data.id ? data : o));
      setDeliverOrder(null);
    } catch (err) {
      setDeliverError(err.response?.data?.error ?? 'Teslim alınamadı');
    } finally {
      setDeliverLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Satın Alma Siparişleri</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Sipariş'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {/* ── Create form ── */}
      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Sipariş Oluştur</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label>Tedarikçi *</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                  <option value="">Seçin</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tahmini Teslimat</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th style={{ width: 100 }}>Miktar</th>
                    <th style={{ width: 130 }}>Birim Fiyat (₺)</th>
                    <th style={{ width: 120 }}>Toplam</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.productId}
                          onChange={e => updateItem(idx, 'productId', e.target.value)}
                          required
                        >
                          <option value="">Ürün seçin</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number" min="1" step="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))
                          .toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => removeItem(idx)}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                + Kalem Ekle
              </button>
              <div className="items-total">
                Genel Toplam: {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Sipariş Oluştur'}
            </button>
          </form>
        </div>
      )}

      {/* ── Delivery modal ── */}
      {deliverOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 28, width: 380,
            boxShadow: '0 8px 40px rgba(0,0,0,.15)'
          }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Teslim Alma — {deliverOrder.orderNo}</h3>
            {deliverError && <div className="alert-error">{deliverError}</div>}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Teslim Alınacak Depo *</label>
              <select value={deliverWH} onChange={e => setDeliverWH(e.target.value)}>
                <option value="">Seçin</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeliverOrder(null)}>İptal</button>
              <button className="btn btn-primary" onClick={confirmDelivery} disabled={deliverLoading}>
                {deliverLoading ? 'İşleniyor…' : 'Teslim Al'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      <div className="table-wrap">
        <div className="table-toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            {filtered.length} sipariş
          </span>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Tedarikçi</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Kalemler</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty">Sipariş bulunamadı</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                      {order.orderNo}
                    </code>
                  </td>
                  <td>{order.supplier.name}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td style={{ color: '#64748b' }}>{order._count?.orderItems ?? '—'} kalem</td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(NEXT_STATUS[order.status] ?? []).map(ns => (
                        <button
                          key={ns}
                          className={`btn btn-sm ${ns === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => changeStatus(order, ns)}
                        >
                          {NEXT_LABELS[ns]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
