import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';
import SearchableLocationSelect from '../../components/SearchableLocationSelect';
import MenuIcon from '../../components/MenuIcon';

export default function PermissionsDashboard() {
  const router = useRouter();
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]); // All units for hierarchy display
  const [locations, setLocations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // For request form
  const [requestRole, setRequestRole] = useState<string>('user');
  const [requestUnitId, setRequestUnitId] = useState<number | null>(null);
  
  // For user edit
  const [editingRole, setEditingRole] = useState<string>('');
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserData, setEditingUserData] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city_id: null,
    role: '',
    unit_id: null,
  });
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const roles = [
    { value: 'user', label: 'משתמש' },
    { value: 'team_manager', label: 'מנהל צוות' },
    { value: 'section_manager', label: 'מנהל מדור' },
    { value: 'branch_manager', label: 'מנהל סניף' },
    { value: 'unit_manager', label: 'מנהל יחידה' },
    { value: 'system_manager', label: 'מנהל מערכת' },
  ];

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadData();
    loadUnits();
    loadAllUnits(); // Load all units for hierarchy display
    loadLocations();
  }, [router]);

  const loadUnits = async () => {
    try {
      const response = await api.listUnits();
      const unitsData = response.data.results || response.data || [];
      setUnits(unitsData);
    } catch (err) {
      console.error('Failed to load units:', err);
    }
  };

  const loadAllUnits = async () => {
    try {
      // Load all units with pagination for hierarchy display
      let allUnitsData: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await api.listUnits({ page, page_size: 1000 });
        const data = response.data.results || response.data || [];
        allUnitsData = [...allUnitsData, ...data];
        
        if (response.data.next && data.length > 0) {
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setAllUnits(allUnitsData);
    } catch (err) {
      console.error('Failed to load all units:', err);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await api.listLocations();
      const locationsData = response.data.results || response.data || [];
      setLocations(locationsData);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.getProfile();
      const profileData = profileRes.data.profile;
      const role = profileData?.role || '';
      setUserRole(role);

      // Check if user has permission (only system_manager and unit_manager)
      if (role !== 'system_manager' && role !== 'unit_manager') {
        alert('אין לך הרשאה לגשת לדף זה. רק מנהל מערכת ומנהל יחידה יכולים לגשת.');
        router.push('/home');
        return;
      }

      // Load pending access requests
      const requestsRes = await api.listAccessRequests({ status: 'pending' });
      setAccessRequests(requestsRes.data.results || requestsRes.data || []);

      // Load approved users
      const usersRes = await api.listApprovedUsers();
      setApprovedUsers(usersRes.data.results || usersRes.data || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 403) {
        alert('אין לך הרשאה לגשת לדף זה');
        router.push('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const openRequestForm = (request: any) => {
    setSelectedRequest(request);
    // Get user data from registration (stored in user and profile)
    setRequestRole(request.user?.profile?.role || 'user');
    setRequestUnitId(request.user?.profile?.unit || null);
    setShowRequestForm(true);
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

  const determineUnitHierarchy = async (unitId: number) => {
    try {
      const unitObj = allUnits.find(u => u.id === unitId);
      if (!unitObj) return;

      // Determine hierarchy level
      if (unitObj.unit_type === 'unit') {
        setSelectedUnitId(unitId);
        await loadBranches(unitId);
      } else if (unitObj.unit_type === 'branch') {
        const parentUnit = allUnits.find(u => u.id === unitObj.parent);
        if (parentUnit) {
          setSelectedUnitId(parentUnit.id);
          await loadBranches(parentUnit.id);
        }
        setSelectedBranchId(unitId);
        await loadSections(unitId);
      } else if (unitObj.unit_type === 'section') {
        const parentBranch = allUnits.find(u => u.id === unitObj.parent);
        if (parentBranch) {
          const parentUnit = allUnits.find(u => u.id === parentBranch.parent);
          if (parentUnit) {
            setSelectedUnitId(parentUnit.id);
            await loadBranches(parentUnit.id);
          }
          setSelectedBranchId(parentBranch.id);
          await loadSections(parentBranch.id);
        }
        setSelectedSectionId(unitId);
        await loadTeams(unitId);
      } else if (unitObj.unit_type === 'team') {
        const parentSection = allUnits.find(u => u.id === unitObj.parent);
        if (parentSection) {
          const parentBranch = allUnits.find(u => u.id === parentSection.parent);
          if (parentBranch) {
            const parentUnit = allUnits.find(u => u.id === parentBranch.parent);
            if (parentUnit) {
              setSelectedUnitId(parentUnit.id);
              await loadBranches(parentUnit.id);
            }
            setSelectedBranchId(parentBranch.id);
            await loadSections(parentBranch.id);
          }
          setSelectedSectionId(parentSection.id);
          await loadTeams(parentSection.id);
        }
        setSelectedTeamId(unitId);
      }
    } catch (err) {
      console.error('Failed to determine unit hierarchy:', err);
    }
  };

  const openUserEdit = async (user: any) => {
    setSelectedUser(user);
    setIsEditingUser(false);
    
    // Set initial editing data
    const profile = user.profile || {};
    const currentUnitId = typeof profile.unit === 'object' ? profile.unit.id : profile.unit;
    
    setEditingUserData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: profile.address || '',
      city_id: typeof profile.city === 'object' ? profile.city.id : profile.city || null,
      role: profile.role || 'user',
      unit_id: currentUnitId || null,
    });
    
    setEditingRole(profile.role || 'user');
    setEditingUnitId(currentUnitId || null);
    
    // Reset hierarchy
    setSelectedUnitId(null);
    setSelectedBranchId(null);
    setSelectedSectionId(null);
    setSelectedTeamId(null);
    setBranches([]);
    setSections([]);
    setTeams([]);
    
    // Determine unit hierarchy if unit exists
    if (currentUnitId) {
      await determineUnitHierarchy(currentUnitId);
    }
    
    setShowUserEdit(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      await api.approveAccessRequest(
        selectedRequest.id,
        requestRole,
        requestUnitId || undefined
      );
      
      setShowRequestForm(false);
      setSelectedRequest(null);
      loadData();
      alert('הבקשה אושרה בהצלחה');
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.response?.data?.error || 'שגיאה באישור הבקשה');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    const reason = prompt('אנא הזן סיבת דחייה:');
    if (!reason || !reason.trim()) {
      return;
    }
    try {
      await api.rejectAccessRequest(selectedRequest.id, reason);
      setShowRequestForm(false);
      setSelectedRequest(null);
      loadData();
      alert('הבקשה נדחתה');
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בדחיית הבקשה');
    }
  };

  const handleUnitChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnitId = e.target.value ? Number(e.target.value) : null;
    setSelectedUnitId(selectedUnitId);
    setSelectedBranchId(null);
    setSelectedSectionId(null);
    setSelectedTeamId(null);
    setBranches([]);
    setSections([]);
    setTeams([]);
    
    if (selectedUnitId) {
      await loadBranches(selectedUnitId);
    }
    
    setEditingUserData({ ...editingUserData, unit_id: selectedUnitId });
  };

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBranchId = e.target.value ? Number(e.target.value) : null;
    setSelectedBranchId(selectedBranchId);
    setSelectedSectionId(null);
    setSelectedTeamId(null);
    setSections([]);
    setTeams([]);
    
    if (selectedBranchId) {
      await loadSections(selectedBranchId);
    }
    
    setEditingUserData({ ...editingUserData, unit_id: selectedBranchId });
  };

  const handleSectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSectionId = e.target.value ? Number(e.target.value) : null;
    setSelectedSectionId(selectedSectionId);
    setSelectedTeamId(null);
    setTeams([]);
    
    if (selectedSectionId) {
      await loadTeams(selectedSectionId);
    }
    
    setEditingUserData({ ...editingUserData, unit_id: selectedSectionId });
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = e.target.value ? Number(e.target.value) : null;
    setSelectedTeamId(selectedTeamId);
    setEditingUserData({ ...editingUserData, unit_id: selectedTeamId });
  };

  const handleUpdateUserPermissions = async () => {
    if (!selectedUser) return;
    try {
      await api.updateUserPermissions(selectedUser.id, {
        role: editingRole,
        unit_id: editingUnitId,
      });
      
      setShowUserEdit(false);
      setSelectedUser(null);
      loadData();
      alert('הרשאות המשתמש עודכנו בהצלחה');
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בעדכון ההרשאות');
    }
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser || !selectedUser.profile) return;
    
    // Validate required fields
    if (!editingUserData.first_name || !editingUserData.last_name || 
        !editingUserData.email || !editingUserData.phone) {
      alert('כל השדות המסומנים ב-* חייבים להיות ממולאים');
      return;
    }

    try {
      // Determine the final unit ID (most specific selection)
      const finalUnitId = selectedTeamId || selectedSectionId || selectedBranchId || selectedUnitId;
      
      const updateData: any = {
        first_name: editingUserData.first_name,
        last_name: editingUserData.last_name,
        email: editingUserData.email,
        phone: editingUserData.phone,
        address: editingUserData.address,
        city: editingUserData.city_id,
        role: editingUserData.role,
        unit: finalUnitId,
      };
      
      await api.updateUser(selectedUser.id, selectedUser.profile.id, updateData);
      
      setIsEditingUser(false);
      setShowUserEdit(false);
      setSelectedUser(null);
      loadData();
      alert('פרטי המשתמש עודכנו בהצלחה');
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          alert(errorData);
        } else if (errorData.error) {
          alert(errorData.error);
        } else {
          const firstError = Object.values(errorData)[0];
          alert(Array.isArray(firstError) ? firstError[0] : String(firstError));
        }
      } else {
        alert('שגיאה בעדכון פרטי המשתמש');
      }
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${username}? פעולה זו אינה הפיכה.`)) {
      return;
    }
    try {
      await api.deleteUser(userId);
      loadData();
      alert('המשתמש נמחק בהצלחה');
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה במחיקת המשתמש');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-xl text-gray-600">טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Menu Icon */}
      <MenuIcon onClick={() => setShowSidebar(!showSidebar)} isOpen={showSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">ניהול משתמשים</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/manager')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                חזרה לדשבורד
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Top Section - Access Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">בקשות כניסה</h2>
            </div>
            <div className="overflow-x-auto">
              {accessRequests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  אין בקשות חדשות
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מלא</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפון</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך בקשה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accessRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-right">{request.user_email || request.user?.email}</td>
                        <td className="px-6 py-4 text-right">
                          {request.user?.first_name || ''} {request.user?.last_name || ''}
                        </td>
                        <td className="px-6 py-4 text-right">{request.user?.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {new Date(request.submitted_at).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openRequestForm(request)}
                            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                          >
                            אישור בקשה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Bottom Section - Existing Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-right">רשימת המשתמשים הקיימים במערכת</h2>
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="חפש משתמש..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                const filteredUsers = approvedUsers.filter((user) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  const username = (user.username || '').toLowerCase();
                  const email = (user.email || '').toLowerCase();
                  const firstName = (user.first_name || '').toLowerCase();
                  const lastName = (user.last_name || '').toLowerCase();
                  const fullName = `${firstName} ${lastName}`.toLowerCase();
                  const role = (roles.find(r => r.value === user.profile?.role)?.label || user.profile?.role || '').toLowerCase();
                  const unitName = (user.profile?.unit_name || user.profile?.unit?.name || '').toLowerCase();
                  
                  return (
                    username.includes(query) ||
                    email.includes(query) ||
                    firstName.includes(query) ||
                    lastName.includes(query) ||
                    fullName.includes(query) ||
                    role.includes(query) ||
                    unitName.includes(query)
                  );
                });

                if (filteredUsers.length === 0) {
                  return (
                <div className="p-6 text-center text-gray-500">
                      {searchQuery ? 'לא נמצאו משתמשים התואמים לחיפוש' : 'אין משתמשים במערכת'}
                </div>
                  );
                }

                return (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מלא</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תפקיד</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-right">{user.email}</td>
                        <td 
                          className="px-6 py-4 text-right cursor-pointer hover:text-green-600 hover:underline"
                          onClick={() => openUserEdit(user)}
                        >
                          {user.first_name || ''} {user.last_name || ''}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {roles.find(r => r.value === user.profile?.role)?.label || user.profile?.role || 'משתמש'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(() => {
                            const unitId = user.profile?.unit;
                            if (!unitId) return '-';
                            
                            // Get unit ID (can be number or object)
                            const actualUnitId = typeof unitId === 'object' ? unitId.id : unitId;
                            if (!actualUnitId) return user.profile?.unit_name || '-';
                            
                            // Find unit in allUnits
                            const unitObj = allUnits.find(u => u.id === actualUnitId);
                            if (!unitObj) return user.profile?.unit_name || user.profile?.unit?.name || '-';
                            
                            // Build hierarchy path: unit > branch > section > team
                            const getUnitPath = (unit: any): string[] => {
                              const path: string[] = [];
                              let current = unit;
                              
                              // Collect all ancestors
                              while (current) {
                                const name = current.name_he || current.name;
                                path.unshift(name); // Add to beginning
                                
                                if (current.parent) {
                                  const parentId = typeof current.parent === 'object' 
                                    ? current.parent.id 
                                    : current.parent;
                                  current = allUnits.find(u => u.id === parentId);
                                } else {
                                  current = null;
                                }
                              }
                              
                              return path;
                            };
                            
                            const path = getUnitPath(unitObj);
                            return path.length > 0 ? path.join(' > ') : (user.profile?.unit_name || user.profile?.unit?.name || '-');
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openUserEdit(user)}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                              שינוי הרשאות
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                              title="מחק משתמש"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                );
              })()}
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />

      {/* Request Form Modal */}
      {showRequestForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">פרטי המשתמש החדש</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Display user registration data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משתמש:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_username || selectedRequest.user?.username || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_email || selectedRequest.user?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם פרטי:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_first_name || selectedRequest.user?.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משפחה:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_last_name || selectedRequest.user?.last_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_phone || selectedRequest.user?.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">כתובת:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.profile_address || selectedRequest.user?.profile?.address || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">עיר:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">
                    {selectedRequest.profile_city_name_he || selectedRequest.profile_city_name || selectedRequest.user?.profile?.city_name_he || selectedRequest.user?.profile?.city_name || selectedRequest.user?.profile?.city?.name_he || selectedRequest.user?.profile?.city?.name || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם איש קשר:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.profile_contact_name || selectedRequest.user?.profile?.contact_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון איש קשר:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.profile_contact_phone || selectedRequest.user?.profile?.contact_phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">תאריך בקשה:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">
                    {selectedRequest.submitted_at ? new Date(selectedRequest.submitted_at).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">יחידה נוכחית:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">
                    {selectedRequest.profile_unit_name_he || selectedRequest.profile_unit_name || selectedRequest.user?.profile?.unit_name || selectedRequest.user?.profile?.unit?.name_he || selectedRequest.user?.profile?.unit?.name || '-'}
                  </p>
                </div>
              </div>
              
              {/* Permission level dropdown */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-right mb-4">רמת הרשאה</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">תפקיד:</label>
                  <select
                    value={requestRole}
                    onChange={(e) => setRequestRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  onClick={handleApproveRequest}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
                >
                  אשר
                </button>
                <button
                  onClick={handleRejectRequest}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold"
                >
                  דחה בקשה
                </button>
                <button
                  onClick={() => {
                    setShowRequestForm(false);
                    setSelectedRequest(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserEdit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">פרטי המשתמש</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משתמש:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל {!isEditingUser && <span className="text-red-500">*</span>}:</label>
                  {isEditingUser ? (
                    <input
                      type="email"
                      value={editingUserData.email}
                      onChange={(e) => setEditingUserData({ ...editingUserData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      required
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם פרטי {!isEditingUser && <span className="text-red-500">*</span>}:</label>
                  {isEditingUser ? (
                    <input
                      type="text"
                      value={editingUserData.first_name}
                      onChange={(e) => setEditingUserData({ ...editingUserData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      required
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.first_name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משפחה {!isEditingUser && <span className="text-red-500">*</span>}:</label>
                  {isEditingUser ? (
                    <input
                      type="text"
                      value={editingUserData.last_name}
                      onChange={(e) => setEditingUserData({ ...editingUserData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      required
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.last_name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון {!isEditingUser && <span className="text-red-500">*</span>}:</label>
                  {isEditingUser ? (
                    <input
                      type="tel"
                      value={editingUserData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setEditingUserData({ ...editingUserData, phone: value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      maxLength={10}
                      required
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">כתובת:</label>
                  {isEditingUser ? (
                    <input
                      type="text"
                      value={editingUserData.address}
                      onChange={(e) => setEditingUserData({ ...editingUserData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.profile?.address || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">עיר:</label>
                  {isEditingUser ? (
                    <SearchableLocationSelect
                      value={editingUserData.city_id}
                      onChange={(cityId) => setEditingUserData({ ...editingUserData, city_id: cityId })}
                      placeholder="חפש עיר או ישוב..."
                    />
                  ) : (
                    <p className="text-right bg-gray-50 p-2 rounded">
                      {selectedUser.profile?.city_name_he || selectedUser.profile?.city_name || selectedUser.profile?.city?.name_he || selectedUser.profile?.city?.name || '-'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-right mb-4">הגדרות הרשאות</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">תפקיד:</label>
                    {isEditingUser ? (
                      <select
                        value={editingUserData.role}
                        onChange={(e) => setEditingUserData({ ...editingUserData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-right bg-gray-50 p-2 rounded">
                        {roles.find(r => r.value === selectedUser.profile?.role)?.label || selectedUser.profile?.role || 'משתמש'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">יחידה:</label>
                    {isEditingUser ? (
                      <div className="space-y-2">
                        <select
                          value={selectedUnitId || ''}
                          onChange={handleUnitChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                        >
                          <option value="">-- בחר יחידה --</option>
                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name_he || unit.name}
                            </option>
                          ))}
                        </select>
                        {selectedUnitId && (
                          <select
                            value={selectedBranchId || ''}
                            onChange={handleBranchChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                          >
                            <option value="">-- בחר ענף --</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name_he || branch.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedBranchId && (
                          <select
                            value={selectedSectionId || ''}
                            onChange={handleSectionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                          >
                            <option value="">-- בחר מדור --</option>
                            {sections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name_he || section.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedSectionId && (
                          <select
                            value={selectedTeamId || ''}
                            onChange={handleTeamChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                          >
                            <option value="">-- בחר צוות --</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name_he || team.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <p className="text-right bg-gray-50 p-2 rounded">
                        {(() => {
                          const unitId = selectedUser.profile?.unit;
                          if (!unitId) return 'ללא יחידה';
                          
                          const actualUnitId = typeof unitId === 'object' ? unitId.id : unitId;
                          if (!actualUnitId) return selectedUser.profile?.unit_name || selectedUser.profile?.unit?.name_he || selectedUser.profile?.unit?.name || 'ללא יחידה';
                          
                          const unitObj = allUnits.find(u => u.id === actualUnitId);
                          if (!unitObj) return selectedUser.profile?.unit_name || selectedUser.profile?.unit?.name_he || selectedUser.profile?.unit?.name || 'ללא יחידה';
                          
                          const getUnitPath = (unit: any): string[] => {
                            const path: string[] = [];
                            let current = unit;
                            
                            while (current) {
                              const name = current.name_he || current.name;
                              path.unshift(name);
                              
                              if (current.parent) {
                                const parentId = typeof current.parent === 'object' 
                                  ? current.parent.id 
                                  : current.parent;
                                current = allUnits.find(u => u.id === parentId);
                              } else {
                                current = null;
                              }
                            }
                            
                            return path;
                          };
                          
                          const path = getUnitPath(unitObj);
                          return path.length > 0 ? path.join(' > ') : (selectedUser.profile?.unit_name || selectedUser.profile?.unit?.name_he || selectedUser.profile?.unit?.name || 'ללא יחידה');
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end pt-4 border-t">
                {!isEditingUser ? (
                  <>
                    <button
                      onClick={() => setIsEditingUser(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => {
                        setShowUserEdit(false);
                        setSelectedUser(null);
                        setIsEditingUser(false);
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                    >
                      סגור
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveUserEdit}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
                    >
                      שמור שינויים
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUser(false);
                        // Reset to original data
                        const profile = selectedUser.profile || {};
                        const currentUnitId = typeof profile.unit === 'object' ? profile.unit.id : profile.unit;
                        setEditingUserData({
                          first_name: selectedUser.first_name || '',
                          last_name: selectedUser.last_name || '',
                          email: selectedUser.email || '',
                          phone: selectedUser.phone || '',
                          address: profile.address || '',
                          city_id: typeof profile.city === 'object' ? profile.city.id : profile.city || null,
                          role: profile.role || 'user',
                          unit_id: currentUnitId || null,
                        });
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                    >
                      ביטול
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
