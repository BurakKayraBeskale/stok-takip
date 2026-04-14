import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = {
  sku: '', name: '', description: '',
  categoryId: '', supplierId: '',
  unitPrice: '', unit: '',
};

export default function Products() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/suppliers'),
    ]).then(([p, c, s]) => {
      setProducts(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

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
      const { data } = await api.post('/products', {
        ...form,
        categoryId: Number(form.categoryId),
        supplierId: Number(form.supplierId),
        unitPrice:  Number(form.unitPrice),
      });
      setProducts(prev => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(`"${data.name}" ürünü eklendi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ürün eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ürünler</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Ürün'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Ürün Ekle</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>SKU *</label>
                <input name="sku" value={form.sku} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Ürün Adı *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Kategori *</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tedarikçi *</label>
                <select name="supplierId" value={form.supplierId} onChange={handleChange} required>
                  <option value="">Seçin</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Birim Fiyat *</label>
                <input name="unitPrice" type="number" step="0.01" min="0"
                  value={form.unitPrice} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Birim *</label>
                <input name="unit" placeholder="adet, kg, lt…"
                  value={form.unit} onChange={handleChange} required />
              </div>
              <div className="form-group full">
                <label>Açıklama</label>
                <textarea name="description" value={form.description} onChange={handleChange} />
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
          <input
            placeholder="SKU veya ürün adı ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            {filtered.length} ürün
          </span>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Tedarikçi</th>
                <th>Birim Fiyat</th>
                <th>Birim</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty">Ürün bulunamadı</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td>{p.supplier?.name ?? '—'}</td>
                  <td>{Number(p.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td>{p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
