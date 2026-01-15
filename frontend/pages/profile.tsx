import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../components/Sidebar';
import SearchableLocationSelect from '../components/SearchableLocationSelect';
import MenuIcon from '../components/MenuIcon';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isManager, setIsManager] = useState(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    unit_id: null as number | null,
    role: 'user',
    service_type: '',
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
      const profileRes = await api.getProfile();
      
      const userData = profileRes.data;
      setUser(userData);
      setProfile(userData.profile);
      
      // Check if user is manager
      const userRole = userData.profile?.role || '';
      setIsManager(['system_manager', 'unit_manager', 'branch_manager', 'section_manager', 'team_manager', 'admin'].includes(userRole));
      
      // Load units (only root units - type 'unit')
      await loadUnits();
      
      // If user has a unit, determine the hierarchy
      const currentUnitId = userData.profile?.unit;
      if (currentUnitId) {
        await determineUnitHierarchy(currentUnitId);
      }
      
      // Populate form
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        unit_id: currentUnitId || null,
        role: userData.profile?.role || 'user',
        service_type: userData.profile?.service_type || '',
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

  const loadUnits = async () => {
    try {
      const response = await api.getUnitsByParent(null, 'unit');
      const unitsData = response.data.results || response.data || [];
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (err) {
      console.error('Failed to load units:', err);
      setUnits([]);
    }
  };

  const loadBranches = async (unitId: number) => {
    try {
      const response = await api.getUnitsByParent(unitId, 'branch');
      const branchesData = response.data.results || response.data || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    }
  };

  const loadSections = async (branchId: number) => {
    try {
      const response = await api.getUnitsByParent(branchId, 'section');
      const sectionsData = response.data.results || response.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setSections([]);
    }
  };

  const loadTeams = async (sectionId: number) => {
    try {
      const response = await api.getUnitsByParent(sectionId, 'team');
      const teamsData = response.data.results || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err) {
      console.error('Failed to load teams:', err);
      setTeams([]);
    }
  };

  const determineUnitHierarchy = async (unitId: number) => {
    try {
      const unitResponse = await api.getUnit(unitId);
      const unit = unitResponse.data;
      
      if (!unit) return;
      
      const parentId = typeof unit.parent === 'object' ? unit.parent?.id : (unit.parent || null);
      
      // Determine the hierarchy by checking unit_type and parent
      if (unit.unit_type === 'team') {
        setSelectedTeamId(unitId);
        if (parentId) {
          await determineSectionHierarchy(parentId);
        }
      } else if (unit.unit_type === 'section') {
        setSelectedSectionId(unitId);
        await loadTeams(unitId);
        if (parentId) {
          await determineBranchHierarchy(parentId);
        }
      } else if (unit.unit_type === 'branch') {
        setSelectedBranchId(unitId);
        await loadSections(unitId);
        if (parentId) {
          setSelectedUnitId(parentId);
          await loadBranches(parentId);
        }
      } else if (unit.unit_type === 'unit') {
        setSelectedUnitId(unitId);
        await loadBranches(unitId);
      }
    } catch (err) {
      console.error('Failed to determine unit hierarchy:', err);
    }
  };

  const determineSectionHierarchy = async (sectionId: number) => {
    try {
      const sectionResponse = await api.getUnit(sectionId);
      const section = sectionResponse.data;
      if (!section) return;
      
      setSelectedSectionId(sectionId);
      await loadTeams(sectionId);
      
      const parentId = typeof section.parent === 'object' ? section.parent?.id : (section.parent || null);
      if (parentId) {
        await determineBranchHierarchy(parentId);
      }
    } catch (err) {
      console.error('Failed to determine section hierarchy:', err);
    }
  };

  const determineBranchHierarchy = async (branchId: number) => {
    try {
      const branchResponse = await api.getUnit(branchId);
      const branch = branchResponse.data;
      if (!branch) return;
      
      setSelectedBranchId(branchId);
      await loadSections(branchId);
      
      const parentId = typeof branch.parent === 'object' ? branch.parent?.id : (branch.parent || null);
      if (parentId) {
        setSelectedUnitId(parentId);
        await loadBranches(parentId);
      }
    } catch (err) {
      console.error('Failed to determine branch hierarchy:', err);
    }
  };

  const handleUnitChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value ? Number(e.target.value) : null;
    setSelectedUnitId(unitId);
    setSelectedBranchId(null);
    setSelectedSectionId(null);
    setSelectedTeamId(null);
    setBranches([]);
    setSections([]);
    setTeams([]);
    
    if (unitId) {
      await loadBranches(unitId);
    }
  };

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value ? Number(e.target.value) : null;
    setSelectedBranchId(branchId);
    setSelectedSectionId(null);
    setSelectedTeamId(null);
    setSections([]);
    setTeams([]);
    
    if (branchId) {
      await loadSections(branchId);
    }
  };

  const handleSectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sectionId = e.target.value ? Number(e.target.value) : null;
    setSelectedSectionId(sectionId);
    setSelectedTeamId(null);
    setTeams([]);
    
    if (sectionId) {
      await loadTeams(sectionId);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value ? Number(e.target.value) : null;
    setSelectedTeamId(teamId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate all required fields
    if (!formData.first_name || !formData.last_name || !formData.email || 
        !formData.phone) {
      setError('כל השדות חייבים להיות ממולאים');
      setSaving(false);
      return;
    }

    try {
      // Determine the final unit ID (most specific selection)
      const finalUnitId = selectedTeamId || selectedSectionId || selectedBranchId || selectedUnitId;
      
      // Update profile if exists
      if (profile && profile.id) {
        const profileUpdateData: any = {
          unit: finalUnitId,
          service_type: formData.service_type,
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
      {/* Menu Icon */}
      <MenuIcon onClick={() => setShowSidebar(!showSidebar)} isOpen={showSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">פרופיל אישי</h1>
            <div className="flex gap-2">
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-right">מבנה ארגוני</h3>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              יחידה
            </label>
            <select
                value={selectedUnitId || ''}
                onChange={handleUnitChange}
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

            {selectedUnitId && (
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  ענף
                </label>
                <select
                  value={selectedBranchId || ''}
                  onChange={handleBranchChange}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="">-- בחר ענף --</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name_he || branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBranchId && (
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  מדור
                </label>
                <select
                  value={selectedSectionId || ''}
                  onChange={handleSectionChange}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="">-- בחר מדור --</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name_he || section.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSectionId && (
              <div>
                <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                  צוות
                </label>
                <select
                  value={selectedTeamId || ''}
                  onChange={handleTeamChange}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="">-- בחר צוות --</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name_he || team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-right text-sm font-medium mb-2 text-gray-700">
              סוג שירות <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg text-right"
              required
            >
              <option value="">-- בחר סוג שירות --</option>
              <option value="חובה">חובה</option>
              <option value="קבע">קבע</option>
              <option value="יועץ">יועץ</option>
              <option value="אעצ">אעצ</option>
              <option value="מילואים">מילואים</option>
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
            <SearchableLocationSelect
              value={formData.city_id}
              onChange={(locationId) => setFormData({ ...formData, city_id: locationId })}
              placeholder="-- בחר עיר -- (הקלד כדי לחפש)"
              className="w-full"
            />
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

