import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', contact: '', phone: '', email: '', address: '' };

const ACTION_BTN = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px 6px', borderRadius: 4, fontSize: '1rem', lineHeight: 1,
};

export default function Suppliers() {
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editingId,  setEditingId]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
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

  function handleEdit(s) {
    setEditingId(s.id);
    setForm({
      name:    s.name,
      contact: s.contact ?? '',
      phone:   s.phone   ?? '',
      email:   s.email   ?? '',
      address: s.address ?? '',
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function handleDelete(s) {
    if (!window.confirm(`"${s.name}" tedarikçisini silmek istediğinizden emin misiniz?`)) return;
    setDeleting(s.id);
    try {
      await api.delete(`/suppliers/${s.id}`);
      setSuppliers(prev => prev.filter(x => x.id !== s.id));
      setSuccess(`"${s.name}" silindi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Tedarikçi silinemedi');
    } finally {
      setDeleting(null);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (editingId) {
        const { data } = await api.put(`/suppliers/${editingId}`, form);
        setSuppliers(prev => prev.map(x => x.id === editingId ? data : x));
        setSuccess(`"${data.name}" güncellendi.`);
      } else {
        const { data } = await api.post('/suppliers', form);
        setSuppliers(prev => [...prev, data]);
        setSuccess(`"${data.name}" tedarikçisi eklendi.`);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error ?? (editingId ? 'Tedarikçi güncellenemedi' : 'Tedarikçi eklenemedi'));
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
          onClick={() => showForm ? closeForm() : setShowForm(true)}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Tedarikçi'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">{editingId ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</div>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor…' : (editingId ? 'Güncelle' : 'Kaydet')}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={closeForm}>İptal</button>
              )}
            </div>
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
                <th style={{ width: 90, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} className="empty">Tedarikçi bulunamadı</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ color: '#94a3b8' }}>{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.contact ?? '—'}</td>
                  <td>{s.phone ?? '—'}</td>
                  <td>{s.email ?? '—'}</td>
                  <td>{s._count?.products ?? 0}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      title="Düzenle"
                      onClick={() => handleEdit(s)}
                      style={{ ...ACTION_BTN, color: '#3b82f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >✏️</button>
                    <button
                      title="Sil"
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      style={{ ...ACTION_BTN, color: '#ef4444', opacity: deleting === s.id ? 0.4 : 1 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >🗑️</button>
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
