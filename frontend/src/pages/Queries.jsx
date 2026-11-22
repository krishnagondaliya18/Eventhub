import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import './Queries.css';

export const Queries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  const categories = [
    'General Inquiry',
    'Booking & Tickets',
    'Payments & Refunds',
    'Event Hosting',
    'Technical Support'
  ];

  const [form, setForm] = useState({
    category: 'General Inquiry',
    subject: '',
    message: ''
  });

  const loadQueries = () => {
    setLoading(true);
    api.get('/queries')
      .then((res) => {
        setQueries(res.data.queries || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ category: 'General Inquiry', subject: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showNotification('Please fill in both subject and message.', 'error');
      return;
    }

    setSubmitting(true);
    const fullMessage = `[${form.category}] ${form.message.trim()}`;

    try {
      if (editingId) {
        const res = await api.put(`/queries/${editingId}`, {
          subject: form.subject.trim(),
          message: fullMessage
        });
        setQueries(queries.map(q => (q._id === editingId ? res.data.query : q)));
        showNotification('Query updated successfully!', 'success');
      } else {
        const res = await api.post('/queries', {
          subject: form.subject.trim(),
          message: fullMessage
        });
        setQueries([res.data.query, ...queries]);
        showNotification('Query submitted successfully!', 'success');
      }
      cancelForm();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not submit query.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    let category = 'General Inquiry';
    let rawMsg = q.message || '';
    if (rawMsg.startsWith('[')) {
      const closingIdx = rawMsg.indexOf(']');
      if (closingIdx > 0) {
        category = rawMsg.slice(1, closingIdx);
        rawMsg = rawMsg.slice(closingIdx + 1).trim();
      }
    }
    setForm({
      category,
      subject: q.subject || '',
      message: rawMsg
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this query?')) return;
    try {
      await api.delete(`/queries/${id}`);
      setQueries(queries.filter(q => q._id !== id));
      showNotification('Query deleted successfully.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not delete query.', 'error');
    }
  };

  const getCategory = (msg) => {
    if (msg && msg.startsWith('[')) {
      const end = msg.indexOf(']');
      if (end > 0) return msg.slice(1, end);
    }
    return 'General';
  };

  const getDisplayMsg = (msg) => {
    if (msg && msg.startsWith('[')) {
      const end = msg.indexOf(']');
      if (end > 0) return msg.slice(end + 1).trim();
    }
    return msg;
  };

  return (
    <div className="queries-page-root">
      <Navbar />

      <div className="page">
        <div className="container">
          <div className="page-header">
            <div>
              <h1>❓ My Queries</h1>
              <p className="sub">Ask questions to the admin team</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => (showForm ? cancelForm() : setShowForm(true))}
            >
              {showForm ? '✕ Cancel' : '+ New Query'}
            </button>
          </div>

          {message && (
            <div className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          {showForm && (
            <div className="form-card">
              <h3>{editingId ? '✎ Edit Query' : '📝 Submit a Query'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Query subject..."
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    rows="4"
                    className="form-control"
                    placeholder="Your question..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Query'}
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

          {!loading && queries.length === 0 && !showForm && (
            <div className="empty-state">
              <div style={{ fontSize: '48px' }}>❓</div>
              <h3>No queries yet</h3>
              <p>Click "+ New Query" to ask something</p>
            </div>
          )}

          {!loading && (
            <div className="query-list">
              {queries.map((q) => (
                <div key={q._id} className="query-card">
                  <div className="query-top">
                    <div>
                      <span className="cat-badge">{getCategory(q.message)}</span>
                      <strong>{q.subject}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={`status-badge ${
                          q.status === 'resolved' ? 'resolved' : 'open'
                        }`}
                      >
                        {q.status === 'pending' ? 'Open' : 'Resolved'}
                      </span>
                      <button className="btn-icon-edit" onClick={() => handleEdit(q)}>
                        ✎
                      </button>
                      <button className="btn-icon-del" onClick={() => handleDelete(q._id)}>
                        🗑
                      </button>
                    </div>
                  </div>

                  <p className="query-msg">{getDisplayMsg(q.message)}</p>

                  <div className="query-footer">
                    <span className="date">
                      {new Date(q.createdAt).toLocaleDateString('en-US', {
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

export default Queries;
