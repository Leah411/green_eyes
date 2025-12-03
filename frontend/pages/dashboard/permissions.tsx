import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';

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
  const [locations, setLocations] = useState<any[]>([]);
  
  // For request form
  const [requestRole, setRequestRole] = useState<string>('user');
  const [requestUnitId, setRequestUnitId] = useState<number | null>(null);
  
  // For user edit
  const [editingRole, setEditingRole] = useState<string>('');
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);

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

  const openUserEdit = (user: any) => {
    setSelectedUser(user);
    setEditingRole(user.profile?.role || 'user');
    setEditingUnitId(user.profile?.unit || null);
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
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">ניהול משתמשים</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {showSidebar ? 'הסתר תפריט' : 'הצג תפריט'}
              </button>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם משתמש</th>
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
                        <td className="px-6 py-4 text-right">{request.user_username || request.user?.username}</td>
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
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            בקשה חדשה
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
              <h2 className="text-xl font-semibold text-right">רשימת המשתמשים הקיימים במערכת</h2>
            </div>
            <div className="overflow-x-auto">
              {approvedUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  אין משתמשים במערכת
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם משתמש</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מלא</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תפקיד</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-right">{user.username}</td>
                        <td className="px-6 py-4 text-right">{user.email}</td>
                        <td className="px-6 py-4 text-right">
                          {user.first_name || ''} {user.last_name || ''}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {roles.find(r => r.value === user.profile?.role)?.label || user.profile?.role || 'משתמש'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.profile?.unit_name || user.profile?.unit?.name || '-'}
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
              )}
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
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_username || selectedRequest.user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user_email || selectedRequest.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם פרטי:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user?.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משפחה:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user?.last_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user?.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">תעודת זהות:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user?.profile?.id_number || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">כתובת:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedRequest.user?.profile?.address || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">עיר:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">
                    {selectedRequest.user?.profile?.city_name_he || selectedRequest.user?.profile?.city_name || '-'}
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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">יחידה:</label>
                  <select
                    value={requestUnitId || ''}
                    onChange={(e) => setRequestUnitId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">ללא יחידה</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name_he || unit.name}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">שינוי הרשאות משתמש</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משתמש:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל:</label>
                  <p className="text-right bg-gray-50 p-2 rounded">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-right mb-4">הגדרות הרשאות</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">תפקיד:</label>
                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">יחידה:</label>
                    <select
                      value={editingUnitId || ''}
                      onChange={(e) => setEditingUnitId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                    >
                      <option value="">ללא יחידה</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name_he || unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  onClick={handleUpdateUserPermissions}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
                >
                  שמור שינויים
                </button>
                <button
                  onClick={() => {
                    setShowUserEdit(false);
                    setSelectedUser(null);
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
    </div>
  );
}
