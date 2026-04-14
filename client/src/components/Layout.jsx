import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/',               label: 'Dashboard',          icon: '◈' },
  { to: '/products',       label: 'Ürünler',             icon: '◫' },
  { to: '/warehouses',     label: 'Depolar',             icon: '▦' },
  { to: '/stock-movements',label: 'Stok Hareketleri',    icon: '⇅' },
  { to: '/orders',         label: 'Siparişler',          icon: '◉' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Stok<span>Takip</span></div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            {user?.role}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
