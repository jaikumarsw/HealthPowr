import { useEffect, useMemo, useState } from 'react';
import { requestsApi } from '../../api/requests';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function CBOOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [teamActivity, setTeamActivity] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoading(true);
        const myOrgId = await requestsApi.getMyOrgId();
        setOrgId(myOrgId);
        const [statusCounts, requests, activity] = await Promise.all([
          requestsApi.getOrgStatusCounts(),
          requestsApi.getOrgRequests(),
          requestsApi.getOrgTeamActivity(10),
        ]);
        setCounts(statusCounts);
        setRecentRequests(requests.slice(0, 8));
        setTeamActivity(activity);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  const reload = useMemo(() => {
    return async () => {
      const [statusCounts, requests, activity] = await Promise.all([
        requestsApi.getOrgStatusCounts(),
        requestsApi.getOrgRequests(),
        requestsApi.getOrgTeamActivity(10),
      ]);
      setCounts(statusCounts);
      setRecentRequests(requests.slice(0, 8));
      setTeamActivity(activity);
    };
  }, []);

  useEffect(() => {
    if (!user || !orgId) return;

    const channel = supabase
      .channel(`cbo-overview-requests-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `assigned_org_id=eq.${orgId}`,
        },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, reload, user]);

  if (loading) return <div className="py-20 text-center text-gray-500">Loading overview...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['new', 'in_review', 'in_progress', 'closed'].map((status) => (
          <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase">{status.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{counts[status] || 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Recent Requests</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRequests.map((req) => (
            <div key={req.id} className="px-4 py-3">
              <p className="font-medium text-gray-900">{req.member?.full_name || 'Service Request'}</p>
              <p className="text-sm text-gray-600 capitalize">{req.category.replace('_', ' ')} - {req.borough}</p>
            </div>
          ))}
          {recentRequests.length === 0 && <div className="px-4 py-8 text-center text-gray-500">No requests found.</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Team Activity</p>
        </div>
        <div className="divide-y divide-gray-100">
          {teamActivity.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                {item.actor}
              </p>
              <p className="text-sm text-gray-700 mt-0.5">{item.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                Request {item.request_id?.slice?.(0, 8)} •{" "}
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {teamActivity.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No activity yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
