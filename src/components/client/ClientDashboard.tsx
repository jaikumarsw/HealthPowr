import { ClientHeader } from './ClientHeader';
import { ClientSidebar } from './ClientSidebar';
import { ServicesView } from './ServicesView';
import { MapView } from './MapView';
import { ApplicationsView } from './ApplicationsView';
import { MessagesView } from './MessagesView';
import { ProfileView } from './ProfileView';
import { CommunityView } from './CommunityView';
import { ApplicationForm } from './ApplicationForm';
import { AccountSettingsView } from '../shared/AccountSettingsView';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export type ClientView =
  | 'services'
  | 'map'
  | 'applications'
  | 'messages'
  | 'profile'
  | 'community'
  | 'application-form'
  | 'account';

const ALL_CLIENT_VIEWS: ClientView[] = [
  'services', 'map', 'applications', 'messages', 'profile', 'community', 'application-form', 'account',
];

function viewFromPath(pathname: string): ClientView | null {
  const seg = pathname.replace(/^\/client\/?/, '').split('/')[0] as ClientView;
  return ALL_CLIENT_VIEWS.includes(seg) ? seg : null;
}

export function ClientDashboard() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect bare /client to /client/services
  useEffect(() => {
    if (!viewFromPath(pathname)) {
      navigate('/client/services', { replace: true });
    }
  }, [pathname, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-200 border-t-teal-600" />
      </div>
    );
  }

  if (!user) return null;

  const currentView: ClientView = viewFromPath(pathname) ?? 'services';

  const handleViewChange = (view: ClientView) => {
    navigate(`/client/${view}`);
    setSidebarOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'services':         return <ServicesView />;
      case 'map':              return <MapView />;
      case 'applications':     return <ApplicationsView />;
      case 'messages':         return <MessagesView />;
      case 'profile':          return <ProfileView />;
      case 'community':        return <CommunityView />;
      case 'account':          return <AccountSettingsView />;
      case 'application-form': return (
        <ApplicationForm
          serviceName="Emergency Housing Assistance"
          organization="Community Housing Alliance"
          onSubmit={() => navigate('/client/applications')}
          onSave={() => {}}
          onCancel={() => navigate('/client/services')}
        />
      );
      default: return <ServicesView />;
    }
  };

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <ClientSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ClientHeader
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onAccountSettings={() => handleViewChange('account')}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 min-w-0">
          <div
            className={
              currentView === 'map'
                ? 'w-full min-w-0'
                : 'max-w-[1200px] mx-auto w-full min-w-0'
            }
          >
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
