import { CBOHeader } from './CBOHeader';
import { CBOSidebar } from './CBOSidebar';
import { CBOOverview } from './CBOOverview';
import { ClientsView } from './ClientsView';
import { ServicesView } from './ServicesView';
import { MessagesView } from './MessagesView';
import { SettingsView } from './SettingsView';
import { HelpSupportView } from './HelpSupportView';
import { AccountSettingsView } from '../shared/AccountSettingsView';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { requestsApi } from '../../api/requests';
import { organizationsApi } from '../../lib/organzationsApi';
import { useEffect, useRef, useState } from 'react';

export type CBOView =
  | 'overview'
  | 'clients'
  | 'assigned'
  | 'services'
  | 'messages'
  | 'settings'
  | 'help'
  | 'account';

const ALL_VIEWS: CBOView[] = ['overview', 'clients', 'assigned', 'services', 'messages', 'settings', 'help', 'account'];
const STAFF_VIEWS: CBOView[] = ['assigned', 'messages', 'help', 'account'];

function viewFromPath(pathname: string): CBOView | null {
  const seg = pathname.replace(/^\/cbo\/?/, '').split('/')[0] as CBOView;
  return ALL_VIEWS.includes(seg) ? seg : null;
}

export function CBODashboard() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membershipRole, setMembershipRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [membershipLoaded, setMembershipLoaded] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const bootstrapAttempted = useRef(false);
  const isRestrictedRole = membershipRole === 'member' || membershipRole === null;

  // Derive current view from URL — falls back to null until membership loads
  const urlView = viewFromPath(pathname);

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
          setMembershipLoaded(true);

          // Redirect to default view when landing on bare /cbo
          const view = viewFromPath(pathname);
          if (!view) {
            navigate(role === 'member' ? '/cbo/assigned' : '/cbo/overview', { replace: true });
          } else if (role === 'member' && !STAFF_VIEWS.includes(view)) {
            navigate('/cbo/assigned', { replace: true });
          }
          return;
        }

        // No org found — attempt to bootstrap from user metadata
        if (!bootstrapAttempted.current && user.organization?.trim()) {
          bootstrapAttempted.current = true;
          try {
            await organizationsApi.setupOrganizationForUser({
              ownerId: user.id,
              name: user.organization,
              borough: 'Manhattan',
              email: user.email,
            });
            const retryCtx = await requestsApi.getMyOrgMembership();
            if (!active) return;
            if (retryCtx.orgId) {
              const role = (retryCtx.role as 'owner' | 'admin' | 'member' | null) ?? null;
              setOrgId(retryCtx.orgId);
              setMembershipRole(role);
              setMembershipLoaded(true);
              if (!viewFromPath(pathname)) {
                navigate(role === 'member' ? '/cbo/assigned' : '/cbo/overview', { replace: true });
              }
              return;
            }
          } catch {
            // Fall through to show error state
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Determine effective view from URL, gated by role
  const effectiveView: CBOView = (() => {
    const v = urlView;
    if (!v) return isRestrictedRole ? 'assigned' : 'overview';
    if (isRestrictedRole && !STAFF_VIEWS.includes(v)) return 'assigned';
    return v;
  })();

  const handleViewChange = (nextView: CBOView) => {
    const allowed = isRestrictedRole
      ? (STAFF_VIEWS.includes(nextView) ? nextView : 'assigned')
      : nextView;
    navigate(`/cbo/${allowed}`);
    setSidebarOpen(false);
  };

  const renderView = () => {
    switch (effectiveView) {
      case 'overview':  return <CBOOverview />;
      case 'clients':   return <ClientsView />;
      case 'assigned':  return <ClientsView staffMode />;
      case 'services':  return <ServicesView />;
      case 'messages':  return <MessagesView />;
      case 'settings':  return <SettingsView />;
      case 'help':      return <HelpSupportView />;
      case 'account':   return <AccountSettingsView hideBorough />;
      default:          return <CBOOverview />;
    }
  };

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <CBOSidebar
        currentView={effectiveView}
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
          onAccountSettings={() => handleViewChange('account')}
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
