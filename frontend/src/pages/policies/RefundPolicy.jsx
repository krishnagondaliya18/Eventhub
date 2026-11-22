import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './RefundPolicy.css';

export const RefundPolicy = () => {
  const lastUpdated = 'November 2026';

  return (
    <div className="refund-page-root">
      <Navbar />

      <div className="policy-page-wrapper">
        <div className="policy-hero">
          <div className="policy-container">
            <span className="policy-pill">CANCELLATION &amp; REFUND CLAUSE</span>
            <h1>Refund &amp; Cancellation Policy</h1>
            <p className="policy-subtitle">
              Transparent, fair, and customer-friendly cancellation guidelines with a guaranteed <strong>7-Day Cancellation Window</strong>.
            </p>
            <span className="last-updated">
              Last Updated: {lastUpdated} &bull; Standard Cancellation Window: 7 Days
            </span>
          </div>
        </div>

        <div className="policy-container policy-content-layout">
          <div className="policy-card">
            <div className="policy-highlight-banner">
              <div className="banner-icon">
                <span className="material-icons">verified</span>
              </div>
              <div className="banner-text">
                <h3>Guaranteed 7-Day Refund Policy</h3>
                <p>
                  You are eligible for a ticket refund if a cancellation request is submitted at least <strong>7 days prior</strong> to the scheduled event date, or in any instance where an event is cancelled by the organizer.
                </p>
              </div>
            </div>

            <div className="policy-section">
              <h2>1. Attendee Ticket Cancellation (7-Day Policy)</h2>
              <p>
                We understand that travel and personal schedules can change unexpectedly. EventHub offers a clear and structured cancellation policy:
              </p>
              <ul>
                <li>
                  <strong>7+ Days Before Event:</strong> If you cancel your confirmed ticket booking at least <strong>7 days prior</strong> to the scheduled event date/time, you will receive a refund of the ticket price (minus standard payment gateway transaction fees where applicable).
                </li>
                <li>
                  <strong>Less Than 7 Days:</strong> Cancellations requested within less than 7 days of the scheduled event date or after the event has started are strictly <strong>non-refundable</strong>, as ticket allocations and venue logistics are finalized by the organizer.
                </li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>2. 100% Refund on Event Cancellation by Organizer</h2>
              <p>
                If an event is cancelled, indefinitely postponed, or rescheduled to a date you cannot attend:
              </p>
              <ul>
                <li>
                  <strong>100% Full Refund:</strong> You will automatically receive a 100% full refund of the total ticket amount paid.
                </li>
                <li>
                  <strong>Automatic Refund Initiation:</strong> Refunds for cancelled events will be processed automatically without requiring manual user claims.
                </li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>3. Refund Processing Timeline (5 to 7 Business Days)</h2>
              <p>
                Once your cancellation request is verified or an event cancellation is announced:
              </p>
              <ul>
                <li>
                  <strong>Processing Window:</strong> Refunds are credited back to your original payment source (UPI account, Bank Account, or Credit/Debit Card) within <strong>5 to 7 business/working days</strong>.
                </li>
                <li>
                  <strong>Direct Source Settlement:</strong> The refund is credited directly through our payment partner <strong>Razorpay</strong> back to the exact bank account or UPI VPA from which the transaction originated.
                </li>
                <li>
                  <strong>Email Confirmation:</strong> You will receive an automated refund confirmation email containing the refund ARN / transaction ID.
                </li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>4. How to Request a Cancellation or Refund</h2>
              <p>
                Cancelling your ticket is completely self-service:
              </p>
              <ol>
                <li>Log in to your account and go to <Link to="/bookings" className="text-link">My Bookings</Link>.</li>
                <li>Locate the event ticket you wish to cancel and click the <strong>&ldquo;Cancel Booking&rdquo;</strong> button.</li>
                <li>Confirm the cancellation request. Our system will immediately release your ticket back to inventory and initiate the refund.</li>
                <li>
                  Alternatively, email our support desk at <a href="mailto:support@eventhub.com" className="text-link">support@eventhub.com</a> with your Booking ID.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
