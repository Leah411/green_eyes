import { useRouter } from 'next/router';

interface SidebarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  userRole?: string;
}

export default function Sidebar({ showSidebar, setShowSidebar, userRole = '' }: SidebarProps) {
  const router = useRouter();
  const canAccessUserManagement = ['system_manager', 'unit_manager', 'admin'].includes(userRole);

  if (!showSidebar) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl z-[100] overflow-y-auto" dir="rtl">
      <div className="sticky top-0 bg-green-600 text-white p-4 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">תפריט</h2>
          <button
            onClick={() => setShowSidebar(false)}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {/* Navigation Menu Items - Main items at top */}
        <button
          onClick={() => router.push('/home')}
          className="w-full text-right p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all flex items-center justify-between"
        >
          <span className="font-semibold text-gray-700">עמוד בית</span>
          <span className="text-green-600">→</span>
        </button>
        
        <button
          onClick={() => router.push('/profile')}
          className="w-full text-right p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all flex items-center justify-between"
        >
          <span className="font-semibold text-gray-700">פרופיל אישי</span>
          <span className="text-green-600">→</span>
        </button>
        
        <button
          onClick={() => router.push('/dashboard/availability')}
          className="w-full text-right p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all flex items-center justify-between"
        >
          <span className="font-semibold text-gray-700">סטטוס זמינות</span>
          <span className="text-green-600">→</span>
        </button>

        {/* User Management - System Manager, Unit Manager, and Admin */}
        {canAccessUserManagement && (
          <>
          <button
            onClick={() => router.push('/dashboard/permissions')}
            className="w-full text-right p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all flex items-center justify-between"
          >
            <span className="font-semibold text-gray-700">ניהול משתמשים</span>
            <span className="text-green-600">→</span>
          </button>
            <button
              onClick={() => router.push('/admin/organizational-structure')}
              className="w-full text-right p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all flex items-center justify-between"
            >
              <span className="font-semibold text-gray-700">סידור מבנה</span>
              <span className="text-green-600">→</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

