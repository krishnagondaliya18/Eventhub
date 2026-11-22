import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <span className="brand-icon">🎪</span>
          <span className="brand-name">EventHub</span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
            Events
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
            Contact
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/organizer/events" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
              Host Events
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
              Admin
            </NavLink>
          )}

          {/* Mobile exclusive quick actions */}
          <div className="mobile-only-menu">
            {isLoggedIn ? (
              <>
                <div className="mobile-menu-divider"></div>
                <Link to="/bookings" onClick={closeMenu}>🎟️ My Bookings</Link>
                <Link to="/profile" onClick={closeMenu}>👤 My Profile</Link>
                <button
                  className="mobile-logout-btn"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <div className="mobile-menu-divider"></div>
                <div className="mobile-auth-btns">
                  <Link to="/login" className="btn btn-outline btn-sm w-full" onClick={closeMenu}>
                    Log In
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm w-full" onClick={closeMenu}>
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
              <div className="user-info" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <span className="user-name">{user?.name}</span>
                <span className="arrow">&#9660;</span>
              </div>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>👤 Profile</Link>
                  <Link to="/bookings" onClick={() => setDropdownOpen(false)}>🎟️ My Bookings</Link>
                  <Link to="/organizer/events" onClick={() => setDropdownOpen(false)}>🎪 Host / My Events</Link>
                  <Link to="/feedback" onClick={() => setDropdownOpen(false)}>⭐ Feedback</Link>
                  <Link to="/queries" onClick={() => setDropdownOpen(false)}>❓ Queries</Link>
                  <div className="drop-divider"></div>
                  <button onClick={() => { setDropdownOpen(false); logout(); }}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm nav-login-btn">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm nav-signup-btn">Sign Up</Link>
            </>
          )}
          <button
            className="hamburger"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
