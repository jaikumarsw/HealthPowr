import { useState } from 'react';
import { CBOHeader } from './CBOHeader';
import { CBOSidebar } from './CBOSidebar';
import { CBOOverview } from './CBOOverview';
import { ClientsView } from './ClientsView';
import { ServicesView } from './ServicesView';
import { MessagesView } from './MessagesView';
import { SettingsView } from './SettingsView';
import { HelpSupportView } from './HelpSupportView';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../../api/requests';
import { organizationsApi } from '../../lib/organzationsApi';
import { useEffect, useRef } from 'react';

export type CBOView =
  | 'overview'
  | 'clients'
  | 'assigned'
  | 'services'
  | 'messages'
  | 'settings'
  | 'help';

export function CBODashboard() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CBOView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membershipRole, setMembershipRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrapAttempted = useRef(false);
  const isRestrictedRole = membershipRole === 'member' || membershipRole === null;

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadRole() {
      try {
        const ctx = await requestsApi.getMyOrgMembership();
        if (!active) return;

        if (ctx.orgId) {
          const role = (ctx.role as 'owner' | 'admin' | 'member' | null) ?? null;
          setOrgId(ctx.orgId);
          setMembershipRole(role);
          if (role === 'member') setCurrentView('assigned');
          setMembershipLoaded(true);
          return;
        }

        // No org found — attempt to bootstrap from user metadata (handles first
        // login after email verification and accounts created before the fix).
        if (!bootstrapAttempted.current && user.organization?.trim()) {
          bootstrapAttempted.current = true;
          try {
            await organizationsApi.setupOrganizationForUser({
              ownerId: user.id,
              name: user.organization,
              borough: 'Manhattan',
              email: user.email,
            });
            // Re-fetch membership after creation
            const retryCtx = await requestsApi.getMyOrgMembership();
            if (!active) return;
            if (retryCtx.orgId) {
              const role = (retryCtx.role as 'owner' | 'admin' | 'member' | null) ?? null;
              setOrgId(retryCtx.orgId);
              setMembershipRole(role);
              if (role === 'member') setCurrentView('assigned');
              setMembershipLoaded(true);
              return;
            }
          } catch {
            // Fall through to show the error state below
          }
        }

        if (!active) return;
        setOrgId(null);
        setMembershipRole(null);
        setMembershipLoaded(true);
        if (!user.organization?.trim()) {
          setBootstrapError(null);
        } else {
          setBootstrapError(
            'Your account was created but we could not link it to an organization. Please sign out and sign in again, or contact support.',
          );
        }
      } catch {
        if (!active) return;
        setMembershipRole(null);
        setMembershipLoaded(true);
      }
    }

    void loadRole();
    return () => { active = false; };
  }, [user]);

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

  if (!membershipLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-200 border-t-teal-600 mx-auto" />
          <p className="text-sm text-gray-500">Setting up your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!orgId) {
    const isOrgOwner = !!user.organization?.trim();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center">
          {isOrgOwner ? (
            <>
              <p className="text-lg font-bold text-gray-900">Organization setup incomplete</p>
              <p className="text-sm text-gray-600 mt-2">
                {bootstrapError ??
                  'We could not finish setting up your organization. Please sign out and sign back in to retry.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  Sign out &amp; retry
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-900">No organization access found</p>
              <p className="text-sm text-gray-600 mt-2">
                This account is not linked to any organization. If you are staff, sign in from the
                staff portal with your credentials.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/staff-login', { replace: true })}
                  className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  Go to staff login
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleViewChange = (nextView: CBOView) => {
    if (!isRestrictedRole) {
      setCurrentView(nextView);
      return;
    }
    const allowedForStaff: CBOView[] = ['assigned', 'messages', 'help'];
    setCurrentView(allowedForStaff.includes(nextView) ? nextView : 'assigned');
  };

  const renderView = () => {
    if (isRestrictedRole && !['assigned', 'messages', 'help'].includes(currentView)) {
      return <ClientsView staffMode />;
    }
    switch (currentView) {
      case 'overview': return <CBOOverview />;
      case 'clients': return <ClientsView />;
      case 'assigned': return <ClientsView staffMode />;
      case 'services': return <ServicesView />;
      case 'messages': return <MessagesView />;
      case 'settings': return <SettingsView />;
      case 'help': return <HelpSupportView />;
      default: return <CBOOverview />;
    }
  };

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <CBOSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        membershipRole={membershipRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <CBOHeader
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          membershipRole={membershipRole}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto w-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
