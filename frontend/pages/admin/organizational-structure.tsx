import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';
import MenuIcon from '../../components/MenuIcon';

export default function OrganizationalStructure() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [draggedUnit, setDraggedUnit] = useState<any>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, { parent?: number | null; order_number?: number }>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
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
    checkPermissions();
    loadUnits();
  }, [router]);

  const checkPermissions = async () => {
    try {
      const profileRes = await api.getProfile();
      const role = profileRes.data.profile?.role || '';
      setUserRole(role);
      
      // Only system_manager and unit_manager can access
      if (role !== 'system_manager' && role !== 'unit_manager') {
        alert('אין לך הרשאה לגשת לדף זה. רק מנהל מערכת ומנהל יחידה יכולים לגשת.');
        router.push('/home');
        return;
      }
    } catch (err) {
      console.error('Failed to check permissions:', err);
    }
  };

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await api.listUnits();
      const data = response.data;
      
      let allUnits: any[] = [];
      
      // Handle different response formats
      if (data.results && Array.isArray(data.results)) {
        // Paginated response
        allUnits = data.results;
        
        // If there are more pages, load them
        if (data.next) {
          let currentPage = 2;
          while (true) {
            try {
              const nextResponse = await api.listUnits({ page: currentPage } as any);
              const nextData = nextResponse.data;
              if (nextData.results && nextData.results.length > 0) {
                allUnits = [...allUnits, ...nextData.results];
                if (!nextData.next) break;
                currentPage++;
              } else {
                break;
              }
            } catch (e) {
              break; // Stop if error loading next page
            }
          }
        }
      } else if (Array.isArray(data)) {
        // Non-paginated response (array)
        allUnits = data;
      } else {
        // Single object or other format
        allUnits = [data];
      }
      
      // Normalize parent field - ensure it's always an ID (number) or null
      const normalizedUnits = allUnits.map((unit: any) => {
        const parentId = typeof unit.parent === 'object' ? unit.parent?.id : unit.parent;
        return {
          ...unit,
          parent: parentId || null,
        };
      });
      
      console.log('Loaded units:', normalizedUnits.length);
      console.log('Units by type:', {
        units: normalizedUnits.filter((u: any) => u.unit_type === 'unit').length,
        branches: normalizedUnits.filter((u: any) => u.unit_type === 'branch').length,
        sections: normalizedUnits.filter((u: any) => u.unit_type === 'section').length,
        teams: normalizedUnits.filter((u: any) => u.unit_type === 'team').length,
      });
      console.log('All units:', normalizedUnits);
      
      setUnits(normalizedUnits);
    } catch (err) {
      console.error('Failed to load units:', err);
      alert('שגיאה בטעינת היחידות. אנא רענן את הדף.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend: any = {
        name: formData.name,
        name_he: formData.name_he,
        unit_type: formData.unit_type,
        code: formData.code || null,
      };
      
      if (formData.parent) {
        dataToSend.parent = formData.parent;
      }
      
      if (editingUnit) {
        await api.updateUnit(editingUnit.id, dataToSend);
        alert('היחידה עודכנה בהצלחה');
      } else {
        await api.createUnit(dataToSend);
        alert('היחידה נוצרה בהצלחה');
      }
      
      setShowAddForm(false);
      setEditingUnit(null);
      setFormData({ name: '', name_he: '', unit_type: 'unit', parent: null, code: '' });
      loadUnits();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'שגיאה בשמירה';
      alert(errorMessage);
      console.error('Error saving unit:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק? פעולה זו תמחק גם את כל היחידות הכפופות.')) return;
    try {
      await api.deleteUnit(id);
      alert('היחידה נמחקה בהצלחה');
      loadUnits();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'שגיאה במחיקה';
      alert(errorMessage);
      console.error('Error deleting unit:', err);
    }
  };

  const buildTree = (unitsList: any[], parentId: number | null = null): any[] => {
    // Create a map with pending changes applied
    const unitsWithChanges = unitsList.map(unit => {
      const changes = pendingChanges.get(unit.id);
      const unitParent = typeof unit.parent === 'object' ? unit.parent?.id : (unit.parent || null);
      
      return {
        ...unit,
        parent: changes?.parent !== undefined ? changes.parent : unitParent,
        order_number: changes?.order_number !== undefined ? changes.order_number : (unit.order_number || 0),
      };
    });
    
    const filtered = unitsWithChanges.filter(unit => {
      if (parentId === null) {
        // Root level - units with no parent
        return !unit.parent;
      } else {
        // Child level - units whose parent matches
        return unit.parent === parentId;
      }
    });
    
    // Sort by order_number
    filtered.sort((a, b) => {
      if (a.order_number !== b.order_number) {
        return a.order_number - b.order_number;
      }
      return (a.name_he || a.name).localeCompare(b.name_he || b.name, 'he');
    });
    
    const result = filtered.map(unit => ({
        ...unit,
      children: buildTree(unitsList, unit.id),
      }));
    
    return result;
  };

  const handleDragStart = (e: React.DragEvent, unit: any) => {
    setDraggedUnit(unit);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', unit.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetUnit: any) => {
    e.preventDefault();
    if (!draggedUnit || draggedUnit.id === targetUnit.id) return;
    
    // Prevent dropping on itself or descendant
    const checkIfDescendant = (ancestorId: number, descendantId: number, allUnits: any[]): boolean => {
      const ancestor = allUnits.find(u => u.id === ancestorId);
      if (!ancestor) return false;
      
      const getChildren = (unitId: number): any[] => {
        return allUnits.filter(u => {
          const parent = typeof u.parent === 'object' ? u.parent?.id : (u.parent || null);
          return parent === unitId;
        });
      };
      
      const checkRecursive = (currentId: number): boolean => {
        if (currentId === descendantId) return true;
        const children = getChildren(currentId);
        return children.some(child => checkRecursive(child.id));
      };
      
      return checkRecursive(ancestorId);
    };
    
    if (checkIfDescendant(draggedUnit.id, targetUnit.id, units)) {
      alert('לא ניתן להעביר יחידה לתוך אחת מהיחידות הכפופות לה');
      setDraggedUnit(null);
      return;
    }
    
    // Update parent
    const newParent = targetUnit.id;
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(draggedUnit.id) || {};
      newMap.set(draggedUnit.id, { ...current, parent: newParent });
      return newMap;
    });
    
    // Update local state immediately for visual feedback
    setUnits(prevUnits => {
      return prevUnits.map(unit => {
        if (unit.id === draggedUnit.id) {
          return { ...unit, parent: newParent };
        }
        return unit;
      });
    });
    
    setDraggedUnit(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedUnit) return;
    
    // Update parent to null (root level)
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(draggedUnit.id) || {};
      newMap.set(draggedUnit.id, { ...current, parent: null });
      return newMap;
    });
    
    // Update local state immediately for visual feedback
    setUnits(prevUnits => {
      return prevUnits.map(unit => {
        if (unit.id === draggedUnit.id) {
          return { ...unit, parent: null };
        }
        return unit;
      });
    });
    
    setDraggedUnit(null);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      alert('אין שינויים לשמירה');
      return;
    }
    
    setIsSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(([id, changes]) => ({
        id,
        ...changes,
      }));
      
      // Save all changes
      await Promise.all(updates.map(async ({ id, parent, order_number }) => {
        const updateData: any = {};
        if (parent !== undefined) updateData.parent = parent;
        if (order_number !== undefined) updateData.order_number = order_number;
        
        if (Object.keys(updateData).length > 0) {
          await api.updateUnit(id, updateData);
        }
      }));
      
      setPendingChanges(new Map());
      alert('השינויים נשמרו בהצלחה');
      loadUnits();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'שגיאה בשמירת השינויים';
      alert(errorMessage);
      console.error('Error saving changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderUnit = (unit: any, level: number = 0) => {
    const indent = level * 20;
    const hasPendingChanges = pendingChanges.has(unit.id);
    const isDragged = draggedUnit?.id === unit.id;
    
    return (
      <div key={unit.id} className="mb-2" style={{ marginRight: `${indent}px` }}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, unit)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, unit)}
          className={`bg-white border rounded p-4 flex justify-between items-center cursor-move transition-all ${
            isDragged ? 'opacity-50' : ''
          } ${hasPendingChanges ? 'border-orange-500 border-2' : 'border-gray-200'} hover:border-green-400 hover:shadow-md`}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="text-gray-400 text-xl">⋮⋮</div>
          <div>
              <div className="font-semibold text-lg">{unit.name_he || unit.name}</div>
              {unit.name_he && unit.name !== unit.name_he && (
                <div className="text-sm text-gray-500">{unit.name}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
              {unit.unit_type === 'unit' && 'יחידה'}
              {unit.unit_type === 'branch' && 'ענף'}
              {unit.unit_type === 'section' && 'מדור'}
              {unit.unit_type === 'team' && 'צוות'}
                {unit.code && ` - קוד: ${unit.code}`}
                {hasPendingChanges && ' (שינויים לא שמורים)'}
              </div>
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
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Menu Icon */}
      <MenuIcon onClick={() => setShowSidebar(!showSidebar)} isOpen={showSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:mr-80' : ''}`}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">סידור מבנה</h1>
          <div className="flex gap-2">
              <button
                onClick={() => router.push('/home')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                חזרה לדשבורד
              </button>
              {pendingChanges.size > 0 && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSaving ? 'שומר...' : `שמור שינויים (${pendingChanges.size})`}
                </button>
              )}
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
                <label className="block text-right text-sm font-medium mb-1">שם (אנגלית)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-right"
                />
              </div>
              <div>
                <label className="block text-right text-sm font-medium mb-1">שם (עברית)</label>
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
                  {units
                    .filter(unit => !editingUnit || unit.id !== editingUnit.id) // Don't allow selecting self as parent
                    .map((unit) => (
                    <option key={unit.id} value={unit.id}>
                        {unit.name_he || unit.name} ({unit.unit_type === 'unit' ? 'יחידה' : unit.unit_type === 'branch' ? 'ענף' : unit.unit_type === 'section' ? 'מדור' : 'צוות'})
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-right">מבנה ארגוני</h2>
            <div className="text-sm text-gray-600 text-right">
              💡 גרור יחידות כדי לשנות את המיקום שלהן
            </div>
          </div>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropOnRoot}
            className="min-h-[200px] p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4"
          >
            <div className="text-sm text-gray-500 text-center mb-2">גרור לכאן כדי להעביר לרמה הראשית</div>
          </div>
          {tree.map((unit) => renderUnit(unit))}
          {tree.length === 0 && (
            <div className="text-center text-gray-500 py-8">אין יחידות</div>
          )}
        </div>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />
    </div>
  );
}



