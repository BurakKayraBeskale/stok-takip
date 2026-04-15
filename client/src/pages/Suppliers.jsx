import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', contact: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showForm,   setShowForm]   = useState(false);

  useEffect(() => {
    api.get('/suppliers')
      .then(r => setSuppliers(r.data))
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
      const { data } = await api.post('/suppliers', form);
      setSuppliers(prev => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(`"${data.name}" tedarikçisi eklendi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Tedarikçi eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tedarikçiler</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Tedarikçi'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Tedarikçi Ekle</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Firma Adı *</label>
                <input
                  name="name"
                  placeholder="Tedarikçi adı"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>İletişim Kişisi</label>
                <input
                  name="contact"
                  placeholder="Ad Soyad"
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  name="phone"
                  placeholder="0212 000 00 00"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>E-posta</label>
                <input
                  name="email"
                  type="email"
                  placeholder="info@tedarikci.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Adres</label>
                <input
                  name="address"
                  placeholder="Açık adres"
                  value={form.address}
                  onChange={handleChange}
                />
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
                <th>Firma Adı</th>
                <th>İletişim Kişisi</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Ürün Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={6} className="empty">Tedarikçi bulunamadı</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ color: '#94a3b8' }}>{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.contact ?? '—'}</td>
                  <td>{s.phone ?? '—'}</td>
                  <td>{s.email ?? '—'}</td>
                  <td>{s._count?.products ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
