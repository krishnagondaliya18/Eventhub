import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AiChatbot.css';

const formatTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderMarkdown = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Links [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="ai-chat-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // Bullet lists
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ai-chat-li">$1</li>');
  // Wrap consecutive <li> into <ul>
  html = html.replace(/((?:<li class="ai-chat-li">.*?<\/li>\s*)+)/g, '<ul class="ai-chat-ul">$1</ul>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
};

export const AiChatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! 👋 Welcome to **EventHub Help & Support**.\n\nI can answer all your questions about:\n- 🎟️ **Event Booking & Pricing:** Booking steps, real-time pricing, tickets limits (1–10)\n- 💳 **Payments & Checkout:** Official Razorpay Gateway (UPI, GPay, PhonePe, Paytm, Cards, Netbanking)\n- 📄 **Official PDF Tickets:** Instant digital admission pass with gate entry QR code\n- ⏰ **24-Hour Event Reminders:** Automated reminder emails 1 day before the event\n- 💸 **Refund & Cancellation Policy:** 100% refund (>48h), 50% refund (24-48h), organizer cancellation rules\n- 🎪 **Hosting Events as an Organizer:** Creating events, approval process, participant rosters\n- 📜 **Platform Rules, Terms & Privacy:** Gate security rules, terms of service, customer support\n\nHow can I help you today?',
      time: formatTime()
    }
  ]);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: '🎟️ How to Book Tickets?', prompt: 'How do I book tickets and get my PDF pass?' },
    { label: '💳 Payment & UPI Options', prompt: 'What payment methods, UPI apps, and auto-scan QR options are available?' },
    { label: '💸 Refund & Cancellation', prompt: 'What is the full refund and cancellation policy?' },
    { label: '⏰ 24h Event Reminder System', prompt: 'How does the 24-hour event reminder system work?' },
    { label: '🎪 How to Host an Event?', prompt: 'What are the rules and process to host an event as an organizer?' },
    { label: '📜 Platform Rules & Terms', prompt: 'What are the platform rules, gate entry rules, and terms of service?' },
    { label: '📞 Contact Support Team', prompt: 'How do I contact customer support directly?' }
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      const container = document.getElementById('ai-chat-body');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. Welcome to EventHub Help & Support! What can I help you with?',
        time: formatTime()
      }
    ]);
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg = {
      sender: 'user',
      text,
      time: formatTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        role: user?.role || 'user'
      });

      const reply = res.data?.reply || res.data?.response || 'I am currently unable to reach the support assistant. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: formatTime()
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, I encountered a temporary connection issue. Please check your network or try again shortly.',
          time: formatTime()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('/')) {
      e.preventDefault();
      navigate(target.getAttribute('href'));
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="ai-trigger-wrapper">
          <button className="ai-trigger-btn" onClick={toggleChat} title="EventHub Help & Support">
            <span className="material-icons trigger-icon">support_agent</span>
            <span className="trigger-label">Help &amp; Support</span>
            <span className="trigger-pulse"></span>
          </button>
        </div>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className={`ai-chat-window open ${isMinimized ? 'minimized' : ''}`}>
          {/* HEADER */}
          <div className="ai-chat-header" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="ai-header-left">
              <div className="ai-avatar-ring">
                <span className="material-icons">support_agent</span>
              </div>
              <div>
                <h4 className="ai-header-title">Help &amp; Support</h4>
                <span className="ai-header-status">
                  <span className="status-dot"></span> 24/7 Live Support &amp; Guide
                </span>
              </div>
            </div>

            <div className="ai-header-actions" onClick={(e) => e.stopPropagation()}>
              <button className="ai-hbtn" onClick={clearChat} title="Clear Chat">
                <span className="material-icons">delete_sweep</span>
              </button>
              <button
                className="ai-hbtn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                title="Minimize"
              >
                <span className="material-icons">{isMinimized ? 'expand_less' : 'expand_more'}</span>
              </button>
              <button className="ai-hbtn close-btn" onClick={toggleChat} title="Close">
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>

          {/* BODY (HIDDEN IF MINIMIZED) */}
          {!isMinimized && (
            <div className="ai-chat-body" id="ai-chat-body">
              {/* QUICK SUGGESTIONS */}
              <div className="ai-quick-prompts-bar">
                <span className="quick-title">Suggested:</span>
                <div className="quick-scroll">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.label}
                      className="quick-chip-btn"
                      onClick={() => handleSend(item.prompt)}
                    >
                      {{ ...item }.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MESSAGES LIST */}
              <div className="ai-messages-flow">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`ai-msg-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="ai-msg-avatar">
                        <span className="material-icons">smart_toy</span>
                      </div>
                    )}
                    <div className="ai-msg-bubble">
                      <div
                        className="ai-msg-content"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                        onClick={handleMessageClick}
                      />
                      <span className="ai-msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {isLoading && (
                  <div className="ai-msg-row ai-row">
                    <div className="ai-msg-avatar">
                      <span className="material-icons">smart_toy</span>
                    </div>
                    <div className="ai-msg-bubble typing-bubble">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* FOOTER / INPUT BAR (HIDDEN IF MINIMIZED) */}
          {!isMinimized && (
            <div className="ai-chat-footer">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="ai-input-form"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about events, bookings, payments, policies..."
                  className="ai-input-field"
                  autoComplete="off"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="ai-send-btn"
                  disabled={!inputMessage.trim() || isLoading}
                  title="Send"
                >
                  <span className="material-icons">send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AiChatbot;
