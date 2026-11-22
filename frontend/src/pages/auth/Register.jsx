import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

export const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await register(form);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (targetEmail, targetName) => {
    const finalEmail = targetEmail || googleEmail;
    if (!finalEmail) return;

    setGoogleLoading(true);
    setError('');

    try {
      const res = await loginWithGoogle({
        email: finalEmail,
        name: targetName || finalEmail.split('@')[0],
        role: form.role
      });

      if (res.success) {
        setShowGoogleModal(false);
        navigate('/');
      } else {
        setError(res.message || 'Google Sign-Up failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-Up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT VISUAL */}
      <div className="auth-left">
        <div className="auth-brand">
          <span>🎪</span> <span className="brand-name">EventHub</span>
        </div>
        <div className="auth-visual">
          <h2>Join the EventHub community</h2>
          <p>Create your account and start exploring events.</p>
        </div>
      </div>

      {/* RIGHT AUTH BOX */}
      <div className="auth-right">
        <div className="auth-box">
          <h1>Create account</h1>
          <p className="auth-sub">Join EventHub for free today</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  className="form-control"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* ROLE SELECTOR */}
            <div className="form-group">
              <label>I want to join as *</label>
              <div className="role-selector-grid">
                <label className={`role-card ${form.role === 'user' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={form.role === 'user'}
                    onChange={() => setForm({ ...form, role: 'user' })}
                    className="hidden-radio"
                  />
                  <span className="role-icon">🎟️</span>
                  <div>
                    <strong>Attendee / User</strong>
                    <p>Discover events &amp; book tickets</p>
                  </div>
                </label>
                <label className={`role-card ${form.role === 'organizer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="organizer"
                    checked={form.role === 'organizer'}
                    onChange={() => setForm({ ...form, role: 'organizer' })}
                    className="hidden-radio"
                  />
                  <span className="role-icon">🎪</span>
                  <div>
                    <strong>Event Organizer</strong>
                    <p>Host &amp; manage public events</p>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading || googleLoading}
            >
              {loading
                ? 'Creating Account...'
                : form.role === 'organizer'
                ? 'Join as Organizer'
                : 'Create User Account'}
            </button>
          </form>

          {/* OR SIGN UP WITH GOOGLE */}
          <div className="auth-divider">
            <span>OR SIGN UP WITH</span>
          </div>

          <button
            type="button"
            className="btn-google"
            onClick={() => setShowGoogleModal(true)}
            disabled={loading || googleLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading
                ? 'Connecting to Google...'
                : form.role === 'organizer'
                ? 'Sign up as Organizer with Google'
                : 'Sign up with Google'}
            </span>
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>

      {/* GOOGLE SIGN-UP MODAL */}
      {showGoogleModal && (
        <div className="google-modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <svg className="google-icon-large" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3>Join with Google</h3>
              <p className="google-sub">
                Creating account as:{' '}
                <strong>
                  {form.role === 'organizer' ? '🎪 Event Organizer' : '🎟️ Attendee'}
                </strong>
              </p>
            </div>

            <div className="google-account-list">
              <button
                type="button"
                className="google-acc-btn"
                onClick={() => handleGoogleSignUp('user@eventhub.com', 'EventHub Demo User')}
              >
                <div className="g-avatar">E</div>
                <div className="g-acc-info">
                  <strong>EventHub Demo User</strong>
                  <span>user@eventhub.com</span>
                </div>
                <span className="material-icons g-arrow">arrow_forward</span>
              </button>

              <div className="google-custom-box">
                <label>Or continue with your Google Account:</label>
                <div className="g-input-row">
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="form-control"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGoogleSignUp();
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleGoogleSignUp()}
                    disabled={!googleEmail.trim() || googleLoading}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="google-cancel-btn"
              onClick={() => setShowGoogleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
