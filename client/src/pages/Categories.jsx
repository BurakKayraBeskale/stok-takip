import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const EMPTY_FORM = { name: '', parentId: '' };

const ACTION_BTN = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px 6px', borderRadius: 4, fontSize: '1rem', lineHeight: 1,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editingId,  setEditingId]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
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

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({
      name:     c.name,
      parentId: c.parent?.id ? String(c.parent.id) : (c.parentId ? String(c.parentId) : ''),
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function handleDelete(c) {
    if (!window.confirm(`"${c.name}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    setDeleting(c.id);
    try {
      await api.delete(`/categories/${c.id}`);
      setCategories(prev => prev.filter(x => x.id !== c.id));
      setSuccess(`"${c.name}" silindi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kategori silinemedi');
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
      const payload = { name: form.name };
      if (form.parentId) payload.parentId = Number(form.parentId);
      if (editingId) {
        const { data } = await api.put(`/categories/${editingId}`, payload);
        setCategories(prev => prev.map(x => x.id === editingId ? data : x));
        setSuccess(`"${data.name}" güncellendi.`);
      } else {
        const { data } = await api.post('/categories', payload);
        setCategories(prev => [...prev, data]);
        setSuccess(`"${data.name}" kategorisi eklendi.`);
      }
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error ?? (editingId ? 'Kategori güncellenemedi' : 'Kategori eklenemedi'));
    } finally {
      setSubmitting(false);
    }
  }

  // Düzenleme modunda kendisi ve alt kategorileri üst kategori seçicisinden çıkar
  const roots = categories.filter(c => !c.parentId && c.id !== editingId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kategoriler</h1>
        <button
          className="btn btn-primary"
          onClick={() => showForm ? closeForm() : setShowForm(true)}
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Kategori'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-card-title">{editingId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</div>
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
                <th>Kategori Adı</th>
                <th>Üst Kategori</th>
                <th>Alt Kategori</th>
                <th>Ürün</th>
                <th>Kayıt Tarihi</th>
                <th style={{ width: 90, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={7} className="empty">Kategori bulunamadı</td></tr>
              ) : categories.map(c => (
                <tr key={c.id}>
                  <td style={{ color: '#94a3b8' }}>{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.parent?.name ?? '—'}</td>
                  <td>{c._count?.children ?? 0}</td>
                  <td>{c._count?.products ?? 0}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      title="Düzenle"
                      onClick={() => handleEdit(c)}
                      style={{ ...ACTION_BTN, color: '#3b82f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >✏️</button>
                    <button
                      title="Sil"
                      onClick={() => handleDelete(c)}
                      disabled={deleting === c.id}
                      style={{ ...ACTION_BTN, color: '#ef4444', opacity: deleting === c.id ? 0.4 : 1 }}
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
