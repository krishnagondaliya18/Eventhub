import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: ''
  });

  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      showNotification('Name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(form);
      if (res.success) {
        setEditMode(false);
        showNotification('Profile updated successfully!', 'success');
      } else {
        showNotification(res.message || 'Could not update profile.', 'error');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      showNotification('Please fill in both current and new password.', 'error');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showNotification('New password and confirmation do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      if (res.success) {
        setShowPw(false);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('Password updated successfully!', 'success');
      } else {
        showNotification(res.message || 'Could not change password.', 'error');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not change password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page-root">
      <Navbar />

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="avatar-big">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2>{user?.name}</h2>
              <span className="role-badge">{user?.role || 'User'}</span>
            </div>
          </div>

          {message && (
            <div className={`alert ${msgType === 'success' ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* PERSONAL INFO CARD */}
          <div className="card">
            <div className="card-header">
              <h3>👤 Personal Information</h3>
              {!editMode && (
                <button className="btn-edit" onClick={() => setEditMode(true)}>
                  ✎ Edit
                </button>
              )}
            </div>

            {!editMode ? (
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <span>{user?.name || '—'}</span>
                </div>
                <div className="info-item">
                  <label>Email Address</label>
                  <span>{user?.email || '—'}</span>
                </div>
                <div className="info-item">
                  <label>Phone Number</label>
                  <span>{user?.phone || '—'}</span>
                </div>
                <div className="info-item">
                  <label>Account Role</label>
                  <span className="role-highlight">
                    {user?.role?.toUpperCase() || 'USER'}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setEditMode(false);
                      setForm({ name: user?.name || '', phone: user?.phone || '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ORGANIZER ACTION CARD */}
          {user?.role === 'organizer' && (
            <div className="card organizer-card">
              <div className="card-header">
                <h3>🎪 Organizer Dashboard &amp; Events</h3>
              </div>
              <p className="text-muted">
                Host new events, track ticket sales, and check admin approval status for your submissions.
              </p>
              <div className="organizer-actions">
                <Link to="/organizer/events" className="btn-organizer-link">
                  Manage My Hosted Events &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* CHANGE PASSWORD CARD */}
          <div className="card">
            <div className="card-header">
              <h3>🔒 Change Password</h3>
              <button className="btn-edit" onClick={() => setShowPw(!showPw)}>
                {showPw ? 'Cancel' : '🔑 Change'}
              </button>
            </div>

            {showPw ? (
              <div>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted">Click "Change" to update your password</p>
            )}
          </div>

          {/* QUICK LINKS */}
          <div className="quick-links">
            <Link to="/bookings" className="quick-link">🎟️ My Bookings</Link>
            {user?.role === 'organizer' && (
              <Link to="/organizer/events" className="quick-link">🎪 Host / My Events</Link>
            )}
            <Link to="/feedback" className="quick-link">⭐ Feedback</Link>
            <Link to="/queries" className="quick-link">❓ Queries</Link>
            <Link to="/events" className="quick-link">🎪 Browse Events</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
