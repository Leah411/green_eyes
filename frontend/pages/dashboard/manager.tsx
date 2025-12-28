import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import Cookies from 'js-cookie';

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userUnit, setUserUnit] = useState<any>(null);
  const [alertData, setAlertData] = useState({
    subject: '',
    message: '',
    unit_id: null as number | null,
    send_to: ['all'] as string[],
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
      const [profileRes, reportsRes, requestsRes] = await Promise.all([
        api.getProfile(),
        api.listReports(),
        api.listAccessRequests({ status: 'pending' }),
      ]);
      
      const profile = profileRes.data.profile;
      setUserRole(profile?.role || '');
      setUserUnit(profile?.unit);
      
      // Filter reports based on role
      let filteredReports = reportsRes.data.results || reportsRes.data || [];
      if (profile?.role === 'branch_manager' && profile?.unit) {
        // Only show reports from their branch and below
        filteredReports = filteredReports.filter((r: any) => {
          const reportUnit = r.user?.profile?.unit;
          return reportUnit && (reportUnit.id === profile.unit.id || 
                 isDescendant(reportUnit, profile.unit));
        });
      } else if (profile?.role === 'section_manager' && profile?.unit) {
        filteredReports = filteredReports.filter((r: any) => {
          const reportUnit = r.user?.profile?.unit;
          return reportUnit && (reportUnit.id === profile.unit.id || 
                 isDescendant(reportUnit, profile.unit));
        });
      } else if (profile?.role === 'team_manager' && profile?.unit) {
        filteredReports = filteredReports.filter((r: any) => {
          const reportUnit = r.user?.profile?.unit;
          return reportUnit?.id === profile.unit.id;
        });
      }
      // system_manager and unit_manager see all
      
      setReports(filteredReports);
      setAccessRequests(requestsRes.data.results || requestsRes.data || []);
      
      // Load users if system_manager or unit_manager
      if (['system_manager', 'unit_manager'].includes(profile?.role)) {
        try {
          const usersRes = await api.listReports(); // This will get users through reports
          // Extract unique users from reports
          const uniqueUsers = new Map();
          filteredReports.forEach((r: any) => {
            if (r.user && !uniqueUsers.has(r.user.id)) {
              uniqueUsers.set(r.user.id, r.user);
            }
          });
          setUsers(Array.from(uniqueUsers.values()));
        } catch (err) {
          console.error('Failed to load users:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDescendant = (unit: any, parentUnit: any): boolean => {
    if (!unit || !parentUnit) return false;
    let current = unit.parent;
    while (current) {
      if (current.id === parentUnit.id) return true;
      current = current.parent;
    }
    return false;
  };

  const handleApprove = async (id: number, role?: string, unitId?: number) => {
    try {
      await api.approveAccessRequest(id);
      if (role && unitId) {
        // TODO: Update user role and unit via API
      }
      setShowRequestDetails(false);
      setSelectedRequest(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה באישור');
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await api.rejectAccessRequest(id, reason);
      setShowRequestDetails(false);
      setSelectedRequest(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בדחייה');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.exportReports();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `דוחות_זמינות_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('שגיאה בייצוא הדוחות');
    }
  };

  const handleSendEmergencyAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add link to availability report page
      const reportLink = `${window.location.origin}/home`;
      const messageWithLink = `${alertData.message}\n\nקישור למלא דוח זמינות: ${reportLink}`;
      
      await api.sendAlert({
        ...alertData,
        message: messageWithLink,
        subject: `[חירום] ${alertData.subject}`,
      });
      setShowAlertForm(false);
      setAlertData({ subject: '', message: '', unit_id: null, send_to: ['all'] });
      alert('התראת חירום נשלחה בהצלחה!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בשליחת התראה');
    }
  };

  const openRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  if (loading) {
    return <div className="p-8 text-center" dir="rtl">טוען...</div>;
  }

  const canManageOrg = ['system_manager', 'unit_manager'].includes(userRole);
  const canManageRequests = ['system_manager', 'unit_manager'].includes(userRole);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">דשבורד ניהול</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              עמוד בית
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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 text-right">אישורים ממתינים</h3>
            <p className="text-3xl font-bold text-green-600 mt-2 text-right">{accessRequests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 text-right">דוחות זמינות</h3>
            <p className="text-3xl font-bold text-green-600 mt-2 text-right">{reports.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 text-right">משתמשים</h3>
            <p className="text-3xl font-bold text-green-600 mt-2 text-right">{users.length || '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setShowAlertForm(!showAlertForm)}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-semibold"
            >
              התראת חירום
            </button>
          </div>
        </div>

        {/* Emergency Alert Form */}
        {showAlertForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-right">שלח התראת חירום</h2>
            <form onSubmit={handleSendEmergencyAlert} className="space-y-4">
              <div>
                <label className="block text-right text-sm font-medium mb-1">נושא</label>
                <input
                  type="text"
                  value={alertData.subject}
                  onChange={(e) => setAlertData({ ...alertData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                  placeholder="נושא ההתראה"
                />
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">הודעה</label>
                <textarea
                  value={alertData.message}
                  onChange={(e) => setAlertData({ ...alertData, message: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                  rows={4}
                  placeholder="הודעת החירום (קישור יוסף אוטומטית)"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAlertForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  שלח התראת חירום
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Access Requests - Only for system_manager and unit_manager */}
        {canManageRequests && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-right">ניהול בקשות גישה</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">משתמש</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 text-right">{request.user_username || request.user?.username}</td>
                      <td className="px-6 py-4 text-right">{request.user_email || request.user?.email}</td>
                      <td className="px-6 py-4 text-right">
                        {new Date(request.submitted_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openRequestDetails(request)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          פרטים
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accessRequests.length === 0 && (
                <div className="p-8 text-center text-gray-500">אין בקשות ממתינות</div>
              )}
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {showRequestDetails && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
              <h2 className="text-2xl font-bold mb-4 text-right">פרטי בקשה</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">שם פרטי:</label>
                  <p className="mt-1 text-right">{selectedRequest.user_first_name || selectedRequest.user?.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">שם משפחה:</label>
                  <p className="mt-1 text-right">{selectedRequest.user_last_name || selectedRequest.user?.last_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">תעודת זהות:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_id_number || selectedRequest.user?.profile?.id_number || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">שם איש קשר:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_contact_name || selectedRequest.user?.profile?.contact_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">כתובת מגורים:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_address || selectedRequest.user?.profile?.address || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">יחידה:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_unit_name_he || selectedRequest.profile_unit_name || selectedRequest.user?.profile?.unit_name_he || selectedRequest.user?.profile?.unit_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">ענף:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_branch_name_he || selectedRequest.profile_branch_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">צוות:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_team_name_he || selectedRequest.profile_team_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">מדור:</label>
                  <p className="mt-1 text-right">{selectedRequest.profile_section_name_he || selectedRequest.profile_section_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">טלפון:</label>
                  <p className="mt-1 text-right">{selectedRequest.user_phone || selectedRequest.user?.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">אימייל:</label>
                  <p className="mt-1 text-right">{selectedRequest.user_email || selectedRequest.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right">תאריך הגשה:</label>
                  <p className="mt-1 text-right">{new Date(selectedRequest.submitted_at).toLocaleString('he-IL')}</p>
                </div>
                
                {/* Role Selection */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-right">הגדר הרשאות:</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-right">תפקיד:</label>
                      <select
                        id="request-role"
                        className="w-full px-4 py-2 border rounded-lg text-right mt-1"
                        defaultValue="user"
                      >
                        <option value="user">משתמש רגיל</option>
                        <option value="team_manager">מנהל צוות</option>
                        <option value="section_manager">מנהל מדור</option>
                        <option value="branch_manager">מנהל ענף</option>
                        <option value="unit_manager">מנהל יחידה</option>
                        {userRole === 'system_manager' && <option value="system_manager">מנהל מערכת</option>}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    onClick={() => {
                      const role = (document.getElementById('request-role') as HTMLSelectElement)?.value;
                      handleApprove(selectedRequest.id, role, undefined);
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

        {/* Reports */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-right">דוחות זמינות</h2>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ייצוא לאקסל
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">משתמש</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מיקום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 text-right">{report.user_username || report.user?.username}</td>
                    <td className="px-6 py-4 text-right">{new Date(report.date).toLocaleDateString('he-IL')}</td>
                    <td className="px-6 py-4 text-right">{report.location_name || '-'}</td>
                    <td className="px-6 py-4 text-right">{report.status_display || report.status}</td>
                    <td className="px-6 py-4 text-right">{report.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="p-8 text-center text-gray-500">אין דוחות</div>
            )}
          </div>
        </div>

        {/* Organizational Structure Management - Only for system_manager and unit_manager */}
        {canManageOrg && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-right">ניהול מבנה ארגוני</h2>
                <button
                  onClick={() => router.push('/admin/organizational-structure')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  ניהול מבנה
                </button>
              </div>
              <p className="text-gray-600 text-right">ניהול יחידות, ענפים, מדורים וצוותים</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-right">ניהול מילואים</h2>
                <button
                  onClick={() => router.push('/admin/reserves')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  ניהול מילואים
                </button>
              </div>
              <p className="text-gray-600 text-right">ניהול תקופות מילואים וספירת ימים</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
