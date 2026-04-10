import { useState } from 'react';
import { ClientHeader } from './ClientHeader';
import { ClientSidebar } from './ClientSidebar';
import { ServicesView } from './ServicesView';
import { MapView } from './MapView';
import { ApplicationsView } from './ApplicationsView';
import { MessagesView } from './MessagesView';
import { ProfileView } from './ProfileView';
import { CommunityView } from './CommunityView';
import { ApplicationForm } from './ApplicationForm';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type ClientView = 'services' | 'map' | 'applications' | 'messages' | 'profile' | 'community' | 'application-form';

export function ClientDashboard() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ClientView>('services');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  const renderView = () => {
    switch (currentView) {
      case 'services':
        return <ServicesView />;
      case 'map':
        return <MapView />;
      case 'applications':
        return <ApplicationsView />;
      case 'messages':
        return <MessagesView />;
      case 'profile':
        return <ProfileView />;
      case 'community':
        return <CommunityView />;
      case 'application-form':
        return (
          <ApplicationForm
            serviceName="Emergency Housing Assistance"
            organization="Community Housing Alliance"
            onSubmit={() => {
              setCurrentView('applications');
            }}
            onSave={() => {}}
            onCancel={() => setCurrentView('services')}
          />
        );
      default:
        return <ServicesView />;
    }
  };

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <ClientSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ClientHeader 
          user={user} 
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 min-w-0">
          <div
            className={
              currentView === "map"
                ? "w-full min-w-0"
                : "max-w-[1200px] mx-auto w-full min-w-0"
            }
          >
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}