import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kayıt oluşturulamadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>StokTakip</h1>
        <p>Yeni hesap oluşturun.</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Firma Adı</label>
            <input
              type="text"
              placeholder="Şirketinizin adı"
              value={form.organizationName}
              onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Ad Soyad</label>
            <input
              type="text"
              placeholder="Adınız Soyadınız"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              placeholder="ornek@sirket.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.84rem', color: '#64748b' }}>
          Zaten hesabınız var mı?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
