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
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
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

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.getProfile();
      const profileData = profileRes.data.profile;
      setUserRole(profileData?.role || '');

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

  const openRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const openUserEdit = (user: any) => {
    setSelectedUser(user);
    setEditingRole(user.profile?.role || 'user');
    setEditingUnitId(user.profile?.unit?.id || null);
    setShowUserEdit(true);
  };

  const handleApprove = async (id: number, role?: string, unitId?: number) => {
    try {
      await api.approveAccessRequest(id, role, unitId);
      setShowRequestDetails(false);
      setSelectedRequest(null);
      loadData();
      alert('הבקשה אושרה בהצלחה');
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה באישור הבקשה');
    }
  };

  const handleReject = async (id: number, reason: string) => {
    if (!reason || !reason.trim()) {
      alert('אנא הזן סיבת דחייה');
      return;
    }
    try {
      await api.rejectAccessRequest(id, reason);
      setShowRequestDetails(false);
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />
      
      <div className={`transition-all duration-300 ${showSidebar ? 'mr-80' : 'mr-0'}`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">ניהול הרשאות</h1>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 text-right">בקשות ממתינות</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2 text-right">{accessRequests.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 text-right">משתמשים מאושרים</h3>
              <p className="text-3xl font-bold text-green-600 mt-2 text-right">{approvedUsers.length}</p>
            </div>
          </div>

          {/* Pending Access Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">בקשות חדשות ממתינות לאישור</h2>
            </div>
            <div className="overflow-x-auto">
              {accessRequests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  אין בקשות ממתינות
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
                      <tr key={request.id}>
                        <td className="px-6 py-4 text-right">{request.user_username || request.user?.username}</td>
                        <td className="px-6 py-4 text-right">{request.user_email || request.user?.email}</td>
                        <td className="px-6 py-4 text-right">
                          {request.user?.first_name} {request.user?.last_name}
                        </td>
                        <td className="px-6 py-4 text-right">{request.user?.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {new Date(request.submitted_at).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openRequestDetails(request)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            פרטים ואישור
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Approved Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">משתמשים מאושרים - ניהול הרשאות</h2>
            </div>
            <div className="overflow-x-auto">
              {approvedUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  אין משתמשים מאושרים
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם משתמש</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תפקיד</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-right">{user.username}</td>
                        <td className="px-6 py-4 text-right">{user.email}</td>
                        <td className="px-6 py-4 text-right">
                          {roles.find(r => r.value === user.profile?.role)?.label || user.profile?.role || 'משתמש'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.profile?.unit?.name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openUserEdit(user)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            ערוך הרשאות
                          </button>
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

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">פרטי בקשה</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משתמש:</label>
                <p className="text-right">{selectedRequest.user_username || selectedRequest.user?.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל:</label>
                <p className="text-right">{selectedRequest.user_email || selectedRequest.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם מלא:</label>
                <p className="text-right">
                  {selectedRequest.user?.first_name} {selectedRequest.user?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון:</label>
                <p className="text-right">{selectedRequest.user?.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">תאריך בקשה:</label>
                <p className="text-right">
                  {new Date(selectedRequest.submitted_at).toLocaleString('he-IL')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">תפקיד:</label>
                <select
                  id="request-role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  defaultValue={selectedRequest.user?.profile?.role || 'user'}
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
                  id="request-unit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                  defaultValue={selectedRequest.user?.profile?.unit?.id || ''}
                >
                  <option value="">ללא יחידה</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    const role = (document.getElementById('request-role') as HTMLSelectElement)?.value;
                    const unitId = (document.getElementById('request-unit') as HTMLSelectElement)?.value;
                    handleApprove(selectedRequest.id, role, unitId ? Number(unitId) : undefined);
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  אשר
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('סיבת דחייה:');
                    if (reason) handleReject(selectedRequest.id, reason);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  דחה
                </button>
                <button
                  onClick={() => {
                    setShowRequestDetails(false);
                    setSelectedRequest(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserEdit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">עריכת הרשאות משתמש</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם משתמש:</label>
                <p className="text-right">{selectedUser.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">אימייל:</label>
                <p className="text-right">{selectedUser.email}</p>
              </div>
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
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  onClick={handleUpdateUserPermissions}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
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

