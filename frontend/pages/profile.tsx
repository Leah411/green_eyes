import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../components/Sidebar';
import SearchableLocationSelect from '../components/SearchableLocationSelect';

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
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: '',
    unit_id: null as number | null,
    branch_id: null as number | null,
    section_id: null as number | null,
    team_id: null as number | null,
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
      const [profileRes, unitsRes] = await Promise.all([
        api.getProfile(),
        api.getUnitsByParent(null, 'unit'), // Get root units
      ]);
      
      const userData = profileRes.data;
      setUser(userData);
      setProfile(userData.profile);
      const unitsData = unitsRes.data.results || unitsRes.data || [];
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      
      // Check if user is manager
      const userRole = userData.profile?.role || '';
      setIsManager(['system_manager', 'unit_manager', 'branch_manager', 'section_manager', 'team_manager', 'admin'].includes(userRole));
      
      // Get the user's unit and determine hierarchy by traversing up the parent chain
      const userUnit = userData.profile?.unit;
      let unitId = null;
      let branchId = null;
      let sectionId = null;
      let teamId = null;
      
      if (userUnit && userUnit.id) {
        try {
          // Start from the user's unit and traverse up
          let currentUnitId = userUnit.id;
          let currentUnit = userUnit;
          
          // Determine the current level and set IDs
          if (currentUnit.unit_type === 'team') {
            teamId = currentUnit.id;
            currentUnitId = currentUnit.parent;
          } else if (currentUnit.unit_type === 'section') {
            sectionId = currentUnit.id;
            currentUnitId = currentUnit.parent;
          } else if (currentUnit.unit_type === 'branch') {
            branchId = currentUnit.id;
            currentUnitId = currentUnit.parent;
          } else {
            unitId = currentUnit.id;
            currentUnitId = null;
          }
          
          // Traverse up the parent chain
          while (currentUnitId) {
            try {
              const parentRes = await api.getUnit(currentUnitId);
              const parent = parentRes.data;
              
              if (parent.unit_type === 'section') {
                sectionId = parent.id;
                currentUnitId = parent.parent;
              } else if (parent.unit_type === 'branch') {
                branchId = parent.id;
                currentUnitId = parent.parent;
              } else if (parent.unit_type === 'unit') {
                unitId = parent.id;
                currentUnitId = null;
              } else {
                break;
              }
            } catch (err) {
              console.error('Failed to load parent unit:', err);
              break;
            }
          }
        } catch (err) {
          console.error('Failed to load unit hierarchy:', err);
        }
      }
      
      // Populate form
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        id_number: userData.profile?.id_number || '',
        unit_id: unitId,
        branch_id: branchId,
        section_id: sectionId,
        team_id: teamId,
        role: userData.profile?.role || 'user',
        address: userData.profile?.address || '',
        city_id: userData.profile?.city || null,
        in_reserves: false, // TODO: Add reserves field to model
        reserves_date: '', // TODO: Add reserves_date field to model
      });
      
      // Load branches, sections, teams if needed
      if (unitId) {
        loadBranches(unitId);
      }
      if (branchId) {
        loadSections(branchId);
      }
      if (sectionId) {
        loadTeams(sectionId);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
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
    setFormData({
      ...formData,
      unit_id: selectedUnitId,
      branch_id: null,
      section_id: null,
      team_id: null,
    });
    setBranches([]);
    setSections([]);
    setTeams([]);
    
    if (selectedUnitId) {
      loadBranches(selectedUnitId);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBranchId = e.target.value ? Number(e.target.value) : null;
    setFormData({
      ...formData,
      branch_id: selectedBranchId,
      section_id: null,
      team_id: null,
    });
    setSections([]);
    setTeams([]);
    
    if (selectedBranchId) {
      loadSections(selectedBranchId);
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSectionId = e.target.value ? Number(e.target.value) : null;
    setFormData({
      ...formData,
      section_id: selectedSectionId,
      team_id: null,
    });
    setTeams([]);
    
    if (selectedSectionId) {
      loadTeams(selectedSectionId);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = e.target.value ? Number(e.target.value) : null;
    setFormData({
      ...formData,
      team_id: selectedTeamId,
    });
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
        // Use the most specific unit selected (team > section > branch > unit)
        const finalUnitId = formData.team_id || formData.section_id || formData.branch_id || formData.unit_id;
        
        const profileUpdateData: any = {
          id_number: formData.id_number,
          unit: finalUnitId,
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

          {formData.unit_id && (
            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                ענף
              </label>
              <select
                value={formData.branch_id || ''}
                onChange={handleBranchChange}
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר ענף --</option>
                {branches && Array.isArray(branches) && branches.length > 0 && branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name_he || branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.branch_id && (
            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                מדור
              </label>
              <select
                value={formData.section_id || ''}
                onChange={handleSectionChange}
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר מדור --</option>
                {sections && Array.isArray(sections) && sections.length > 0 && sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name_he || section.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.section_id && (
            <div>
              <label className="block text-right text-sm font-medium mb-2 text-gray-700">
                צוות
              </label>
              <select
                value={formData.team_id || ''}
                onChange={handleTeamChange}
                className="w-full px-4 py-2 border rounded-lg text-right"
              >
                <option value="">-- בחר צוות --</option>
                {teams && Array.isArray(teams) && teams.length > 0 && teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name_he || team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              onChange={(cityId) => setFormData({ ...formData, city_id: cityId })}
              placeholder="חפש עיר או ישוב..."
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

