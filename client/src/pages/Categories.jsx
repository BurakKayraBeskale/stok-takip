import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', parentId: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showForm,   setShowForm]   = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data))
      .finally(() => setLoading(false));
  }, []);

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
      const payload = { name: form.name };
      if (form.parentId) payload.parentId = Number(form.parentId);
      const { data } = await api.post('/categories', payload);
      setCategories(prev => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(`"${data.name}" kategorisi eklendi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kategori eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  // Sadece üst kategorileri (parentId yok) üst kategori seçicisinde göster
  const roots = categories.filter(c => !c.parentId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kategoriler</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Kategori'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Kategori Ekle</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Kategori Adı *</label>
                <input
                  name="name"
                  placeholder="Kategori adı"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Üst Kategori</label>
                <select name="parentId" value={form.parentId} onChange={handleChange}>
                  <option value="">— Ana kategori —</option>
                  {roots.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </form>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Kategori Adı</th>
                <th>Üst Kategori</th>
                <th>Alt Kategori</th>
                <th>Ürün</th>
                <th>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="empty">Kategori bulunamadı</td></tr>
              ) : categories.map(c => (
                <tr key={c.id}>
                  <td style={{ color: '#94a3b8' }}>{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.parent?.name ?? '—'}</td>
                  <td>{c._count?.children ?? 0}</td>
                  <td>{c._count?.products ?? 0}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
