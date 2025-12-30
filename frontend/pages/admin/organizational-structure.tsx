import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';

export default function OrganizationalStructure() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_he: '',
    unit_type: 'unit',
    parent: null as number | null,
    code: '',
  });

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadUnits();
  }, [router]);

  const loadUnits = async () => {
    try {
      const response = await api.listUnits();
      setUnits(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        // TODO: Implement update unit API
        // await api.updateUnit(editingUnit.id, formData);
      } else {
        // TODO: Implement create unit API
        // await api.createUnit(formData);
      }
      setShowAddForm(false);
      setEditingUnit(null);
      setFormData({ name: '', name_he: '', unit_type: 'unit', parent: null, code: '' });
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בשמירה');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;
    try {
      // TODO: Implement delete unit API
      // await api.deleteUnit(id);
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה במחיקה');
    }
  };

  const buildTree = (units: any[], parentId: number | null = null): any[] => {
    return units
      .filter(unit => {
        if (parentId === null) return !unit.parent;
        return unit.parent === parentId;
      })
      .map(unit => ({
        ...unit,
        children: buildTree(units, unit.id),
      }));
  };

  const renderUnit = (unit: any, level: number = 0) => {
    const indent = level * 20;
    return (
      <div key={unit.id} className="mb-2" style={{ marginRight: `${indent}px` }}>
        <div className="bg-white border rounded p-4 flex justify-between items-center">
          <div>
            <div className="font-semibold">{unit.name}</div>
            {unit.name_he && <div className="text-sm text-gray-600">{unit.name_he}</div>}
            <div className="text-xs text-gray-500">
              {unit.unit_type === 'unit' && 'יחידה'}
              {unit.unit_type === 'branch' && 'ענף'}
              {unit.unit_type === 'section' && 'מדור'}
              {unit.unit_type === 'team' && 'צוות'}
              {unit.code && ` - ${unit.code}`}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingUnit(unit);
                setFormData({
                  name: unit.name,
                  name_he: unit.name_he || '',
                  unit_type: unit.unit_type,
                  parent: unit.parent || null,
                  code: unit.code || '',
                });
                setShowAddForm(true);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              ערוך
            </button>
            <button
              onClick={() => handleDelete(unit.id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              מחק
            </button>
          </div>
        </div>
        {unit.children && unit.children.map((child: any) => renderUnit(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center" dir="rtl">טוען...</div>;
  }

  const tree = buildTree(units);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">ניהול מבנה ארגוני</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/manager')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              חזרה
            </button>
            <button
              onClick={() => {
                setEditingUnit(null);
                setFormData({ name: '', name_he: '', unit_type: 'unit', parent: null, code: '' });
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              הוסף יחידה
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-right">
              {editingUnit ? 'ערוך יחידה' : 'הוסף יחידה חדשה'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-right text-sm font-medium mb-1">שם (עברית)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                />
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">שם (אנגלית)</label>
                <input
                  type="text"
                  value={formData.name_he}
                  onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                />
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">סוג</label>
                <select
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="unit">יחידה</option>
                  <option value="branch">ענף</option>
                  <option value="section">מדור</option>
                  <option value="team">צוות</option>
                </select>
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">יחידה אב</label>
                <select
                  value={formData.parent || ''}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                >
                  <option value="">-- ללא יחידה אב --</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">קוד יחידה</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-right"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUnit(null);
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-right">מבנה ארגוני</h2>
          {tree.map((unit) => renderUnit(unit))}
          {tree.length === 0 && (
            <div className="text-center text-gray-500 py-8">אין יחידות</div>
          )}
        </div>
      </main>
    </div>
  );
}



