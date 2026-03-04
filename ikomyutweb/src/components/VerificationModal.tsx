import React, { useState, useEffect } from 'react';
import '../styles/VerificationModal.css';

interface VerificationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  email,
  onClose,
  onSuccess,
}) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Use localhost for development, production URL for deployment
  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://ikomyutweb-4.onrender.com/api/auth'
    : 'http://localhost:5000/api/auth';

  // Handle verification code input
  const handleVerificationCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1); // Keep only last character
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace in verification code
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = verificationCode.join('');

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      // Success - call the onSuccess callback
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/resend-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend code');

      setError('New code sent to your email');
      setVerificationCode(['', '', '', '', '', '']);
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Reset state when modal closes and set timer when opens
  useEffect(() => {
    if (!isOpen) {
      setVerificationCode(['', '', '', '', '', '']);
      setError('');
      setResendTimer(0);
      setLoading(false);
    } else {
      // Only set timer once when modal opens (when resendTimer is 0)
      setResendTimer((prev) => prev === 0 ? 30 : prev);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay verification-overlay" onClick={onClose}>
      <div
        className="modal-content verification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close verification modal"
        >
          ×
        </button>

        <div className="verification-content">
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit code we sent to:</p>
          <p className="email-display">{email}</p>

          <form className="verification-form" onSubmit={handleVerifyEmail}>
            <div className="verification-code-inputs">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="verification-input"
                />
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="btn btn--primary verification-submit"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="resend-section">
            <p>
              Didn't receive the code?{' '}
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendCode}
                disabled={resendTimer > 0 || loading}
              >
                {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
