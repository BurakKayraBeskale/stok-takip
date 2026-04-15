import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { exportToExcel } from '../utils/exportExcel.js';

const EMPTY_FORM = {
  productId: '', warehouseId: '', type: 'in',
  quantity: '', reference: '', note: '',
};

const TYPE_LABELS = { in: 'Giriş', out: 'Çıkış', adjustment: 'Düzeltme' };

export default function StockMovements() {
  const [movements,   setMovements]   = useState([]);
  const [products,    setProducts]    = useState([]);
  const [warehouses,  setWarehouses]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState({ type: '', productId: '', warehouseId: '' });
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/stock-movements'),
      api.get('/products'),
      api.get('/warehouses'),
    ]).then(([m, p, w]) => {
      setMovements(m.data);
      setProducts(p.data);
      setWarehouses(w.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter(m => {
    if (filter.type        && m.type                     !== filter.type)              return false;
    if (filter.productId   && String(m.productId)        !== filter.productId)         return false;
    if (filter.warehouseId && String(m.warehouseId)      !== filter.warehouseId)       return false;
    return true;
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/stock-movements', {
        productId:   Number(form.productId),
        warehouseId: Number(form.warehouseId),
        type:        form.type,
        quantity:    Number(form.quantity),
        reference:   form.reference || undefined,
        note:        form.note      || undefined,
      });
      setMovements(prev => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess('Stok hareketi kaydedildi.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Hareket kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    const rows = filtered.map(m => ({
      'Tarih':    new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
      'Ürün':     m.product.name,
      'SKU':      m.product.sku,
      'Depo':     m.warehouse.name,
      'Tip':      TYPE_LABELS[m.type],
      'Miktar':   m.type === 'out' ? -Math.abs(m.quantity) : Math.abs(m.quantity),
      'Birim':    m.product.unit,
      'Referans': m.reference ?? '',
      'Kullanıcı': m.user.name,
    }));
    exportToExcel(rows, 'stok_hareketleri');
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stok Hareketleri</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
            ↓ Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
          >
            {showForm ? 'Formu Kapat' : '+ Yeni Hareket'}
          </button>
        </div>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Stok Hareketi Ekle</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Ürün *</label>
                <select name="productId" value={form.productId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Depo *</label>
                <select name="warehouseId" value={form.warehouseId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hareket Tipi *</label>
                <select name="type" value={form.type} onChange={handleChange} required>
                  <option value="in">Giriş</option>
                  <option value="out">Çıkış</option>
                  <option value="adjustment">Düzeltme</option>
                </select>
              </div>
              <div className="form-group">
                <label>Miktar *{form.type === 'adjustment' && ' (negatif olabilir)'}</label>
                <input
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Referans</label>
                <input name="reference" placeholder="Fatura no, PO no…"
                  value={form.reference} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label>Not</label>
                <textarea name="note" value={form.note} onChange={handleChange} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          >
            <option value="">Tüm Tipler</option>
            <option value="in">Giriş</option>
            <option value="out">Çıkış</option>
            <option value="adjustment">Düzeltme</option>
          </select>
          <select
            value={filter.warehouseId}
            onChange={e => setFilter(f => ({ ...f, warehouseId: e.target.value }))}
          >
            <option value="">Tüm Depolar</option>
            {warehouses.map(w => (
              <option key={w.id} value={String(w.id)}>{w.name}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            {filtered.length} kayıt
          </span>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>Depo</th>
                <th>Tip</th>
                <th>Miktar</th>
                <th>Referans</th>
                <th>Kullanıcı</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty">Kayıt bulunamadı</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{m.product.name}</span>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.product.sku}</span>
                  </td>
                  <td>{m.warehouse.name}</td>
                  <td>
                    <span className={`badge badge-${m.type}`}>{TYPE_LABELS[m.type]}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {m.type === 'out' ? '-' : '+'}{Math.abs(m.quantity)} {m.product.unit}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{m.reference ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{m.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
