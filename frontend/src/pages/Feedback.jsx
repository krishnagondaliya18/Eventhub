import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import './Feedback.css';

export const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  const loadFeedbacks = () => {
    setLoading(true);
    api.get('/feedback')
      .then((res) => {
        setFeedbacks(res.data.feedbacks || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const toggleForm = () => {
    if (showForm) {
      cancelForm();
    } else {
      setShowForm(true);
      setEditingId(null);
      setForm({ subject: '', message: '' });
      setRating(5);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ subject: '', message: '' });
    setRating(5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      showNotification('Please enter a feedback message.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`/feedback/${editingId}`, {
          ...form,
          rating
        });
        setFeedbacks(feedbacks.map(f => (f._id === editingId ? res.data.feedback : f)));
        showNotification('Feedback updated successfully!', 'success');
      } else {
        const res = await api.post('/feedback', {
          ...form,
          rating
        });
        setFeedbacks([res.data.feedback, ...feedbacks]);
        showNotification('Feedback submitted successfully!', 'success');
      }
      cancelForm();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (f) => {
    setEditingId(f._id);
    setForm({ subject: f.subject || '', message: f.message || '' });
    setRating(f.rating || 5);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback review?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      setFeedbacks(feedbacks.filter(f => f._id !== id));
      showNotification('Feedback deleted successfully.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not delete feedback.', 'error');
    }
  };

  return (
    <div className="feedback-page-root">
      <Navbar />

      <div className="page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1>⭐ My Feedback</h1>
              <p className="sub">Your reviews and ratings</p>
            </div>
            <button className="btn-primary" onClick={toggleForm}>
              {showForm ? '✕ Cancel' : '+ New Feedback'}
            </button>
          </div>

          {message && (
            <div className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          {showForm && (
            <div className="form-card">
              <h3>{editingId ? '✎ Edit Feedback' : '✍️ Write Feedback'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Feedback subject..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`star ${s <= rating ? 'active' : ''}`}
                        onClick={() => setRating(s)}
                        style={{ cursor: 'pointer' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    rows="4"
                    className="form-control"
                    placeholder="Your feedback..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting
                      ? 'Submitting...'
                      : editingId
                      ? 'Update Feedback'
                      : 'Submit Feedback'}
                  </button>
                  <button type="button" className="btn-outline" onClick={cancelForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && (
            <div className="center-pad">
              <div className="spinner"></div>
            </div>
          )}

          {!loading && feedbacks.length === 0 && !showForm && (
            <div className="empty-state">
              <div style={{ fontSize: '48px' }}>⭐</div>
              <h3>No feedback yet</h3>
              <p>Click "+ New Feedback" to add one</p>
            </div>
          )}

          {!loading && (
            <div className="feedback-list">
              {feedbacks.map((f) => (
                <div key={f._id} className="feedback-card">
                  <div className="feedback-top">
                    <div>
                      <strong>{f.subject || 'Review'}</strong>
                      <div className="stars-display">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className={`star ${s <= (f.rating || 5) ? 'active' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-icon-edit" onClick={() => handleEdit(f)}>
                        ✎
                      </button>
                      <button className="btn-icon-del" onClick={() => handleDelete(f._id)}>
                        🗑
                      </button>
                    </div>
                  </div>

                  <p className="fb-message">{f.message}</p>

                  <div className="feedback-meta">
                    <span
                      className={`status-badge ${
                        f.status === 'resolved' ? 'resolved' : 'pending'
                      }`}
                    >
                      {f.status || 'Pending'}
                    </span>
                    <span className="date">
                      {new Date(f.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Feedback;
