import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import './Contact.css';

export const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setErrorMessage('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/queries', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || 'Website Contact Form Inquiry',
        message: form.message
      });

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page-root">
      <Navbar />

      <div className="contact-page-wrapper">
        <div className="contact-hero">
          <div className="contact-container text-center">
            <span className="contact-pill">HELP &amp; SUPPORT</span>
            <h1>Contact Us</h1>
            <p className="contact-subtitle">
              Have questions about an event booking, organizer partnerships, or payment support? We are here to help.
            </p>
          </div>
        </div>

        <div className="contact-container contact-main-layout">
          <div className="contact-form-col">
            <div className="contact-form-card">
              <h3>Send us a Message</h3>
              <p className="form-desc">
                Fill out the form below and our support team will get back to you promptly.
              </p>

              {submitted && (
                <div className="alert-success-box">
                  <span className="material-icons">check_circle</span>
                  <div>
                    <strong>Message Sent Successfully!</strong>
                    <p>
                      Thank you for reaching out. We have received your inquiry and will respond to your email address shortly.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="alert-error-box">
                  <span className="material-icons">error_outline</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group-field">
                  <label>Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="custom-input"
                    required
                  />
                </div>

                <div className="form-row-grid">
                  <div className="form-group-field">
                    <label>Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="custom-input"
                      required
                    />
                  </div>

                  <div className="form-group-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="custom-input"
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Booking Support / Event Partnership"
                    className="custom-input"
                  />
                </div>

                <div className="form-group-field">
                  <label>Your Message <span className="req">*</span></label>
                  <textarea
                    rows="5"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your query, booking ID, or request..."
                    className="custom-input custom-textarea"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-contact" disabled={submitting}>
                  {!submitting ? (
                    <span className="btn-inner-content">
                      <span className="material-icons">send</span> Send Message
                    </span>
                  ) : (
                    <span className="submitting-state">
                      <span className="chk-spin"></span> Sending Message...
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
