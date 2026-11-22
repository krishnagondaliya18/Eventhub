import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', icon: 'people', bg: 'rgba(230,57,70,0.1)', color: 'var(--primary)' },
    { key: 'totalEvents', label: 'Total Events', icon: 'event', bg: 'rgba(244,162,97,0.1)', color: 'var(--accent)' },
    { key: 'totalParticipants', label: 'Participants', icon: 'confirmation_number', bg: 'rgba(40,167,69,0.1)', color: '#28a745' },
    { key: 'totalAdmins', label: 'Administrators', icon: 'security', bg: 'rgba(23,162,184,0.1)', color: '#17a2b8' },
    { key: 'totalRevenue', label: 'Total Revenue (₹)', icon: 'payments', bg: 'rgba(230,57,70,0.1)', color: 'var(--primary)' },
    { key: 'feedbackCount', label: 'Feedbacks', icon: 'feedback', bg: 'rgba(108,117,125,0.1)', color: 'var(--text-muted)' }
  ];

  useEffect(() => {
    adminService.getStats()
      .then((res) => {
        setStats(res.stats || {});
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const getStatValue = (key) => {
    if (!stats) return '0';
    if (key === 'totalRevenue') {
      return `₹${(stats.totalRevenue || 0).toLocaleString()}`;
    }
    return (stats[key] || 0).toLocaleString();
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome back, Admin</p>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          {/* PENDING APPROVAL ALERT BANNER */}
          {(stats?.pendingEvents || 0) > 0 && (
            <div className="pending-alert-banner">
              <div className="banner-icon-bubble">
                <span className="material-icons">notifications_active</span>
              </div>
              <div className="banner-content-box">
                <h3>{stats?.pendingEvents} Event(s) Awaiting Your Review</h3>
                <p>
                  Organizers have submitted new events that need Admin approval before going live to attendees.
                </p>
              </div>
              <Link to="/admin/event-list?filter=pending" className="btn-review-now">
                Review &amp; Approve &rarr;
              </Link>
            </div>
          )}

          {/* STAT CARDS */}
          <div className="stats-grid">
            {statCards.map((card) => (
              <div key={card.key} className="stat-card">
                <div className="stat-info">
                  <p className="stat-label">{card.label}</p>
                  <h2 className="stat-value">{getStatValue(card.key)}</h2>
                  <span className="stat-badge">
                    <span className="material-icons" style={{ fontSize: '14px' }}>trending_up</span>{' '}
                    Up to date
                  </span>
                </div>
                <div
                  className="stat-icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  <span className="material-icons">{card.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* REVENUE & HIGHLIGHTS */}
          <div className="dash-grid">
            <div className="card p-6">
              <h3 className="card-title">Revenue Overview</h3>
              <div className="revenue-big">
                <span className="rev-label">Total Platform Revenue</span>
                <span className="rev-val">₹{(stats?.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="rev-stats">
                <div className="rev-stat">
                  <span className="material-icons">confirmation_number</span>
                  <div>
                    <strong>{stats?.totalParticipants || 0}</strong>
                    <p>Tickets Sold</p>
                  </div>
                </div>
                <div className="rev-stat">
                  <span className="material-icons">event_available</span>
                  <div>
                    <strong>{stats?.totalEvents || 0}</strong>
                    <p>Active Events</p>
                  </div>
                </div>
                <div className="rev-stat">
                  <span className="material-icons">feedback</span>
                  <div>
                    <strong>{stats?.feedbackCount || 0}</strong>
                    <p>Feedbacks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="card-title">Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <Link to="/admin/event-list" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  <span className="material-icons">event</span> Manage All Events
                </Link>
                <Link to="/admin/users" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  <span className="material-icons">people</span> Manage Platform Users
                </Link>
                <Link to="/admin/ai-insights" className="btn btn-dark" style={{ justifyContent: 'center' }}>
                  <span className="material-icons">psychology</span> View AI Growth Insights
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
