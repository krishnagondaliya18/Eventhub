import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top-accent"></div>
      <div className="footer-container">
        <div className="footer-grid">
          {/* QUICK LINKS */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-menu">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Explore Events</Link></li>
              <li><Link to="/bookings">My Bookings</Link></li>
              <li><Link to="/queries">Support &amp; Queries</Link></li>
              <li><Link to="/feedback">User Reviews</Link></li>
            </ul>
          </div>

          {/* MANDATORY POLICY PAGES */}
          <div className="footer-col">
            <h4 className="footer-heading">Policies &amp; Legal</h4>
            <ul className="footer-menu">
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/refund-policy">Refund &amp; Cancellation (7 Days)</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* CONTACT & ADDRESS */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-heading">Location</h4>
            <div className="contact-info-list">
              <div className="contact-item">
                <span className="material-icons">location_on</span>
                <div>
                  <span className="contact-lbl">Operational Address</span>
                  <span className="contact-val">Surat, Gujarat, India - 395006</span>
                </div>
              </div>
              <div className="contact-item">
                <span className="material-icons">email</span>
                <div>
                  <span className="contact-lbl">Support &amp; Inquiries</span>
                  <span className="contact-val">support@eventhub.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT & POLICY LINKS */}
        <div className="footer-bottom-bar">
          <div className="copy-text">
            &copy; {currentYear} EventHub All rights reserved.
          </div>
          <div className="policy-quick-links">
            <Link to="/terms">Terms</Link>
            <span className="sep">&bull;</span>
            <Link to="/privacy">Privacy</Link>
            <span className="sep">&bull;</span>
            <Link to="/refund-policy">Refund Policy</Link>
            <span className="sep">&bull;</span>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
