import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminQueries.css';

export const AdminQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadQueries = () => {
    setLoading(true);
    adminService.getQueries()
      .then((res) => {
        setQueries(res.queries || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const pending = queries.filter(q => q.status === 'pending').length;

  const markResolved = async (q) => {
    try {
      await adminService.updateQuery(q._id, { status: 'resolved' });
      setQueries(queries.map(item => (item._id === q._id ? { ...item, status: 'resolved' } : item)));
      if (selectedQuery?._id === q._id) {
        setSelectedQuery({ ...selectedQuery, status: 'resolved' });
      }
    } catch {
      alert('Could not resolve query.');
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await adminService.updateQuery(selectedQuery._id, {
        adminReply: replyText.trim(),
        status: 'resolved'
      });
      setQueries(queries.map(item =>
        item._id === selectedQuery._id
          ? { ...item, adminReply: replyText.trim(), status: 'resolved' }
          : item
      ));
      setSelectedQuery({
        ...selectedQuery,
        adminReply: replyText.trim(),
        status: 'resolved'
      });
      setReplyText('');
      alert('Reply saved and inquiry marked resolved!');
    } catch {
      alert('Could not save reply.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Customer Inquiries &amp; Messages</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0' }}>
            <span className="badge badge-warning" style={{ fontSize: '12px', padding: '3px 8px', marginRight: '6px' }}>
              {pending} Pending
            </span>
            Total {queries.length} customer messages received
          </p>
        </div>
        <div>
          <button className="btn btn-outline" onClick={loadQueries} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-icons" style={{ fontSize: '18px' }}>refresh</span> Refresh
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="center-pad"><div className="spinner"></div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sender</th>
                  <th>Phone</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q, i) => (
                  <tr key={q._id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{q.name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                        <a href={`mailto:${q.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                          {q.email}
                        </a>
                      </div>
                    </td>
                    <td>
                      {q.phone ? (
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{q.phone}</span>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="cat-badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', fontWeight: 600 }}>
                        {q.subject || 'General Inquiry'}
                      </span>
                    </td>
                    <td className="msg-cell" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.message}
                    </td>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(q.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className={`badge ${q.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                        {q.status === 'resolved' ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#f1f5f9', color: '#1e293b', marginRight: '6px', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        onClick={() => setSelectedQuery(q)}
                      >
                        View
                      </button>
                      {q.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                          onClick={() => markResolved(q)}
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {queries.length === 0 && (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>💬</span>
                <h3>No queries received yet</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL & REPLY MODAL */}
      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Inquiry Details</h2>
              <button className="modal-close" onClick={() => setSelectedQuery(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <strong>From:</strong> {selectedQuery.name} ({selectedQuery.email})
                {selectedQuery.phone && <span> &bull; Tel: {selectedQuery.phone}</span>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Subject:</strong> {selectedQuery.subject || 'General Inquiry'}
              </div>
              <div style={{ padding: '16px', background: 'var(--surface2, #f8f9fa)', borderRadius: '8px', marginBottom: '20px', whiteSpace: 'pre-line' }}>
                {selectedQuery.message}
              </div>

              {selectedQuery.adminReply && (
                <div style={{ padding: '16px', background: 'rgba(40,167,69,0.08)', borderLeft: '4px solid #28a745', borderRadius: '4px', marginBottom: '20px' }}>
                  <strong>Admin Note / Response:</strong>
                  <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{selectedQuery.adminReply}</p>
                </div>
              )}

              <div className="form-group">
                <label>Add Admin Note / Reply</label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Record resolution notes or drafted response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {selectedQuery.status === 'pending' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => markResolved(selectedQuery)}
                  >
                    Mark as Resolved
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                >
                  {replying ? 'Saving...' : 'Save & Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueries;
