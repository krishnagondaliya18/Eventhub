import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [pendingQueriesCount, setPendingQueriesCount] = useState(0);

  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/event-list', icon: 'event', label: 'Events', badgeKey: 'events' },
    { path: '/admin/users', icon: 'people', label: 'Users' },
    { path: '/admin/participants', icon: 'how_to_reg', label: 'Participants' },
    { path: '/admin/feedback', icon: 'star', label: 'Feedback' },
    { path: '/admin/queries', icon: 'chat', label: 'Queries', badgeKey: 'queries' },
    { path: '/admin/ai-insights', icon: 'psychology', label: 'AI Insights' }
  ];

  const loadCounts = () => {
    adminService.getStats()
      .then((res) => {
        setPendingEventsCount(res.stats?.pendingEvents || 0);
        setPendingQueriesCount(res.stats?.pendingQueries || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sb-brand">
            <span className="sb-icon">🎪</span>
            {!sidebarCollapsed && <span className="sb-name">EventHub</span>}
          </div>
          <div className="sb-user">
            <div className="sb-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
            {!sidebarCollapsed && (
              <div>
                <p className="sb-uname">{user?.name || 'Admin'}</p>
                <p className="sb-role">Administrator</p>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-icons">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="nav-lbl-flex">
                  {item.label}
                  {item.badgeKey === 'events' && pendingEventsCount > 0 && (
                    <span className="pending-bubble">{pendingEventsCount}</span>
                  )}
                  {item.badgeKey === 'queries' && pendingQueriesCount > 0 && (
                    <span className="pending-bubble query-bubble">{pendingQueriesCount}</span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="nav-item">
            <span className="material-icons">home</span>
            {!sidebarCollapsed && <span>Home</span>}
          </Link>
          <button className="nav-item logout-btn" onClick={logout}>
            <span className="material-icons">logout</span>
            {!sidebarCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <span className="material-icons">{sidebarCollapsed ? 'menu' : 'menu_open'}</span>
          </button>
          <div className="header-search">
            <span className="material-icons">search</span>
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-right">
            <Link to="/admin/queries" className="header-msg-icon-btn" title="Messages & Queries">
              <span className="material-icons">chat</span>
              {pendingQueriesCount > 0 && (
                <span className="header-msg-badge">{pendingQueriesCount}</span>
              )}
            </Link>
            <span className="admin-email">{user?.email}</span>
            <div className="header-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
