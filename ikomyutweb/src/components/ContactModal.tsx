import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || user.name || '',
        email: user.email || '',
      }));
    }
  }, [isLoggedIn, user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const email = formData.email.trim();

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (email.length < 5) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (email.startsWith('.') || email.endsWith('.') || email.includes('..')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://ikomyutweb-4.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to send message';
        throw new Error(errorMsg);
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', email: '', message: '' });
        onClose();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content contact-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="contact-header">
          <h2>Contact Us</h2>
          <p>Have questions? We'd love to hear from you!</p>
        </div>

        {success ? (
          <div className="contact-success">
            <div className="success-icon">✓</div>
            <p>Thank you! Your message has been sent successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            {error && (
              <div className="form-error" style={{ color: '#d32f2f', marginBottom: '12px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                disabled={loading || (isLoggedIn && !!formData.name)}
              />
            </div>

            <div className="form-group">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                disabled={loading || (isLoggedIn && !!formData.email)}
              />
            </div>

            <div className="form-group">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Message"
                rows={5}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
