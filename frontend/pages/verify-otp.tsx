import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';

export default function VerifyOTP() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from query params or localStorage
    const emailParam = router.query.email as string;
    const storedEmail = localStorage.getItem('otp_email');
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('otp_email', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [router.query]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.verifyOTP({ email, token: otpCode });
      if (response.data.access && response.data.refresh) {
        localStorage.removeItem('otp_email');
        
        // Redirect to home page after login
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.token?.[0] || err.response?.data?.error || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.requestOTP({ email });
      alert(t('auth.otpSent'));
    } catch (err: any) {
      console.error('OTP request error:', err.response?.data);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      // Handle serializer validation errors
      if (err.response?.data?.email) {
        const emailError = Array.isArray(err.response.data.email) 
          ? err.response.data.email[0] 
          : err.response.data.email;
        
        // Translate common error messages
        if (typeof emailError === 'string') {
          if (emailError.includes('does not exist')) {
            errorMessage = 'User with this email does not exist. Please check your email or register first.';
          } else if (emailError.includes('not approved')) {
            errorMessage = 'Account is pending admin approval. Please contact your system administrator.';
          } else {
            errorMessage = emailError;
          }
        } else {
          errorMessage = 'Email error. Please check that the email is valid.';
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-primary-600 mb-6 text-center">
          {t('auth.otpTitle')}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.otpCode')}</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.verifyOTP')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleRequestOTP}
            disabled={loading}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            {t('auth.requestOTP')}
          </button>
        </div>
      </div>
    </div>
  );
}

