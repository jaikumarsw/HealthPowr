import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { requestsApi } from '../../api/requests';
import { useAuth } from '../../contexts/AuthContext';

type AdminRequest = {
  id: string;
  category: string;
  borough: string;
  status: string;
  created_at: string;
  assigned_org_id: string | null;
  member?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[];
  organization?: { name?: string } | { name?: string }[];
};

export function RequestsListView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const reqData = await requestsApi.getAllRequests();
      setRequests(reqData);
    } catch (e: any) {
      // Most common cause is RLS denying admin access.
      const msg = e?.message || 'Unknown error';
      setError(`Unable to load requests. ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const member = Array.isArray(r.member) ? r.member[0] : r.member;
      const haystack = `${member?.full_name || ''} ${r.category} ${r.borough}`.toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    });
  }, [requests, searchTerm]);

  const statusCounts = useMemo(() => {
    return requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [requests]);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
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
      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
      link.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Requests failed to load.</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-600">
            If you see a 403, ensure the admin role has RLS SELECT permissions for `service_requests` and joined tables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['new', 'in_review', 'in_progress', 'closed'].map((status) => (
          <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase">{status.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{statusCounts[status] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by member, category, borough..."
            className="w-full h-10 border border-gray-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className="h-10 px-4 rounded-lg bg-teal-600 text-white flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 whitespace-nowrap flex-shrink-0 min-w-[190px]"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export Requests CSV'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs text-gray-500 uppercase">Member</th>
              <th className="px-4 py-3 text-xs text-gray-500 uppercase">Request</th>
              <th className="px-4 py-3 text-xs text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs text-gray-500 uppercase">Routed Organization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={4}>
                  No requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const member = Array.isArray(req.member) ? req.member[0] : req.member;
                const org = Array.isArray(req.organization) ? req.organization[0] : req.organization;
                return (
                  <tr key={req.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{member?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{member?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 capitalize">{req.category.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{req.borough}</p>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{req.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {org?.name || (req.assigned_org_id ? 'Assigned' : 'Unassigned')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
