import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';
import * as XLSX from 'xlsx';

export default function AvailabilityDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sendingAlert, setSendingAlert] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [lastAlert, setLastAlert] = useState<any>(null);
  const [sendingOTP, setSendingOTP] = useState<Set<number>>(new Set());
  const [sendingOTPToAll, setSendingOTPToAll] = useState<boolean>(false);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadUnits();
  }, [router]);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadData();
  }, [selectedUnit]);

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
      setProfile(profileData);
      setUserRole(profileData?.role || '');
      
      // Load all approved users with their profiles (backend already filters by manager's unit hierarchy)
      const usersRes = await api.listApprovedUsers();
      const allUsers = usersRes.data.results || usersRes.data || [];
      
      // Get today's date to check for today's reports
      const today = new Date().toISOString().split('T')[0];
      
      // Load reports to show availability status (filtered by selected unit, backend handles descendants)
      // Load reports from today to check who filled today
      const reportParams: any = { date: today };
      if (selectedUnit) {
        reportParams.unit = selectedUnit;
      }
      const reportsRes = await api.listReports(reportParams);
      const reports = reportsRes.data.results || reportsRes.data || [];
      
      // Create a map of user IDs who have filled reports today
      const usersWithReportToday = new Set();
      reports.forEach((report: any) => {
        if (report.date === today) {
          usersWithReportToday.add(report.user);
        }
      });
      
      // Show all users the manager can see
      // Report status will be based on reports filtered by selected unit (if any)
      // Users with reports in the filtered scope will show 'green', others will show 'red'
      const usersToShow = allUsers;
      
      // Merge user data with report status
      const usersWithStatus = usersToShow.map((user: any) => {
        const hasFilledReportToday = usersWithReportToday.has(user.id);
        
        return {
          user_id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          id_number: user.profile?.id_number,
          address: user.profile?.address,
          city: user.profile?.city_name_he || user.profile?.city_name,
          unit: user.profile?.unit ? {
            id: user.profile.unit,
            name: user.profile.unit_name,
            name_he: user.profile.unit_name
          } : null,
          status: hasFilledReportToday ? 'green' : 'red',
          has_filled_report: hasFilledReportToday,
          latest_report_date: hasFilledReportToday ? today : null,
        };
      });
      
      setUsers(usersWithStatus);
      setLastAlert(null); // TODO: Load last alert if available
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Prepare data for Excel export
      const excelData = users.map((user) => {
        const fullName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || '-';
        
        return {
          'סטטוס': user.status === 'green' ? 'מילא דוח' : 'לא מילא דוח',
          'שם משתמש': user.username || '-',
          'שם פרטי': user.first_name || '-',
          'שם משפחה': user.last_name || '-',
          'שם מלא': fullName,
          'אימייל': user.email || '-',
          'תעודת זהות': user.id_number || '-',
          'טלפון': user.phone || '-',
          'כתובת': user.address || '-',
          'עיר': user.city || '-',
          'יחידה': user.unit ? (user.unit.name_he || user.unit.name) : '-',
          'תאריך דוח אחרון': user.latest_report_date 
            ? new Date(user.latest_report_date).toLocaleDateString('he-IL')
            : '-',
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'סטטוס זמינות');

      // Generate filename with date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const filename = `availability_status_${dateStr}_${timeStr}.xlsx`;

      // Export to file
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('שגיאה בייצוא הדוחות');
    }
  };

  const handleSendAlert = async () => {
    if (!confirm('האם אתה בטוח שברצונך לשלוח התרעה לכל המשתמשים במערכת?')) {
      return;
    }

    setSendingAlert(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const homeLink = `${baseUrl}/home`;
      
      // Debug: log user role
      console.log('Sending alert as role:', userRole);
      
      const response = await api.sendAlert({
        subject: 'הופעל נוהל ירוק בעיניים',
        message: `הופעל נוהל ירוק בעיניים, נא למלא סטטוס זמינות\n\nקישור לעמוד הבית: ${homeLink}`,
        unit_id: null, // Send to all users
        send_to: ['all'] // Send to all users
      });
      
      alert(`התרעה נשלחה בהצלחה ל-${response.data.recipients_count} משתמשים`);
      // Reload data to show updated status
      loadData();
    } catch (err: any) {
      console.error('Failed to send alert:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.message || 'שגיאה בשליחת ההתרעה';
      alert(`שגיאה בשליחת ההתרעה: ${errorMsg}`);
    } finally {
      setSendingAlert(false);
    }
  };

  const handleSendOTP = async (userEmail: string, userId: number) => {
    if (!confirm(`האם אתה בטוח שברצונך לשלוח קוד OTP למשתמש ${userEmail}?`)) {
      return;
    }

    setSendingOTP(prev => new Set(prev).add(userId));
    try {
      await api.requestOTP({ email: userEmail });
      alert(`קוד OTP נשלח בהצלחה ל-${userEmail}`);
    } catch (err: any) {
      // Only log full error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send OTP:', err);
      }
      
      let errorMsg = 'שגיאה בשליחת קוד OTP';
      
      // Handle network errors (connection refused, timeout, etc.)
      if (!err.response) {
        const errorCode = err.code || '';
        const errMessage = err.message || '';
        
        if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_CONNECTION_REFUSED' || 
            errMessage.includes('CONNECTION_REFUSED') || errMessage.includes('Network Error')) {
          errorMsg = 'לא ניתן להתחבר לשרת. אנא ודא שהשרת פועל ונסה שוב.';
        } else if (errMessage.includes('timeout') || errorCode.includes('TIMEOUT')) {
          errorMsg = 'פג תוקף החיבור. אנא נסה שוב.';
        } else {
          errorMsg = 'שגיאת חיבור. אנא ודא שהשרת פועל ונסה שוב.';
        }
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.email) {
        const emailError = Array.isArray(err.response.data.email) 
          ? err.response.data.email[0] 
          : err.response.data.email;
        errorMsg = typeof emailError === 'string' ? emailError : 'שגיאה בשליחת קוד OTP';
      }
      
      alert(`שגיאה בשליחת קוד OTP: ${errorMsg}`);
    } finally {
      setSendingOTP(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSendOTPToAll = async () => {
    const usersWithoutReports = users.filter(u => !u.has_filled_report);
    
    if (usersWithoutReports.length === 0) {
      alert('כל המשתמשים מילאו דוח. אין צורך לשלוח קוד OTP.');
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך לשלוח קוד OTP ל-${usersWithoutReports.length} משתמשים שלא מילאו דוח?`)) {
      return;
    }

    setSendingOTPToAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithoutReports) {
      try {
        await api.requestOTP({ email: user.email });
        successCount++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err: any) {
        console.error(`Failed to send OTP to ${user.email}:`, err);
        failCount++;
      }
    }

    alert(`קוד OTP נשלח ל-${successCount} משתמשים${failCount > 0 ? `. ${failCount} נכשלו` : ''}`);
    setSendingOTPToAll(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRowColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-50 hover:bg-green-100';
      case 'red':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const getStatusText = (status: string, hasFilled: boolean) => {
    if (status === 'green') {
      return 'מילא דוח';
    } else if (status === 'red') {
      return 'לא מילא דוח';
    } else {
      return hasFilled ? 'מילא דוח' : 'לא מילא דוח';
    }
  };

  // Filter units by type for dropdown
  const branches = units.filter(u => u.unit_type === 'branch');
  const sections = units.filter(u => u.unit_type === 'section');
  const teams = units.filter(u => u.unit_type === 'team');

  if (loading) {
    return <div className="p-8 text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">דשבורד זמינות</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {showSidebar ? 'הסתר תפריט' : 'הצג תפריט'}
              </button>
              {(userRole === 'system_manager' || userRole === 'unit_manager' || userRole === 'admin') && (
                <>
                  <button
                    onClick={handleSendAlert}
                    disabled={sendingAlert}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingAlert ? 'שולח...' : 'שלח התרעה'}
                  </button>
                  <button
                    onClick={handleSendOTPToAll}
                    disabled={sendingOTPToAll}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingOTPToAll ? 'שולח OTP...' : 'שלח OTP ללא מילאו דוח'}
                  </button>
                </>
              )}
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ייצוא לאקסל
              </button>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm font-medium text-gray-700">סינון לפי יחידה:</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">כל היחידות</option>
              {branches.length > 0 && (
                <optgroup label="ענפים">
                  {branches.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name_he || unit.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {sections.length > 0 && (
                <optgroup label="מדורים">
                  {sections.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name_he || unit.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {teams.length > 0 && (
                <optgroup label="צוותים">
                  {teams.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name_he || unit.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {selectedUnit && (
              <button
                onClick={() => setSelectedUnit('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                נקה סינון
              </button>
            )}
          </div>
          {lastAlert && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>התרעה אחרונה:</strong> {lastAlert.subject} - {new Date(lastAlert.sent_at).toLocaleString('he-IL')}
              </p>
            </div>
          )}
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">סה"כ משתמשים</span>
              <span className="text-2xl font-bold text-gray-800">{users.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">מילאו דוח</span>
              <span className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'green').length}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">לא מילאו דוח</span>
              <span className="text-2xl font-bold text-red-600">
                {users.filter(u => u.status === 'red').length}
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-right">סטטוס דוחות זמינות</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תעודת זהות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפון</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">כתובת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">עיר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך דוח אחרון</th>
                  {(userRole === 'system_manager' || userRole === 'unit_manager' || userRole === 'admin') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const fullName = user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.username || '-';
                  
                  return (
                    <tr 
                      key={user.user_id} 
                      className={`transition-colors ${getRowColor(user.status)}`}
                    >
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status, user.has_filled_report)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{fullName}</td>
                      <td className="px-6 py-4 text-right">{user.id_number || '-'}</td>
                      <td className="px-6 py-4 text-right">{user.phone || '-'}</td>
                      <td className="px-6 py-4 text-right">{user.address || '-'}</td>
                      <td className="px-6 py-4 text-right">{user.city || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        {user.unit ? (user.unit.name_he || user.unit.name) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.latest_report_date 
                          ? new Date(user.latest_report_date).toLocaleDateString('he-IL')
                          : '-'}
                      </td>
                      {(userRole === 'system_manager' || userRole === 'unit_manager' || userRole === 'admin') && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSendOTP(user.email, user.user_id)}
                            disabled={sendingOTP.has(user.user_id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="שלח קוד OTP למשתמש"
                          >
                            {sendingOTP.has(user.user_id) ? 'שולח...' : 'שלח OTP'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-gray-500">אין משתמשים להצגה</div>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />
    </div>
  );
}
