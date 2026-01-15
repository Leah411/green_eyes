import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';
import SearchableLocationSelect from '../components/SearchableLocationSelect';

export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Check if user is already logged in
    const token = Cookies.get('access_token');
    if (token) {
      // Check user role and redirect accordingly
      checkUserAndRedirect();
    }
    
    // Load units for registration form
    if (!isLogin) {
      loadUnits();
    }
  }, [router, isLogin]);
  
  const loadUnits = async () => {
    try {
      const unitsRes = await api.getUnitsByParent(null, 'unit'); // Get root units
      const unitsData = unitsRes.data.results || unitsRes.data || [];
      const unitsArray = Array.isArray(unitsData) ? unitsData : [];
      // Show all root units (including the main organizational unit)
      console.log('Loaded units:', unitsArray.length, unitsArray);
      setUnits(unitsArray);
    } catch (err) {
      console.error('Failed to load units:', err);
      setUnits([]);
    }
  };

  const loadBranches = async (parentId: number) => {
    try {
      const branchesRes = await api.getUnitsByParent(parentId, 'branch');
      const branchesData = branchesRes.data.results || branchesRes.data || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    }
  };

  const loadSections = async (parentId: number) => {
    try {
      const sectionsRes = await api.getUnitsByParent(parentId, 'section');
      const sectionsData = sectionsRes.data.results || sectionsRes.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setSections([]);
    }
  };

  const loadTeams = async (parentId: number) => {
    try {
      const teamsRes = await api.getUnitsByParent(parentId, 'team');
      const teamsData = teamsRes.data.results || teamsRes.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err) {
      console.error('Failed to load teams:', err);
      setTeams([]);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnitId = e.target.value ? Number(e.target.value) : null;
    setUnitId(selectedUnitId);
    setBranchId(null);
    setSectionId(null);
    setTeamId(null);
    setBranches([]);
    setSections([]);
    setTeams([]);
    
    if (selectedUnitId) {
      loadBranches(selectedUnitId);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBranchId = e.target.value ? Number(e.target.value) : null;
    setBranchId(selectedBranchId);
    setSectionId(null);
    setTeamId(null);
    setSections([]);
    setTeams([]);
    
    if (selectedBranchId) {
      loadSections(selectedBranchId);
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSectionId = e.target.value ? Number(e.target.value) : null;
    setSectionId(selectedSectionId);
    setTeamId(null);
    setTeams([]);
    
    if (selectedSectionId) {
      loadTeams(selectedSectionId);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = e.target.value ? Number(e.target.value) : null;
    setTeamId(selectedTeamId);
  };

  const checkUserAndRedirect = async () => {
    // Redirect to home page after login
    router.push('/home');
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
      // Only log full error in development, avoid logging sensitive info
      if (process.env.NODE_ENV === 'development') {
        console.error('OTP request error:', err);
      }
      
      let errorMessage = 'שגיאה בשליחת קוד אימות. אנא נסה שוב.';
      
      // Handle network errors (connection refused, timeout, etc.)
      if (!err.response) {
        const errorCode = err.code || '';
        const errMsg = err.message || '';
        
        if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_CONNECTION_REFUSED' || 
            errMsg.includes('CONNECTION_REFUSED') || errMsg.includes('Network Error')) {
          errorMessage = 'לא ניתן להתחבר לשרת. אנא ודא שהשרת פועל ונסה שוב.';
        } else if (errMsg.includes('timeout') || errorCode.includes('TIMEOUT')) {
          errorMessage = 'פג תוקף החיבור. אנא נסה שוב.';
        } else {
          errorMessage = 'שגיאת חיבור. אנא ודא שהשרת פועל ונסה שוב.';
        }
      } 
      // Handle API response errors
      else if (err.response?.data?.email) {
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

    // Validate all required fields
    if (!firstName || !lastName || !email || !phone || !address || !cityId || !contactName || !contactPhone) {
      setError('כל השדות המסומנים ב-* חייבים להיות ממולאים');
      setLoading(false);
      return;
    }

    // Use the most specific unit selected (team > section > branch > unit)
    const finalUnitId = teamId || sectionId || branchId || unitId;
    
    // Validate unit hierarchy is fully selected
    if (!finalUnitId || !unitId || !branchId || !sectionId || !teamId) {
      setError('יש לבחור יחידה, ענף, מדור וצוות');
      setLoading(false);
      return;
    }

    try {
      
      await api.register({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        unit_id: finalUnitId,
        address: address,
        city_id: cityId,
        contact_name: contactName,
        contact_phone: contactPhone,
      });
      setSuccess('הרשמה בוצעה בהצלחה! הבקשה נשלחה לאישור מנהל מערכת או מנהל יחידה.');
      setIsLogin(true);
      // Clear form
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setUnitId(null);
      setBranchId(null);
      setSectionId(null);
      setTeamId(null);
      setBranches([]);
      setSections([]);
      setTeams([]);
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
        } else if (errorData.email) {
          setError(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
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
            כניסה
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-center ${
              !isLogin
                ? 'border-b-2 border-primary-500 text-primary-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            הרשמה
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
          <form onSubmit={handleRegister} className="space-y-6" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  שם פרטי <span className="text-red-500">*</span>
                </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow Hebrew letters and hyphen
                  const hebrewPattern = /^[\u0590-\u05FF\s-]*$/;
                  if (value === '' || hebrewPattern.test(value)) {
                    setFirstName(value);
                    // Validate minimum 2 characters
                    if (value.length > 0 && value.length < 2) {
                      setFieldErrors({...fieldErrors, firstName: 'שם פרטי חייב להכיל לפחות 2 תווים'});
                    } else {
                      const newErrors = {...fieldErrors};
                      delete newErrors.firstName;
                      setFieldErrors(newErrors);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.firstName ? 'border-red-500' : ''
                }`}
                placeholder="הזן שם פרטי"
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.firstName}</p>
              )}
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  שם משפחה <span className="text-red-500">*</span>
                </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow Hebrew letters and hyphen
                  const hebrewPattern = /^[\u0590-\u05FF\s-]*$/;
                  if (value === '' || hebrewPattern.test(value)) {
                    setLastName(value);
                    // Validate minimum 2 characters
                    if (value.length > 0 && value.length < 2) {
                      setFieldErrors({...fieldErrors, lastName: 'שם משפחה חייב להכיל לפחות 2 תווים'});
                    } else {
                      const newErrors = {...fieldErrors};
                      delete newErrors.lastName;
                      setFieldErrors(newErrors);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.lastName ? 'border-red-500' : ''
                }`}
                placeholder="הזן שם משפחה"
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.lastName}</p>
              )}
              </div>
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                אימייל <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  // Validate email format
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (value.length > 0 && !emailRegex.test(value)) {
                    setFieldErrors({...fieldErrors, email: 'אנא הזן אימייל תקין'});
                  } else {
                    const newErrors = {...fieldErrors};
                    delete newErrors.email;
                    setFieldErrors(newErrors);
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
                placeholder="הזן אימייל"
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                טלפון <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only numbers
                  if (value.length <= 10) {
                    setPhone(value);
                    // Validate 10 digits
                    if (value.length > 0 && value.length !== 10) {
                      setFieldErrors({...fieldErrors, phone: 'מספר טלפון חייב להכיל 10 ספרות'});
                    } else {
                      const newErrors = {...fieldErrors};
                      delete newErrors.phone;
                      setFieldErrors(newErrors);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.phone ? 'border-red-500' : ''
                }`}
                placeholder="הזן מספר טלפון"
                maxLength={10}
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                יחידה <span className="text-red-500">*</span>
              </label>
              <select
                value={unitId || ''}
                onChange={handleUnitChange}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר יחידה --</option>
                {Array.isArray(units) && units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name_he || unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                ענף <span className="text-red-500">*</span>
              </label>
              <select
                value={branchId || ''}
                onChange={handleBranchChange}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                disabled={!unitId}
              >
                <option value="">-- בחר ענף --</option>
                {branches && Array.isArray(branches) && branches.length > 0 && branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name_he || branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                מדור <span className="text-red-500">*</span>
              </label>
              <select
                value={sectionId || ''}
                onChange={handleSectionChange}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                disabled={!branchId}
              >
                <option value="">-- בחר מדור --</option>
                {Array.isArray(sections) && sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name_he || section.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                צוות <span className="text-red-500">*</span>
              </label>
              <select
                value={teamId || ''}
                onChange={handleTeamChange}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
                disabled={!sectionId}
              >
                <option value="">-- בחר צוות --</option>
                {Array.isArray(teams) && teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name_he || team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                כתובת מגורים <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow Hebrew letters, numbers, and spaces
                  const addressPattern = /^[\u0590-\u05FF\s0-9]*$/;
                  if (value === '' || addressPattern.test(value)) {
                    setAddress(value);
                    const newErrors = {...fieldErrors};
                    delete newErrors.address;
                    setFieldErrors(newErrors);
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.address ? 'border-red-500' : ''
                }`}
                placeholder="הזן כתובת מגורים"
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                עיר מגורים <span className="text-red-500">*</span>
              </label>
              <SearchableLocationSelect
                value={cityId}
                onChange={setCityId}
                placeholder="חפש עיר או ישוב..."
              />
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                שם איש קשר <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow Hebrew letters and hyphen
                  const hebrewPattern = /^[\u0590-\u05FF\s-]*$/;
                  if (value === '' || hebrewPattern.test(value)) {
                    setContactName(value);
                    const newErrors = {...fieldErrors};
                    delete newErrors.contactName;
                    setFieldErrors(newErrors);
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.contactName ? 'border-red-500' : ''
                }`}
                placeholder="הזן שם איש קשר"
              />
              {fieldErrors.contactName && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                טלפון איש קשר <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only numbers
                  if (value.length <= 10) {
                    setContactPhone(value);
                    // Validate 10 digits
                    if (value.length > 0 && value.length !== 10) {
                      setFieldErrors({...fieldErrors, contactPhone: 'מספר טלפון איש קשר חייב להכיל 10 ספרות'});
                    } else {
                      const newErrors = {...fieldErrors};
                      delete newErrors.contactPhone;
                      setFieldErrors(newErrors);
                    }
                  }
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg text-right ${
                  fieldErrors.contactPhone ? 'border-red-500' : ''
                }`}
                placeholder="הזן מספר טלפון איש קשר"
                maxLength={10}
              />
              {fieldErrors.contactPhone && (
                <p className="text-red-500 text-sm mt-1 text-right">{fieldErrors.contactPhone}</p>
              )}
            </div>
            <div className="flex gap-4 justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'שומר...' : 'הרשמה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


