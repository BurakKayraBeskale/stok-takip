import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/',                label: 'Dashboard',       icon: '◈' },
  { to: '/products',        label: 'Ürünler',          icon: '◫' },
  { to: '/categories',      label: 'Kategoriler',      icon: '◧' },
  { to: '/suppliers',       label: 'Tedarikçiler',     icon: '◨' },
  { to: '/warehouses',      label: 'Depolar',          icon: '▦' },
  { to: '/stock-movements', label: 'Stok Hareketleri', icon: '⇅' },
  { to: '/orders',          label: 'Siparişler',       icon: '◉' },
  { to: '/users',           label: 'Kullanıcılar',     icon: '◎', adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="layout">

      {/* Mobil overlay — sidebar açıkken arka planı karartır, tıklayınca kapatır */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span>Stok<span className="brand-accent">Takip</span></span>
          {/* Sadece mobilde görünür × butonu */}
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Menüyü kapat">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.filter(({ adminOnly }) => !adminOnly || user?.role === 'admin').map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={closeSidebar}
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
        {/* Mobil topbar — hamburger + marka adı */}
        <div className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Menüyü aç"
            aria-expanded={sidebarOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="topbar-brand">Stok<b>Takip</b></span>
        </div>

        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
