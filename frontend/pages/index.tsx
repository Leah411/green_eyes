import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';

export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [unitId, setUnitId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const token = Cookies.get('access_token');
    if (token) {
      // Check user role and redirect accordingly
      checkUserAndRedirect();
    }
    
    // Load units and locations for registration form
    if (!isLogin) {
      loadUnitsAndLocations();
    }
  }, [router, isLogin]);
  
  const loadUnitsAndLocations = async () => {
    try {
      const [unitsRes, locationsRes] = await Promise.all([
        api.listUnits(),
        api.listLocations(),
      ]);
      setUnits(unitsRes.data.results || unitsRes.data || []);
      setLocations(locationsRes.data.results || locationsRes.data || []);
    } catch (err) {
      console.error('Failed to load units/locations:', err);
    }
  };

  const checkUserAndRedirect = async () => {
    try {
      const profileRes = await api.getProfile();
      const role = profileRes.data.profile?.role || '';
      const isManager = ['system_manager', 'unit_manager', 'branch_manager', 'section_manager', 'team_manager', 'admin'].includes(role);
      
      if (isManager) {
        router.push('/dashboard/manager');
      } else {
        router.push('/home');
      }
    } catch (err) {
      // If can't get profile, go to home
      router.push('/home');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    document.documentElement.setAttribute('dir', newLang === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('אנא הזן אימייל');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('אנא הזן אימייל תקין');
      setLoading(false);
      return;
    }

    try {
      await api.requestOTP({ email: email.trim() });
      setSuccess('קוד אימות נשלח למייל שלך. בדוק בתיבת ה-PROMOTIONS או SPAM');
      // Redirect to verify OTP page
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      console.error('OTP request error:', err.response?.data);
      
      let errorMessage = 'שגיאה בשליחת קוד אימות. אנא נסה שוב.';
      
      // Handle serializer validation errors
      if (err.response?.data?.email) {
        const emailError = Array.isArray(err.response.data.email) 
          ? err.response.data.email[0] 
          : err.response.data.email;
        
        // Translate common error messages to Hebrew
        if (typeof emailError === 'string') {
          if (emailError.includes('does not exist')) {
            errorMessage = 'משתמש עם אימייל זה לא קיים במערכת. אנא בדוק את האימייל או הירשם למערכת.';
          } else if (emailError.includes('not approved')) {
            errorMessage = 'החשבון ממתין לאישור מנהל. אנא פנה למנהל המערכת.';
          } else {
            errorMessage = emailError;
          }
      } else {
          errorMessage = 'שגיאה באימייל. אנא בדוק שהאימייל תקין.';
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.status === 'pending') {
        errorMessage = 'החשבון ממתין לאישור מנהל. אנא פנה למנהל המערכת.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate passwords match
      if (password !== password2) {
        setError('הסיסמאות לא תואמות');
        setLoading(false);
        return;
      }

      await api.register({
        username,
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
        phone,
        id_number: idNumber,
        unit_id: unitId,
        address: address,
        city_id: cityId,
      });
      setSuccess('הרשמה בוצעה בהצלחה! הבקשה נשלחה לאישור מנהל מערכת או מנהל יחידה.');
      setIsLogin(true);
      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setPassword2('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setIdNumber('');
      setUnitId(null);
      setAddress('');
      setCityId(null);
    } catch (err: any) {
      // Handle validation errors from backend
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.password) {
          setError(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password);
        } else if (errorData.email) {
          setError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
        } else if (errorData.username) {
          setError(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
        } else {
          setError('הרשמה נכשלה. אנא בדוק את הפרטים שהזנת.');
        }
      } else {
          setError('הרשמה נכשלה. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary-600">ירוק בעיניים</h1>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
          >
            {i18n.language === 'he' ? 'EN' : 'עברית'}
          </button>
        </div>

        <div className="flex mb-6 border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-center ${
              isLogin
                ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            {t('common.login')}
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-center ${
              !isLogin
                ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            {t('common.register')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleRequestOTP} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-right text-sm font-medium mb-1">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן אימייל"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'שולח קוד...' : 'בקש קוד אימות (OTP)'}
            </button>
            <p className="text-xs text-gray-500 text-center text-right">
              הקוד יישלח למייל שלך. בדוק בתיבת ה-PROMOTIONS או SPAM
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-right text-sm font-medium mb-1">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן שם משתמש"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן אימייל"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-right text-sm font-medium mb-1">שם פרטי</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                  placeholder="הזן שם פרטי"
                />
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">שם משפחה</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                  placeholder="הזן שם משפחה"
                />
              </div>
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן סיסמה"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">אישור סיסמה</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן סיסמה שוב"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן מספר טלפון"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">תעודת זהות</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן תעודת זהות"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">יחידה</label>
              <select
                value={unitId || ''}
                onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר יחידה --</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name_he || unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">כתובת מגורים</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן כתובת מגורים"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-1">עיר מגורים</label>
              <select
                value={cityId || ''}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר עיר --</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name_he || location.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.register')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

