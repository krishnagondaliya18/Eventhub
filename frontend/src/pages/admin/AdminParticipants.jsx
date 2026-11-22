import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminParticipants.css';

export const AdminParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getParticipants()
      .then((res) => {
        setParticipants(res.participants || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter">
      <div className="page-top">
        <h1>Participants</h1>
        <p className="text-muted">All event registrations and attendee passes</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Registered</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => (
                  <tr key={p._id || i}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="mini-av">
                          {p.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {p.user?.name || 'Attendee'}
                      </div>
                    </td>
                    <td>{p.user?.email || '—'}</td>
                    <td>{p.event?.title || 'Event'}</td>
                    <td>
                      {p.registeredAt
                        ? new Date(p.registeredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td>
                      <span className="text-primary" style={{ fontWeight: 700 }}>
                        {p.totalPaid === 0 ? 'Free' : `₹${p.totalPaid}`}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{p.status || 'Confirmed'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {participants.length === 0 && (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>👥</span>
                <h3>No participants yet</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminParticipants;
