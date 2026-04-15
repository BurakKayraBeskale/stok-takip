import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

// Firma adı durumu için olası değerler:
//   null            → henüz kontrol edilmedi / alan boş
//   'checking'      → istek devam ediyor
//   { exists: true,  organizationName }  → firma mevcut
//   { exists: false }                    → firma yok, yeni kurulacak

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [orgStatus, setOrgStatus] = useState(null);

  const debounceRef = useRef(null);

  // Firma adı değişince 500 ms debounce ile kontrol yap
  useEffect(() => {
    const trimmed = form.organizationName.trim();

    if (!trimmed) {
      setOrgStatus(null);
      return;
    }

    setOrgStatus('checking');

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/auth/check-org', {
          params: { name: trimmed },
        });
        setOrgStatus(data);   // { exists: bool, organizationName? }
      } catch {
        setOrgStatus(null);   // kontrol başarısız → sessiz devam
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [form.organizationName]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        ...form,
        organizationName: form.organizationName.trim(),
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Kayıt oluşturulamadı');
    } finally {
      setLoading(false);
    }
  }

  // Firma adı kontrol mesajı
  function OrgHint() {
    if (!orgStatus || orgStatus === 'checking') {
      return orgStatus === 'checking' ? (
        <div style={styles.hint.base}>
          <span style={styles.spinner} /> Kontrol ediliyor…
        </div>
      ) : null;
    }

    if (orgStatus.exists) {
      return (
        <div style={{ ...styles.hint.base, ...styles.hint.join }}>
          <span style={styles.hint.icon}>🏢</span>
          <span>
            <strong>{orgStatus.organizationName}</strong> firması sistemde kayıtlı.
            <br />
            Bu firmaya <strong>personel</strong> rolüyle katılacaksınız.
          </span>
        </div>
      );
    }

    return (
      <div style={{ ...styles.hint.base, ...styles.hint.new }}>
        <span style={styles.hint.icon}>✨</span>
        <span>
          Bu isimde firma bulunamadı.
          <br />
          <strong>Yeni firma</strong> oluşturulacak ve siz <strong>admin</strong> olacaksınız.
        </span>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>StokTakip</h1>
        <p>Yeni hesap oluşturun.</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Firma adı */}
          <div className="form-group" style={{ marginBottom: orgStatus ? 4 : 14 }}>
            <label>Firma Adı</label>
            <input
              type="text"
              placeholder="Şirketinizin adı"
              value={form.organizationName}
              onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
              required
              autoComplete="organization"
              style={
                orgStatus && orgStatus !== 'checking'
                  ? { borderColor: orgStatus.exists ? '#3b82f6' : '#22c55e', boxShadow: `0 0 0 3px ${orgStatus.exists ? 'rgba(59,130,246,.12)' : 'rgba(34,197,94,.12)'}` }
                  : {}
              }
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <OrgHint />
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

          <button className="btn btn-primary" type="submit" disabled={loading || orgStatus === 'checking'}>
            {loading ? 'Kaydediliyor…' : (
              orgStatus?.exists
                ? 'Firmaya Katıl'
                : orgStatus?.exists === false
                  ? 'Firma Kur & Kayıt Ol'
                  : 'Kayıt Ol'
            )}
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

const styles = {
  hint: {
    base: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '10px 12px',
      borderRadius: 7,
      fontSize: '0.82rem',
      lineHeight: 1.55,
      marginTop: 6,
    },
    join: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
    new: {
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
    icon: { fontSize: '1rem', flexShrink: 0, marginTop: 1 },
  },
  spinner: {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid #cbd5e1',
    borderTopColor: '#64748b',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
    marginTop: 2,
  },
};
