import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', location: '' };

const ACTION_BTN = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px 6px', borderRadius: 4, fontSize: '1rem', lineHeight: 1,
};

export default function Warehouses() {
  const [warehouses,  setWarehouses]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editingId,   setEditingId]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleting,    setDeleting]    = useState(null);
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

  function handleEdit(w) {
    setEditingId(w.id);
    setForm({
      name:     w.name,
      location: w.location ?? '',
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function handleDelete(w) {
    if (!window.confirm(`"${w.name}" deposunu silmek istediğinizden emin misiniz?`)) return;
    setDeleting(w.id);
    try {
      await api.delete(`/warehouses/${w.id}`);
      setWarehouses(prev => prev.filter(x => x.id !== w.id));
      setSuccess(`"${w.name}" silindi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Depo silinemedi');
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
        const { data } = await api.put(`/warehouses/${editingId}`, form);
        setWarehouses(prev => prev.map(x => x.id === editingId ? data : x));
        setSuccess(`"${data.name}" güncellendi.`);
      } else {
        const { data } = await api.post('/warehouses', form);
        setWarehouses(prev => [...prev, data]);
        setSuccess(`"${data.name}" deposu eklendi.`);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error ?? (editingId ? 'Depo güncellenemedi' : 'Depo eklenemedi'));
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
          onClick={() => showForm ? closeForm() : setShowForm(true)}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Depo'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">{editingId ? 'Depo Düzenle' : 'Yeni Depo Ekle'}</div>
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
                <th>Depo Adı</th>
                <th>Konum</th>
                <th>Kayıt Tarihi</th>
                <th style={{ width: 90, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr><td colSpan={5} className="empty">Depo bulunamadı</td></tr>
              ) : warehouses.map(w => (
                <tr key={w.id}>
                  <td style={{ color: '#94a3b8' }}>{w.id}</td>
                  <td style={{ fontWeight: 500 }}>{w.name}</td>
                  <td>{w.location ?? '—'}</td>
                  <td>{new Date(w.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      title="Düzenle"
                      onClick={() => handleEdit(w)}
                      style={{ ...ACTION_BTN, color: '#3b82f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >✏️</button>
                    <button
                      title="Sil"
                      onClick={() => handleDelete(w)}
                      disabled={deleting === w.id}
                      style={{ ...ACTION_BTN, color: '#ef4444', opacity: deleting === w.id ? 0.4 : 1 }}
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
