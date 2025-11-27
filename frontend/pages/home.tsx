import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../components/Sidebar';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [locationType, setLocationType] = useState<'base' | 'home' | 'other' | ''>('');
  const [otherLocation, setOtherLocation] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Check if profile is complete
    checkProfile();
  }, [router]);

  const checkProfile = async () => {
    try {
      const profileRes = await api.getProfile();
      const profile = profileRes.data.profile;
      const user = profileRes.data;
      
      // Store profile data
      setUserProfile({ user, profile });
      
      // Set user role for sidebar
      const role = profile?.role || '';
      setUserRole(role);
      
      // Check if required fields are missing
      if (!user.first_name || !user.last_name || !user.phone || !profile?.id_number) {
        // Redirect to profile page to complete
        router.push('/profile?incomplete=true');
        return;
      }
      
      // Check if profile needs approval
      if (!user.is_approved) {
        alert('הפרופיל שלך ממתין לאישור מנהל. תקבל הודעה לאחר האישור.');
        return;
      }
    } catch (err) {
      console.error('Failed to check profile:', err);
    }
  };

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationType) {
      setError('אנא בחר מיקום');
      return;
    }

    if (locationType === 'other' && !otherLocation.trim()) {
      setError('אנא הזן מיקום');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const dateTimeStr = now.toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Determine location text based on selection
      let locationText = '';
      if (locationType === 'base') {
        locationText = 'גדעונים';
      } else if (locationType === 'home') {
        locationText = userProfile?.profile?.address || 'בבית';
      } else if (locationType === 'other') {
        locationText = otherLocation.trim();
      }

      await api.createReport({
        date: today,
        status: 'available',
        location: null, // No longer using location FK
        location_text: locationText,
        notes: `מיקום: ${locationText} | תאריך ושעה: ${dateTimeStr}`,
      });
      setSuccess('דוח זמינות נשלח בהצלחה!');
      setLocationType('');
      setOtherLocation('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשליחת הדוח');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">עמוד בית</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {showSidebar ? 'הסתר תפריט' : 'הצג תפריט'}
              </button>
              <button
                onClick={() => api.logout()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                התנתק
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-green-600 mb-2">ירוק בעיניים</h2>
              <p className="text-gray-600">עדכון זמינות</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-right">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-right">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmitAvailability} className="space-y-6">
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  בחר מיקום <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationType}
                  onChange={(e) => {
                    setLocationType(e.target.value as 'base' | 'home' | 'other' | '');
                    setOtherLocation('');
                  }}
                  required
                  className="w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- בחר מיקום --</option>
                  <option value="base">בבסיס</option>
                  <option value="home">בבית</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              {locationType === 'other' && (
                <div>
                  <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                    הזן מיקום <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherLocation}
                    onChange={(e) => setOtherLocation(e.target.value)}
                    required
                    placeholder="הזן מיקום"
                    className="w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              {locationType === 'home' && userProfile?.profile?.address && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 text-right">
                    <strong>כתובת מהפרופיל:</strong> {userProfile.profile.address}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !locationType || (locationType === 'other' && !otherLocation.trim())}
                className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-md transition-all"
              >
                {loading ? 'שולח...' : 'אני זמין'}
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />
    </div>
  );
}
