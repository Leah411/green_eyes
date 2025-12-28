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
  const [editingName, setEditingName] = useState<number | null>(null);
  const [editingNameHe, setEditingNameHe] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedUnit, setDraggedUnit] = useState<any>(null);
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
        await api.updateUnit(editingUnit.id, formData);
      } else {
        await api.createUnit(formData);
      }
      setShowAddForm(false);
      setEditingUnit(null);
      setFormData({ name: '', name_he: '', unit_type: 'unit', parent: null, code: '' });
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'שגיאה בשמירה');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק? זה ימחק גם את כל הילדים של היחידה.')) return;
    try {
      await api.deleteUnit(id);
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'שגיאה במחיקה');
    }
  };

  const handleNameEdit = (unit: any, field: 'name' | 'name_he') => {
    if (field === 'name') {
      setEditingName(unit.id);
      setEditValue(unit.name);
    } else {
      setEditingNameHe(unit.id);
      setEditValue(unit.name_he || '');
    }
  };

  const handleNameSave = async (unit: any, field: 'name' | 'name_he') => {
    try {
      const updateData: any = {};
      updateData[field] = editValue;
      await api.updateUnit(unit.id, updateData);
      if (field === 'name') {
        setEditingName(null);
      } else {
        setEditingNameHe(null);
      }
      setEditValue('');
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'שגיאה בעדכון');
    }
  };

  const handleNameCancel = () => {
    setEditingName(null);
    setEditingNameHe(null);
    setEditValue('');
  };

  const handleDragStart = (e: React.DragEvent, unit: any) => {
    setDraggedUnit(unit);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetUnit: any) => {
    e.preventDefault();
    if (!draggedUnit || draggedUnit.id === targetUnit.id) {
      setDraggedUnit(null);
      return;
    }

    // Don't allow dropping on itself or its descendants
    const isDescendant = (parent: any, child: any): boolean => {
      if (!parent.children) return false;
      for (const c of parent.children) {
        if (c.id === child.id) return true;
        if (isDescendant(c, child)) return true;
      }
      return false;
    };

    if (isDescendant(draggedUnit, targetUnit)) {
      alert('לא ניתן להעביר יחידה לתוך אחת מהילדים שלה');
      setDraggedUnit(null);
      return;
    }

    try {
      // Update parent
      await api.updateUnit(draggedUnit.id, { parent: targetUnit.id });
      setDraggedUnit(null);
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'שגיאה בהעברה');
      setDraggedUnit(null);
    }
  };

  const handleReorder = async (unitId: number, newOrder: number, siblings: any[]) => {
    try {
      // Update order numbers for all siblings
      const updates = siblings.map((sibling, index) => {
        if (sibling.id === unitId) {
          return api.updateUnit(unitId, { order_number: newOrder });
        } else if (index >= newOrder) {
          return api.updateUnit(sibling.id, { order_number: index + 1 });
        } else {
          return api.updateUnit(sibling.id, { order_number: index });
        }
      });
      await Promise.all(updates);
      loadUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'שגיאה בסידור מחדש');
    }
  };

  const buildTree = (units: any[], parentId: number | null = null): any[] => {
    return units
      .filter(unit => {
        if (parentId === null) return !unit.parent;
        return unit.parent === parentId;
      })
      .sort((a, b) => {
        // Sort by order_number first, then by name
        if (a.order_number !== b.order_number) {
          return (a.order_number || 0) - (b.order_number || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      })
      .map(unit => ({
        ...unit,
        children: buildTree(units, unit.id),
      }));
  };

  const renderUnit = (unit: any, level: number = 0, siblings: any[] = []) => {
    const indent = level * 20;
    const isDragging = draggedUnit?.id === unit.id;
    const isEditingName = editingName === unit.id;
    const isEditingNameHe = editingNameHe === unit.id;

    return (
      <div
        key={unit.id}
        className="mb-2"
        style={{ marginRight: `${indent}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, unit)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, unit)}
      >
        <div
          className={`bg-white border rounded p-4 flex justify-between items-center ${
            isDragging ? 'opacity-50' : 'hover:shadow-md'
          } cursor-move`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400">⋮⋮</span>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleNameSave(unit, 'name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNameSave(unit, 'name');
                      } else if (e.key === 'Escape') {
                        handleNameCancel();
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
              ) : (
                <div
                  className="font-semibold cursor-pointer hover:text-blue-600"
                  onDoubleClick={() => handleNameEdit(unit, 'name')}
                  title="לחיצה כפולה לעריכה"
                >
                  {unit.name}
                </div>
              )}
            </div>
            {isEditingNameHe ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleNameSave(unit, 'name_he')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSave(unit, 'name_he');
                    } else if (e.key === 'Escape') {
                      handleNameCancel();
                    }
                  }}
                  autoFocus
                  className="px-2 py-1 border rounded text-sm text-gray-600"
                />
              </div>
            ) : (
              unit.name_he && (
                <div
                  className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                  onDoubleClick={() => handleNameEdit(unit, 'name_he')}
                  title="לחיצה כפולה לעריכה"
                >
                  {unit.name_he}
                </div>
              )
            )}
            <div className="text-xs text-gray-500 mt-1">
              {unit.unit_type === 'unit' && 'יחידה'}
              {unit.unit_type === 'branch' && 'ענף'}
              {unit.unit_type === 'section' && 'מדור'}
              {unit.unit_type === 'team' && 'צוות'}
              {unit.code && ` - ${unit.code}`}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-1">
              {siblings.length > 1 && siblings.findIndex(s => s.id === unit.id) > 0 && (
                <button
                  onClick={() => {
                    const currentIndex = siblings.findIndex(s => s.id === unit.id);
                    handleReorder(unit.id, currentIndex - 1, siblings);
                  }}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  title="הזז למעלה"
                >
                  ↑
                </button>
              )}
              {siblings.length > 1 && siblings.findIndex(s => s.id === unit.id) < siblings.length - 1 && (
                <button
                  onClick={() => {
                    const currentIndex = siblings.findIndex(s => s.id === unit.id);
                    handleReorder(unit.id, currentIndex + 1, siblings);
                  }}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  title="הזז למטה"
                >
                  ↓
                </button>
              )}
            </div>
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
        {unit.children && unit.children.length > 0 && (
          <div className="mt-2">
            {unit.children.map((child: any) => renderUnit(child, level + 1, unit.children))}
          </div>
        )}
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
          <div>
            <h1 className="text-2xl font-bold text-green-600">ניהול מבנה ארגוני</h1>
            <p className="text-sm text-gray-600 mt-1">
              גרור יחידות לסידור מחדש • לחיצה כפולה על שם לעריכה
            </p>
          </div>
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
          {tree.map((unit) => {
            const rootSiblings = tree;
            return renderUnit(unit, 0, rootSiblings);
          })}
          {tree.length === 0 && (
            <div className="text-center text-gray-500 py-8">אין יחידות</div>
          )}
        </div>
      </main>
    </div>
  );
}
