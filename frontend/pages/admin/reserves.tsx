import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';

interface ReserveRecord {
  id: number;
  user: any;
  start_date: string;
  end_date: string;
  days_count: number;
}

export default function ReservesManagement() {
  const router = useRouter();
  const [reserves, setReserves] = useState<ReserveRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: null as number | null,
    start_date: '',
    end_date: '',
  });
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadData();
  }, [router]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays);
    } else {
      setTotalDays(0);
    }
  }, [formData.start_date, formData.end_date]);

  const loadData = async () => {
    try {
      // TODO: Implement API endpoints for reserves
      // const [reservesRes, usersRes] = await Promise.all([
      //   api.listReserves(),
      //   api.listUsers(),
      // ]);
      // setReserves(reservesRes.data.results || []);
      // setUsers(usersRes.data.results || []);
      
      // Mock data for now
      setReserves([]);
      setUsers([]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.start_date || !formData.end_date) {
      alert('אנא מלא את כל השדות');
      return;
    }

    try {
      // TODO: Implement create reserve API
      // await api.createReserve(formData);
      setShowAddForm(false);
      setFormData({ user_id: null, start_date: '', end_date: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בשמירה');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;
    try {
      // TODO: Implement delete reserve API
      // await api.deleteReserve(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה במחיקה');
    }
  };

  const calculateTotalDays = () => {
    return reserves.reduce((sum, reserve) => sum + reserve.days_count, 0);
  };

  if (loading) {
    return <div className="p-8 text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">ניהול מילואים</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              הוסף מילואים
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-right">סיכום ימי מילואים</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{reserves.length}</div>
              <div className="text-sm text-gray-600">תקופות מילואים</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{calculateTotalDays()}</div>
              <div className="text-sm text-gray-600">סה"כ ימים</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reserves.length > 0 ? Math.round(calculateTotalDays() / reserves.length) : 0}
              </div>
              <div className="text-sm text-gray-600">ממוצע ימים לתקופה</div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-right">הוסף תקופת מילואים</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-right text-sm font-medium mb-1">משתמש</label>
                <select
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? Number(e.target.value) : null })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="">-- בחר משתמש --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-right text-sm font-medium mb-1">תאריך התחלה</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-right"
                  />
                </div>
                <div>
                  <label className="block text-right text-sm font-medium mb-1">תאריך סיום</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg text-right"
                  />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-right">
                  <strong>מספר ימים: {totalDays}</strong>
                </div>
              )}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ user_id: null, start_date: '', end_date: '' });
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reserves List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-right">רשימת מילואים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">משתמש</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך התחלה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך סיום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מספר ימים</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reserves.map((reserve) => (
                  <tr key={reserve.id}>
                    <td className="px-6 py-4 text-right">
                      {reserve.user?.username || reserve.user?.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {new Date(reserve.start_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {new Date(reserve.end_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 text-right">{reserve.days_count}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(reserve.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reserves.length === 0 && (
              <div className="p-8 text-center text-gray-500">אין רשומות מילואים</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}



