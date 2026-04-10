import { useMemo, useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Eye,
  X
} from 'lucide-react';
import { requestsApi } from '../../api/requests';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ApplicationsView() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadRequests() {
      try {
        setLoading(true);
        const data = await requestsApi.getMyRequests();
        setApplications(data);
      } catch {
        // Failed to load requests
      } finally {
        setLoading(false);
      }
    }
    void loadRequests();
  }, [user]);

  const reload = useMemo(() => {
    return async () => {
      const data = await requestsApi.getMyRequests();
      setApplications(data);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`client-applications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `member_id=eq.${user.id}`,
        },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'new':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5 text-teal-500" />;
      case 'in_review':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-teal-100 text-teal-800';
      case 'in_review':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Applications', count: applications.length },
    { id: 'new', label: 'New', count: applications.filter(app => app.status === 'new').length },
    { id: 'in_review', label: 'In Review', count: applications.filter(app => app.status === 'in_review').length },
    { id: 'in_progress', label: 'In Progress', count: applications.filter(app => app.status === 'in_progress').length },
    { id: 'closed', label: 'Closed', count: applications.filter(app => app.status === 'closed').length }
  ];

  const filteredApplications = selectedTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === selectedTab);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900 mb-1 md:mb-2">My Applications</h1>
        <p className="text-[14px] md:text-[16px] text-gray-600">Track your service applications and their status</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`min-h-[44px] px-4 md:px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 whitespace-nowrap ${
              selectedTab === tab.id
                ? 'bg-teal-600 text-white border-2 border-teal-600 shadow-sm shadow-teal-100'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="text-[14px] md:text-[15px]">{tab.label}</span>
            <span className={`${selectedTab === tab.id ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'} px-2 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-[16px] font-semibold leading-tight text-gray-900 capitalize">{application.category.replace('_', ' ')}</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(application.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {application.organization && (
                  <p className="text-teal-600 font-medium mb-1">{application.organization.name}</p>
                )}
                <p className="text-gray-600 text-sm line-clamp-2">{application.description}</p>
              </div>
              <div className="flex space-x-1 sm:space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedApplication(application)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="View application details"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Submitted: {new Date(application.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Borough: {application.borough}</span>
              </div>
            </div>

            {application.status_history?.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-[12px] font-semibold text-gray-400 uppercase mb-2">Latest Update</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{application.status_history[0].note || 'Status updated.'}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    By {application.status_history[0].changed_by?.full_name || 'Staff'} on {new Date(application.status_history[0].created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-[18px] font-semibold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">You haven't submitted any applications yet.</p>
        </div>
      )}

      {/* Details modal */}
      {selectedApplication && (
        <div
          className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl md:max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-[12px] text-gray-500 uppercase tracking-wide">
                  Application details
                </p>
                <h3 className="text-[18px] font-bold text-gray-900 truncate">
                  {selectedApplication.category?.replace?.('_', ' ') || 'Service Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">
                    Organization
                  </p>
                  <p className="text-[14px] font-semibold text-gray-900 mt-1">
                    {selectedApplication.organization?.name || 'Not assigned yet'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">
                    Status
                  </p>
                  <p className="text-[14px] font-semibold text-gray-900 mt-1 capitalize">
                    {String(selectedApplication.status || '').replace('_', ' ') || 'new'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">
                    Submitted
                  </p>
                  <p className="text-[14px] font-semibold text-gray-900 mt-1">
                    {selectedApplication.created_at
                      ? new Date(selectedApplication.created_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">
                    Borough
                  </p>
                  <p className="text-[14px] font-semibold text-gray-900 mt-1">
                    {selectedApplication.borough || '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase">
                  Description
                </p>
                <p className="text-[14px] text-gray-800 mt-2 whitespace-pre-wrap">
                  {selectedApplication.description || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">
                    Status history
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {(selectedApplication.status_history ?? []).length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      No updates yet.
                    </div>
                  ) : (
                    (selectedApplication.status_history ?? []).map((h: any) => (
                      <div key={h.id ?? `${h.created_at}-${h.new_status}`} className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {String(h.new_status || '').replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {h.note || 'Status updated.'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {h.changed_by?.full_name ? `By ${h.changed_by.full_name} • ` : ''}
                          {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className="h-10 px-4 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}