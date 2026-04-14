import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', location: '' };

export default function Warehouses() {
  const [warehouses,  setWarehouses]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    api.get('/warehouses')
      .then(r => setWarehouses(r.data))
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
      const { data } = await api.post('/warehouses', form);
      setWarehouses(prev => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(`"${data.name}" deposu eklendi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Depo eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Depolar</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Depo'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Depo Ekle</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Depo Adı *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Konum</label>
                <input name="location" placeholder="Adres veya açıklama"
                  value={form.location} onChange={handleChange} />
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
                <th>Depo Adı</th>
                <th>Konum</th>
                <th>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr><td colSpan={4} className="empty">Depo bulunamadı</td></tr>
              ) : warehouses.map(w => (
                <tr key={w.id}>
                  <td style={{ color: '#94a3b8' }}>{w.id}</td>
                  <td style={{ fontWeight: 500 }}>{w.name}</td>
                  <td>{w.location ?? '—'}</td>
                  <td>{new Date(w.createdAt).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
