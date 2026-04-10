import { useState } from 'react';
import { 
  Building2, FileText, BarChart3, LogOut, Bell, Menu, ShieldCheck, Download, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RequestsListView } from './RequestsListView';
import { OrganizationsListView } from './OrganizationsListView';
import { useEffect } from 'react';
import { requestsApi } from '../../api/requests';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  // Mobile: start closed. Desktop (lg+): always open via media query effect below.
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const menuItems = [
    { id: 'requests', label: 'All Requests', icon: FileText },
    { id: 'orgs', label: 'Organizations', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  useEffect(() => {
    if (!user || activeTab !== 'reports') return;
    requestsApi.getStatusCounts().then(setCounts).catch(() => setCounts({}));
  }, [activeTab, user]);

  // Keep sidebar responsive: closed on small screens, pinned open on lg+.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => setSidebarOpen(mql.matches);
    update();

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }

    // Safari fallback
    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(update);
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(update);
  }, []);

  const handleReportsExport = async () => {
    const data = await requestsApi.exportCsv();
    const headers = ['ID', 'Category', 'Borough', 'Status', 'Member', 'Organization', 'Created At'];
    const rows = data.map((r: any) => [
      r.id,
      r.category,
      r.borough,
      r.status,
      r.member?.[0]?.full_name || '',
      r.organization?.[0]?.name || '',
      new Date(r.created_at).toLocaleDateString()
    ]);
    const csv = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `request-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] text-white transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'}
        lg:static lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-bold text-lg">H</div>
              <span className="font-bold text-lg uppercase tracking-wider">HealthPowr <span className="text-teal-500">Admin</span></span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700/60 transition-colors"
              aria-label="Close admin sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close drawer after navigating on mobile.
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all uppercase tracking-tight font-bold text-[13px]
                    ${activeTab === item.id 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all uppercase tracking-tight font-bold text-[13px]"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-400" />
            </button>
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Admin Authorization Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-gray-900 uppercase">Administrator</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-tight">{user?.email}</p>
              </div>
              <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700">A</div>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeTab === 'requests' && <RequestsListView />}
          {activeTab === 'orgs' && <OrganizationsListView />}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <button
                onClick={() => void handleReportsExport()}
                className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm flex items-center gap-2 hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 whitespace-nowrap flex-shrink-0 min-w-[190px]"
              >
                <Download className="w-4 h-4" />
                Export Requests CSV
              </button>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['new', 'in_review', 'in_progress', 'closed'].map((status) => (
                  <div key={status} className="bg-white p-6 rounded-2xl border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{status.replace('_', ' ')}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{counts[status] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
