import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminFeedback.css';

export const AdminFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeedback = () => {
    setLoading(true);
    adminService.getFeedback()
      .then((res) => {
        setItems(res.feedbacks || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const markResolved = async (id) => {
    try {
      await adminService.updateFeedback(id, { status: 'resolved' });
      setItems(items.map(item => (item._id === id ? { ...item, status: 'resolved' } : item)));
    } catch {
      alert('Could not update feedback status.');
    }
  };

  return (
    <div className="page-enter">
      <div className="page-top">
        <h1>Feedback</h1>
        <p className="text-muted">User ratings and platform comments</p>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="feedback-grid">
          {items.map((item) => (
            <div key={item._id} className="feedback-card">
              <div className="fb-header">
                <div className="fb-user">
                  <div className="fb-avatar">
                    {item.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="text-muted" style={{ fontSize: '12px' }}>{item.email}</p>
                  </div>
                </div>
                <div className="fb-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= (item.rating || 5) ? 'filled' : ''}
                    >
                      {s <= (item.rating || 5) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>

              <p className="fb-msg">{item.message}</p>
              {item.event && (
                <p className="text-muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
                  Event: {item.event.title}
                </p>
              )}

              <div className="fb-footer">
                <span className="text-muted" style={{ fontSize: '12px' }}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span
                  className={`badge ${
                    item.status === 'resolved' ? 'badge-success' : 'badge-warning'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {item.status === 'pending' && (
                <button
                  className="btn btn-sm btn-outline"
                  style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                  onClick={() => markResolved(item._id)}
                >
                  Mark Resolved
                </button>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className="empty-state">
              <span style={{ fontSize: '48px' }}>⭐</span>
              <h3>No feedback yet</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
