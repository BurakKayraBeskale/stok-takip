import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_FORM = { email: '', name: '', password: '', roleName: 'user' };

const ROLE_LABELS = { admin: 'Admin', user: 'Kullanıcı' };

export default function Users() {
  const { user: me } = useAuth();
  const navigate     = useNavigate();

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // userId

  // Admin değilse anasayfaya yönlendir
  useEffect(() => {
    if (me && me.role !== 'admin') navigate('/', { replace: true });
  }, [me, navigate]);

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  // ── Davet ────────────────────────────────────────────────────────
  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/users/invite', form);
      setUsers(prev => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess(`"${data.name}" kullanıcısı sisteme eklendi.`);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kullanıcı eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Rol güncelle ─────────────────────────────────────────────────
  async function handleRoleChange(userId, roleName) {
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { roleName });
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
      setSuccess('Rol güncellendi.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Rol güncellenemedi');
    }
  }

  // ── Sil ──────────────────────────────────────────────────────────
  async function handleDelete(userId) {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccess('Kullanıcı silindi.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kullanıcı silinemedi');
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kullanıcı Yönetimi</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Formu Kapat' : '+ Kullanıcı Davet Et'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {/* ── Davet formu ── */}
      {showForm && (
        <div className="form-card">
          <div className="form-card-title">Yeni Kullanıcı Davet Et</div>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleInvite}>
            <div className="form-grid">
              <div className="form-group">
                <label>Ad Soyad *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>E-posta *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Şifre *</label>
                <input name="password" type="password" value={form.password}
                  onChange={handleChange} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select name="roleName" value={form.roleName} onChange={handleChange}>
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Ekleniyor…' : 'Ekle'}
            </button>
          </form>
        </div>
      )}

      {/* ── Kullanıcı listesi ── */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="empty">Kullanıcı bulunamadı</td></tr>
              ) : users.map(u => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>
                      {u.name}
                      {isMe && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: '0.7rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '1px 7px',
                          borderRadius: 10,
                          fontWeight: 600,
                        }}>siz</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>{u.email}</td>
                    <td>
                      {isMe ? (
                        <span className={`badge badge-${u.role.name === 'admin' ? 'approved' : 'pending'}`}>
                          {ROLE_LABELS[u.role.name]}
                        </span>
                      ) : (
                        <select
                          value={u.role.name}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.8rem', minWidth: 110 }}
                        >
                          <option value="user">Kullanıcı</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      {!isMe && (
                        deleteConfirm === u.id ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Emin misiniz?</span>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(u.id)}>Evet, Sil</button>
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => setDeleteConfirm(null)}>İptal</button>
                          </div>
                        ) : (
                          <button className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(u.id)}>Sil</button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {error && !showForm && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}
    </div>
  );
}
