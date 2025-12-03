import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isManager, setIsManager] = useState(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: '',
    unit_id: null as number | null,
    role: 'user',
    address: '',
    city_id: null as number | null,
    in_reserves: false,
    reserves_date: '',
  });

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [profileRes, unitsRes, locationsRes] = await Promise.all([
        api.getProfile(),
        api.listUnits(),
        api.listLocations(),
      ]);
      
      const userData = profileRes.data;
      setUser(userData);
      setProfile(userData.profile);
      setUnits(unitsRes.data.results || unitsRes.data || []);
      setLocations(locationsRes.data.results || locationsRes.data || []);
      
      // Check if user is manager
      const userRole = userData.profile?.role || '';
      setIsManager(['system_manager', 'unit_manager', 'branch_manager', 'section_manager', 'team_manager', 'admin'].includes(userRole));
      
      // Populate form
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        id_number: userData.profile?.id_number || '',
        unit_id: userData.profile?.unit || null,
        role: userData.profile?.role || 'user',
        address: userData.profile?.address || '',
        city_id: userData.profile?.city || null,
        in_reserves: false, // TODO: Add reserves field to model
        reserves_date: '', // TODO: Add reserves_date field to model
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate all required fields
    if (!formData.first_name || !formData.last_name || !formData.email || 
        !formData.phone || !formData.id_number) {
      setError('כל השדות חייבים להיות ממולאים');
      setSaving(false);
      return;
    }

    try {
      // Update profile if exists
      if (profile && profile.id) {
        const profileUpdateData: any = {
          id_number: formData.id_number,
          unit: formData.unit_id,
          address: formData.address,
          city: formData.city_id,
          // Include user fields in profile update
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email,
        };
        
        await api.updateProfile(profile.id, profileUpdateData);
      } else {
        setError('פרופיל לא נמצא. אנא פנה למנהל המערכת.');
        setSaving(false);
        return;
      }
      
        setSuccess('הפרופיל עודכן בהצלחה!');
        setTimeout(() => {
          router.push('/home');
        }, 1500);
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          // Show first validation error
          const firstError = Object.values(errorData)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        }
      } else {
        setError('שגיאה בעדכון הפרופיל');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl">טוען...</div>;
  }

  const userRole = profile?.role || '';

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">פרופיל אישי</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {showSidebar ? 'הסתר תפריט' : 'הצג תפריט'}
              </button>
              <button
                onClick={() => router.push('/home')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                חזרה
              </button>
            </div>
          </div>
        </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                שם פרטי <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
              />
            </div>
            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                שם משפחה <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              אימייל <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              טלפון <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              תעודת זהות <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              יחידה
            </label>
            <select
              value={formData.unit_id || ''}
              onChange={(e) => setFormData({ ...formData, unit_id: e.target.value ? Number(e.target.value) : null })}
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
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              כתובת מגורים
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg text-right"
              placeholder="הזן כתובת מגורים"
            />
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              עיר מגורים
            </label>
            <select
              value={formData.city_id || ''}
              onChange={(e) => setFormData({ ...formData, city_id: e.target.value ? Number(e.target.value) : null })}
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

          {/* Reserves Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4 text-right">מילואים</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-right">
                  <input
                    type="checkbox"
                    checked={formData.in_reserves}
                    onChange={(e) => setFormData({ ...formData, in_reserves: e.target.checked })}
                    disabled={!isManager}
                    className="ml-2"
                  />
                  <span>במילואים</span>
                  {!isManager && <span className="text-xs text-gray-500 mr-2">(רק מנהל יכול לשנות)</span>}
                </label>
              </div>
              {formData.in_reserves && (
                <div>
                  <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                    תאריך מילואים
                  </label>
                  <input
                    type="date"
                    value={formData.reserves_date}
                    onChange={(e) => setFormData({ ...formData, reserves_date: e.target.value })}
                    disabled={!isManager}
                    className="w-full px-4 py-2 border rounded-lg text-right"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />
    </div>
  );
}

