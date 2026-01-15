import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';
import MenuIcon from '../../components/MenuIcon';
import * as XLSX from 'xlsx';

export default function AvailabilityDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [originalUsers, setOriginalUsers] = useState<any[]>([]);
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
  
  // Filter states with checkboxes
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set());
  const [selectedBranches, setSelectedBranches] = useState<Set<number>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
  
  // Status filter - removed, will use arrows in table
  
  // Dropdown open states
  const [unitsDropdownOpen, setUnitsDropdownOpen] = useState(false);
  const [branchesDropdownOpen, setBranchesDropdownOpen] = useState(false);
  const [sectionsDropdownOpen, setSectionsDropdownOpen] = useState(false);
  const [teamsDropdownOpen, setTeamsDropdownOpen] = useState(false);
  
  // Hierarchical data
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  // Status filter state (for arrows in table)
  const [statusFilter, setStatusFilter] = useState<string | null>(null); // null = all, 'red' = not filled, 'green' = filled
  
  // Contact info popup state
  const [selectedUserForContact, setSelectedUserForContact] = useState<any>(null);
  const [showContactPopup, setShowContactPopup] = useState(false);
  
  // Refs for dropdowns
  const unitsDropdownRef = useRef<HTMLDivElement>(null);
  const branchesDropdownRef = useRef<HTMLDivElement>(null);
  const sectionsDropdownRef = useRef<HTMLDivElement>(null);
  const teamsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitsDropdownRef.current && !unitsDropdownRef.current.contains(event.target as Node)) {
        setUnitsDropdownOpen(false);
      }
      if (branchesDropdownRef.current && !branchesDropdownRef.current.contains(event.target as Node)) {
        setBranchesDropdownOpen(false);
      }
      if (sectionsDropdownRef.current && !sectionsDropdownRef.current.contains(event.target as Node)) {
        setSectionsDropdownOpen(false);
      }
      if (teamsDropdownRef.current && !teamsDropdownRef.current.contains(event.target as Node)) {
        setTeamsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    loadAllUnits();
  }, [router]);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/');
      return;
    }
    // Only load data if we have loaded units first
    if (allUnits.length > 0) {
      loadData();
    }
  }, [selectedUnit, selectedUnits, selectedBranches, selectedSections, selectedTeams, allUnits]);

  const loadAllUnits = async () => {
    try {
      // Load all units with pagination
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
      setUnits(allUnitsData);
      
      // Organize by type
      const unitsList = allUnitsData.filter(u => u.unit_type === 'unit');
      const branchesList = allUnitsData.filter(u => u.unit_type === 'branch');
      const sectionsList = allUnitsData.filter(u => u.unit_type === 'section');
      const teamsList = allUnitsData.filter(u => u.unit_type === 'team');
      
      setBranches(branchesList);
      setSections(sectionsList);
      setTeams(teamsList);
    } catch (err) {
      console.error('Failed to load units:', err);
    }
  };
  
  const loadBranchesForUnit = async (unitId: number) => {
    try {
      const response = await api.getUnitsByParent(unitId, 'branch');
      return response.data.results || response.data || [];
    } catch (err) {
      console.error('Failed to load branches:', err);
      return [];
    }
  };
  
  const loadSectionsForBranch = async (branchId: number) => {
    try {
      const response = await api.getUnitsByParent(branchId, 'section');
      return response.data.results || response.data || [];
    } catch (err) {
      console.error('Failed to load sections:', err);
      return [];
    }
  };
  
  const loadTeamsForSection = async (sectionId: number) => {
    try {
      const response = await api.getUnitsByParent(sectionId, 'team');
      return response.data.results || response.data || [];
    } catch (err) {
      console.error('Failed to load teams:', err);
      return [];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('loadData called with filters:', {
        selectedUnits: Array.from(selectedUnits),
        selectedBranches: Array.from(selectedBranches),
        selectedSections: Array.from(selectedSections),
        selectedTeams: Array.from(selectedTeams)
      });
      const profileRes = await api.getProfile();
      const profileData = profileRes.data.profile;
      setProfile(profileData);
      const role = profileData?.role || '';
      setUserRole(role);
      
      // Check permissions - only managers can access this page
      const isManager = ['team_manager', 'section_manager', 'branch_manager', 'unit_manager', 'system_manager', 'admin'].includes(role);
      if (!isManager) {
        alert('אין לך הרשאה לגשת לדף זה. רק מנהלים יכולים לגשת.');
        router.push('/home');
        return;
      }
      
      // Load all approved users with their profiles (backend already filters by manager's unit hierarchy)
      const usersRes = await api.listApprovedUsers();
      const allUsers = usersRes.data.results || usersRes.data || [];
      
      // Build filter based on hierarchy (most specific wins)
      // Hierarchy: Team > Section > Branch > Unit
      let selectedUnitIds: number[] = [];

      if (selectedTeams.size > 0) {
        // Most specific: teams only
        selectedUnitIds = Array.from(selectedTeams);
      } else if (selectedSections.size > 0) {
        // Sections + their descendants
        selectedUnitIds = Array.from(selectedSections);
      } else if (selectedBranches.size > 0) {
        // Branches + their descendants
        selectedUnitIds = Array.from(selectedBranches);
      } else if (selectedUnits.size > 0) {
        // Least specific: units + their descendants
        selectedUnitIds = Array.from(selectedUnits);
      }

      console.log('Filter hierarchy:', {
        teams: selectedTeams.size,
        sections: selectedSections.size,
        branches: selectedBranches.size,
        units: selectedUnits.size,
        finalSelectedIds: selectedUnitIds
      });
      
      // Use old selectedUnit for backward compatibility, or new filter
      const unitFilter = selectedUnit || (selectedUnitIds.length > 0 ? selectedUnitIds[0].toString() : '');
      
      // Load reports to show availability status (filtered by selected unit, backend handles descendants)
      const reportsRes = await api.listReports(unitFilter ? { unit: unitFilter } : {});
      const reports = reportsRes.data.results || reportsRes.data || [];
      
      // Create a map of user IDs to their latest report submitted_at (includes date and time)
      const reportsByUser = new Map();
      reports.forEach((report: any) => {
        const existingDateTime = reportsByUser.get(report.user);
        // Use submitted_at (DateTime) instead of date (Date only) to get time as well
        const reportDateTime = report.submitted_at || report.date;
        if (!existingDateTime || new Date(reportDateTime) > new Date(existingDateTime)) {
          reportsByUser.set(report.user, reportDateTime);
        }
      });
      
      // Filter users by selected units/branches/sections/teams
      let usersToShow = allUsers;
      
      if (selectedUnitIds.length > 0 && allUnits.length > 0) {
        // Build a set of all relevant unit IDs (selected units themselves + all their descendants)
        // This allows filtering users who belong to any unit in the selected hierarchy
        const relevantUnitIds = new Set<number>(selectedUnitIds);
        
        // Add all descendants of selected units (children, grandchildren, etc.)
        const addDescendants = (unitId: number) => {
          const children = allUnits.filter(u => {
            const parentId = typeof u.parent === 'object' ? u.parent?.id : u.parent;
            return parentId === unitId;
          });
          children.forEach(child => {
            relevantUnitIds.add(child.id);
            addDescendants(child.id); // Recursively add descendants
          });
        };
        
        // Add descendants for all selected units
        selectedUnitIds.forEach(id => addDescendants(id));
        
        console.log('Filtering users:', {
          selectedUnitIds: Array.from(selectedUnitIds),
          relevantUnitIds: Array.from(relevantUnitIds),
          totalUsers: allUsers.length
        });
        
        usersToShow = allUsers.filter((user: any) => {
          // user.profile?.unit can be either an ID (number) or an object with id property
          const userUnitId = typeof user.profile?.unit === 'object' 
            ? user.profile?.unit?.id 
            : user.profile?.unit;
          
          if (!userUnitId) return false;
          
          // Check if user's unit is in the relevant units set (selected units or their descendants)
          return relevantUnitIds.has(userUnitId);
        });
      }
      
      // Create unfiltered usersWithStatus first (before filtering) - this is our "original" state
      const unfilteredUsersWithStatus = allUsers.map((user: any) => {
        const latestReportDate = reportsByUser.get(user.id);
        const hasFilledReport = !!latestReportDate;
        
        return {
          user_id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.profile?.address,
          city: user.profile?.city_name_he || user.profile?.city_name,
          contact_name: user.profile?.contact_name,
          contact_phone: user.profile?.contact_phone,
          unit: user.profile?.unit ? {
            id: user.profile.unit,
            name: user.profile.unit_name,
            name_he: user.profile.unit_name
          } : null,
          status: hasFilledReport ? 'green' : 'red',
          has_filled_report: hasFilledReport,
          latest_report_date: latestReportDate,
        };
      });
      
      // Save original users state before filtering (always save unfiltered state, but only if originalUsers is empty)
      // This ensures we have a baseline to return to when filters are cleared
      if (originalUsers.length === 0) {
        setOriginalUsers(unfilteredUsersWithStatus);
      }
      
      // Merge filtered user data with report status
      let usersWithStatus = usersToShow.map((user: any) => {
        const latestReportDate = reportsByUser.get(user.id);
        const hasFilledReport = !!latestReportDate;
        
        return {
          user_id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.profile?.address,
          city: user.profile?.city_name_he || user.profile?.city_name,
          contact_name: user.profile?.contact_name,
          contact_phone: user.profile?.contact_phone,
          unit: user.profile?.unit ? {
            id: user.profile.unit,
            name: user.profile.unit_name,
            name_he: user.profile.unit_name
          } : null,
          status: hasFilledReport ? 'green' : 'red',
          has_filled_report: hasFilledReport,
          latest_report_date: latestReportDate,
        };
      });
      
      // Don't filter by status here - will be done in display based on arrow clicks
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
          'טלפון': user.phone || '-',
          'כתובת': user.address || '-',
          'עיר': user.city || '-',
          'יחידה': user.unit ? (user.unit.name_he || user.unit.name) : '-',
          'תאריך ושעה דוח אחרון': user.latest_report_date 
            ? new Date(user.latest_report_date).toLocaleString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
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
    if (!confirm('האם אתה בטוח שברצונך לשלוח התרעה לכל המשתמשים?')) {
      return;
    }

    // Check if user is authenticated
    const token = Cookies.get('access_token');
    if (!token) {
      alert('אין לך הרשאה. אנא התחבר מחדש.');
      router.push('/');
      return;
    }

    setSendingAlert(true);
    try {
      const homeLink = 'https://green-eyes-frontend.onrender.com/home';
      
      const response = await api.sendAlert({
        subject: 'הופעל נוהל ירוק בעיניים',
        message: `הופעל נוהל ירוק בעיניים יש למלא דוח זמינות\n\nקישור לעמוד הבית: ${homeLink}`,
        unit_id: null, // Send to all users
        send_to: ['all'] // Send to all users
      });
      
      alert(`התרעה נשלחה בהצלחה ל-${response.data.recipients_count} משתמשים`);
      // Reload data to show updated status
      loadData();
    } catch (err: any) {
      console.error('Failed to send alert:', err);
      const errorMsg = err.response?.data?.error || err.message || 'שגיאה בשליחת ההתרעה';
      
      // If 401, suggest re-login
      if (err.response?.status === 401) {
        alert('הטוקן פג תוקף. אנא התחבר מחדש.');
        router.push('/');
      } else {
        alert(`שגיאה בשליחת ההתרעה: ${errorMsg}`);
      }
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

  // Helper function to check if a unit is descendant of selected units
  const isDescendantOfSelectedUnits = (unitId: number, selectedUnitsList: number[]): boolean => {
    let current = allUnits.find(u => u.id === unitId);
    while (current && current.parent) {
      if (selectedUnitsList.includes(current.parent)) return true;
      current = allUnits.find(u => u.id === current.parent);
      if (!current) break;
    }
    return false;
  };

  // Helper functions for checkbox handling
  const toggleUnit = (unitId: number) => {
    setSelectedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      
      // אם הוסרה יחידה - הסר ענפים/מדורים/צוותים שלא שייכים ליחידות שנשארו
      if (!newSet.has(unitId)) {
        const selectedUnitsList = Array.from(newSet);
        setSelectedBranches(prevBranches => {
          const filtered = new Set(prevBranches);
          prevBranches.forEach(branchId => {
            const branch = allUnits.find(u => u.id === branchId);
            if (branch && !selectedUnitsList.includes(branch.parent)) {
              filtered.delete(branchId);
            }
          });
          return filtered;
        });
        
        setSelectedSections(prevSections => {
          const filtered = new Set(prevSections);
          prevSections.forEach(sectionId => {
            if (!isDescendantOfSelectedUnits(sectionId, selectedUnitsList)) {
              filtered.delete(sectionId);
            }
          });
          return filtered;
        });
        
        setSelectedTeams(prevTeams => {
          const filtered = new Set(prevTeams);
          prevTeams.forEach(teamId => {
            if (!isDescendantOfSelectedUnits(teamId, selectedUnitsList)) {
              filtered.delete(teamId);
            }
          });
          return filtered;
        });
      }
      
      return newSet;
    });
  };
  
  const toggleBranch = (branchId: number) => {
    setSelectedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchId)) {
        newSet.delete(branchId);
      } else {
        newSet.add(branchId);
      }
      
      // אם הוסר ענף - הסר מדורים/צוותים שלא שייכים לענפים שנשארו
      if (!newSet.has(branchId)) {
        const selectedBranchesList = Array.from(newSet);
        setSelectedSections(prevSections => {
          const filtered = new Set(prevSections);
          prevSections.forEach(sectionId => {
            const section = allUnits.find(u => u.id === sectionId);
            if (section && !selectedBranchesList.includes(section.parent)) {
              filtered.delete(sectionId);
            }
          });
          return filtered;
        });
        
        setSelectedTeams(prevTeams => {
          const filtered = new Set(prevTeams);
          prevTeams.forEach(teamId => {
            const team = allUnits.find(u => u.id === teamId);
            if (team) {
              const section = allUnits.find(u => u.id === team.parent);
              if (section && !selectedBranchesList.includes(section.parent)) {
                filtered.delete(teamId);
              }
            }
          });
          return filtered;
        });
      }
      
      return newSet;
    });
  };
  
  const toggleSection = (sectionId: number) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      
      // אם הוסר מדור - הסר צוותים שלא שייכים למדורים שנשארו
      if (!newSet.has(sectionId)) {
        const selectedSectionsList = Array.from(newSet);
        setSelectedTeams(prevTeams => {
          const filtered = new Set(prevTeams);
          prevTeams.forEach(teamId => {
            const team = allUnits.find(u => u.id === teamId);
            if (team && !selectedSectionsList.includes(team.parent)) {
              filtered.delete(teamId);
            }
          });
          return filtered;
        });
      }
      
      return newSet;
    });
  };
  
  const toggleTeam = (teamId: number) => {
    setSelectedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };
  
  const clearAllFilters = () => {
    setSelectedUnits(new Set());
    setSelectedBranches(new Set());
    setSelectedSections(new Set());
    setSelectedTeams(new Set());
    setSelectedUnit('');
    // Restore table to previous state (original users before filtering)
    if (originalUsers.length > 0) {
      setUsers(originalUsers);
    }
  };
  
  // Get available options based on hierarchical selection
  // כשבוחרים ענף - האפשרויות היחידות הן מדורים תחת אותו ענף
  // כשבוחרים מדור - האפשרויות היחידות הן צוותים תחת אותו מדור
  const getAvailableBranches = () => {
    // תמיד הצג את כל הענפים
    return branches;
  };
  
  const getAvailableSections = () => {
    // אם יש ענפים נבחרים, הצג רק מדורים תחת אותם ענפים
    if (selectedBranches.size > 0) {
      const selectedBranchesList = Array.from(selectedBranches);
      return sections.filter((section: any) => {
        const sectionParentId = typeof section.parent === 'object' ? section.parent?.id : section.parent;
        return selectedBranchesList.includes(sectionParentId);
      });
    }
    // אם אין ענפים נבחרים, הצג את כל המדורים
    return sections;
  };
  
  const getAvailableTeams = () => {
    // אם יש מדורים נבחרים, הצג רק צוותים תחת אותם מדורים
    if (selectedSections.size > 0) {
      const selectedSectionsList = Array.from(selectedSections);
      return teams.filter((team: any) => {
        const teamParentId = typeof team.parent === 'object' ? team.parent?.id : team.parent;
        return selectedSectionsList.includes(teamParentId);
      });
    }
    // אם אין מדורים נבחרים, הצג את כל הצוותים
    return teams;
  };

  if (loading) {
    return <div className="p-8 text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden" dir="rtl">
      {/* Menu Icon */}
      <MenuIcon onClick={() => setShowSidebar(!showSidebar)} isOpen={showSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 w-full min-w-0 ${showSidebar ? 'md:mr-80' : ''}`}>
        <header className="bg-white shadow sticky top-0 z-40 w-full">
          <div className="max-w-7xl mx-auto px-2 md:px-4 py-1.5 sm:py-2 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5 md:gap-2">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-600">דשבורד זמינות</h1>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 w-full md:w-auto">
              {(userRole === 'system_manager' || userRole === 'unit_manager' || userRole === 'admin') && (
                <>
                  <button
                    onClick={handleSendAlert}
                    disabled={sendingAlert}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingAlert ? 'שולח...' : 'שלח התרעה'}
                  </button>
                </>
              )}
              <button
                onClick={handleExport}
                className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-green-600 text-white rounded hover:bg-green-700"
              >
                ייצוא לאקסל
              </button>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-4 lg:py-8 w-full">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-2 sm:mb-3 md:mb-6 p-2 md:p-4 overflow-visible w-full relative z-[10000]">
          <div className="mb-2 md:mb-4">
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-700 mb-1.5 sm:mb-2 md:mb-3">סינון לפי מבנה ארגוני</h3>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start">
              {/* Units Dropdown */}
              <div className="relative w-full md:w-auto z-[10000]" ref={unitsDropdownRef}>
                <button
                  onClick={() => {
                    setUnitsDropdownOpen(!unitsDropdownOpen);
                    setBranchesDropdownOpen(false);
                    setSectionsDropdownOpen(false);
                    setTeamsDropdownOpen(false);
                  }}
                  className="w-full md:w-auto px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px] md:min-w-[200px] text-right flex items-center justify-between"
                >
                  <span>יחידות {selectedUnits.size > 0 && `(${selectedUnits.size})`}</span>
                  <span className="mr-2">▼</span>
                </button>
                {unitsDropdownOpen && (
                  <div className="absolute z-[10000] mt-1 w-full md:w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" dir="rtl">
                    <div className="p-2">
                      {allUnits.filter(u => u.unit_type === 'unit').map((unit) => (
                        <label key={unit.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUnits.has(unit.id)}
                            onChange={() => toggleUnit(unit.id)}
                            className="ml-2"
                          />
                          <span className="text-sm">{unit.name_he || unit.name}</span>
                        </label>
                      ))}
                      {allUnits.filter(u => u.unit_type === 'unit').length === 0 && (
                        <div className="p-2 text-sm text-gray-500">אין יחידות זמינות</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Branches Dropdown */}
              <div className="relative w-full md:w-auto z-[10000]" ref={branchesDropdownRef}>
                <button
                  onClick={() => {
                    setBranchesDropdownOpen(!branchesDropdownOpen);
                    setUnitsDropdownOpen(false);
                    setSectionsDropdownOpen(false);
                    setTeamsDropdownOpen(false);
                  }}
                  className="w-full md:w-auto px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px] md:min-w-[200px] text-right flex items-center justify-between"
                >
                  <span>ענפים {selectedBranches.size > 0 && `(${selectedBranches.size})`}</span>
                  <span className="mr-2">▼</span>
                </button>
                {branchesDropdownOpen && (
                  <div className="absolute z-[10000] mt-1 w-full md:w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" dir="rtl">
                    <div className="p-2">
                      {getAvailableBranches().map((branch) => (
                        <label key={branch.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBranches.has(branch.id)}
                            onChange={() => toggleBranch(branch.id)}
                            className="ml-2"
                          />
                          <span className="text-sm">{branch.name_he || branch.name}</span>
                        </label>
                      ))}
                      {getAvailableBranches().length === 0 && (
                        <div className="p-2 text-sm text-gray-500">אין ענפים זמינים</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sections Dropdown */}
              <div className="relative w-full md:w-auto z-[10000]" ref={sectionsDropdownRef}>
                <button
                  onClick={() => {
                    setSectionsDropdownOpen(!sectionsDropdownOpen);
                    setUnitsDropdownOpen(false);
                    setBranchesDropdownOpen(false);
                    setTeamsDropdownOpen(false);
                  }}
                  className="w-full md:w-auto px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px] md:min-w-[200px] text-right flex items-center justify-between"
                >
                  <span>מדורים {selectedSections.size > 0 && `(${selectedSections.size})`}</span>
                  <span className="mr-2">▼</span>
                </button>
                {sectionsDropdownOpen && (
                  <div className="absolute z-[10000] mt-1 w-full md:w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" dir="rtl">
                    <div className="p-2">
                      {getAvailableSections().map((section) => (
                        <label key={section.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSections.has(section.id)}
                            onChange={() => toggleSection(section.id)}
                            className="ml-2"
                          />
                          <span className="text-sm">{section.name_he || section.name}</span>
                        </label>
                      ))}
                      {getAvailableSections().length === 0 && (
                        <div className="p-2 text-sm text-gray-500">אין מדורים זמינים</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Teams Dropdown */}
              <div className="relative w-full md:w-auto z-[10000]" ref={teamsDropdownRef}>
                <button
                  onClick={() => {
                    setTeamsDropdownOpen(!teamsDropdownOpen);
                    setUnitsDropdownOpen(false);
                    setBranchesDropdownOpen(false);
                    setSectionsDropdownOpen(false);
                  }}
                  className="w-full md:w-auto px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[150px] md:min-w-[200px] text-right flex items-center justify-between"
                >
                  <span>צוותים {selectedTeams.size > 0 && `(${selectedTeams.size})`}</span>
                  <span className="mr-2">▼</span>
                </button>
                {teamsDropdownOpen && (
                  <div className="absolute z-[10000] mt-1 w-full md:w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" dir="rtl">
                    <div className="p-2">
                      {getAvailableTeams().map((team) => (
                        <label key={team.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTeams.has(team.id)}
                            onChange={() => toggleTeam(team.id)}
                            className="ml-2"
                          />
                          <span className="text-sm">{team.name_he || team.name}</span>
                        </label>
                      ))}
                      {getAvailableTeams().length === 0 && (
                        <div className="p-2 text-sm text-gray-500">אין צוותים זמינים</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              {(selectedUnits.size > 0 || selectedBranches.size > 0 || selectedSections.size > 0 || selectedTeams.size > 0 || selectedUnit || statusFilter !== null) && (
                <button
                  onClick={() => {
                    clearAllFilters();
                    setStatusFilter(null);
                  }}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  נקה סינון
                </button>
              )}
            </div>
          </div>
          {lastAlert && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs md:text-sm text-blue-800">
                <strong>התרעה אחרונה:</strong> {lastAlert.subject} - {new Date(lastAlert.sent_at).toLocaleString('he-IL')}
              </p>
            </div>
          )}
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-4 mb-3 md:mb-6">
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1 sm:gap-0">
              <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 text-center sm:text-right">סה"כ משתמשים</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{users.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1 sm:gap-0">
              <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 text-center sm:text-right">מילאו דוח</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'green').length}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-1 sm:gap-0">
              <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 text-center sm:text-right">לא מילאו דוח</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                {users.filter(u => u.status === 'red').length}
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-right">סטטוס דוחות זמינות</h2>
          </div>
          <div className="overflow-auto -mx-2 md:mx-0" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <span>סטטוס</span>
                      <div className="flex flex-col gap-0">
                        <button
                          onClick={() => setStatusFilter(statusFilter === 'red' ? null : 'red')}
                          className={`p-0.5 sm:p-1 hover:bg-gray-200 rounded transition-colors ${statusFilter === 'red' ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}
                          title="הצג רק מי שלא מילא דוח"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setStatusFilter(statusFilter === 'green' ? null : 'green')}
                          className={`p-0.5 sm:p-1 hover:bg-gray-200 rounded transition-colors ${statusFilter === 'green' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                          title="הצג רק מי שמילא דוח"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">שם</th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">טלפון</th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">כתובת</th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">עיר</th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">יחידה</th>
                  <th className="px-1.5 sm:px-2 md:px-6 py-1.5 sm:py-2 md:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">תאריך ושעה דוח אחרון</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.filter((user: any) => {
                  // Filter by status if statusFilter is set
                  if (statusFilter === null) return true;
                  return user.status === statusFilter;
                }).map((user) => {
                  const fullName = user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.username || '-';
                  
                  return (
                    <tr 
                      key={user.user_id} 
                      className={`transition-colors ${getRowColor(user.status)}`}
                    >
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status, user.has_filled_report)}
                        </span>
                      </td>
                      <td 
                        className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right font-medium cursor-pointer hover:text-green-600 hover:underline whitespace-nowrap text-xs sm:text-sm md:text-base"
                        onClick={() => {
                          setSelectedUserForContact(user);
                          setShowContactPopup(true);
                        }}
                      >
                        {fullName}
                      </td>
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap text-xs sm:text-sm md:text-base">{user.phone || '-'}</td>
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap text-xs sm:text-sm md:text-base">{user.address || '-'}</td>
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap text-xs sm:text-sm md:text-base">{user.city || '-'}</td>
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap text-xs sm:text-sm md:text-base">
                        {(() => {
                          if (!user.unit || !user.unit.id) return '-';
                          
                          // Build full hierarchy path like in profile page
                          const unitId = user.unit.id;
                          const unitObj = allUnits.find(u => u.id === unitId);
                          if (!unitObj) return user.unit.name_he || user.unit.name || '-';
                          
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
                          return path.length > 0 ? path.join(' > ') : (user.unit.name_he || user.unit.name || '-');
                        })()}
                      </td>
                      <td className="px-1.5 sm:px-2 md:px-6 py-2 sm:py-3 md:py-4 text-right whitespace-nowrap text-xs sm:text-sm md:text-base">
                        {user.latest_report_date 
                          ? new Date(user.latest_report_date).toLocaleString('he-IL', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {users.length === 0 && (
              <div className="p-8 text-center text-gray-500">אין משתמשים להצגה</div>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} userRole={userRole} />

      {/* Contact Info Popup */}
      {showContactPopup && selectedUserForContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-right">פרטי איש קשר</h2>
                <button
                  onClick={() => {
                    setShowContactPopup(false);
                    setSelectedUserForContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם המשתמש:</label>
                <p className="text-right bg-gray-50 p-2 rounded">
                  {selectedUserForContact.first_name && selectedUserForContact.last_name 
                    ? `${selectedUserForContact.first_name} ${selectedUserForContact.last_name}` 
                    : selectedUserForContact.username || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">שם איש קשר:</label>
                <p className="text-right bg-gray-50 p-2 rounded">
                  {selectedUserForContact.contact_name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right mb-1">טלפון איש קשר:</label>
                <p className="text-right bg-gray-50 p-2 rounded">
                  {selectedUserForContact.contact_phone || '-'}
                </p>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowContactPopup(false);
                    setSelectedUserForContact(null);
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
    </div>
  );
}
