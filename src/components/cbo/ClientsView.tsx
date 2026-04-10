import { useMemo, useState, useEffect } from "react";
import { Search, Eye, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { requestsApi } from "../../api/requests";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export function ClientsView({ staffMode = false }: { staffMode?: boolean }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [orgId, setOrgId] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<
    "owner" | "admin" | "member" | null
  >(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadRequests() {
      try {
        setLoading(true);
        const ctx = await requestsApi.getMyOrgMembership();
        const [members, data] = await Promise.all([
          staffMode ? Promise.resolve([]) : requestsApi.getOrgTeamMembers(),
          requestsApi.getOrgRequests(),
        ]);
        setOrgId(ctx.orgId);
        setMembershipRole(ctx.role);
        setTeamMembers(members);
        setRequests(data);
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
      const [members, data] = await Promise.all([
        staffMode ? Promise.resolve([]) : requestsApi.getOrgTeamMembers(),
        requestsApi.getOrgRequests(),
      ]);
      setTeamMembers(members);
      setRequests(data);
    };
  }, [staffMode]);

  useEffect(() => {
    if (!user || !orgId) return;

    const channel = supabase
      .channel(`cbo-requests-${orgId}`)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "new":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-teal-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-green-100 text-green-700";
      case "new":
        return "bg-yellow-100 text-yellow-700";
      case "in_progress":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || req.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await requestsApi.updateStatus(id, status as any);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    } catch {
      alert("Failed to update status");
    }
  };

  const handleAddNote = async (requestId: string) => {
    const content = (noteDraft[requestId] || "").trim();
    if (!content) return;
    try {
      if (!user) return;
      await supabase.from("request_notes").insert({
        request_id: requestId,
        author_id: user.id,
        content,
        is_internal: true,
      });
      setNoteDraft((prev) => ({ ...prev, [requestId]: "" }));
      await reload();
    } catch {
      // Failed to add note
    }
  };

  const handleAssignStaff = async (requestId: string, staffId: string) => {
    try {
      await requestsApi.assignToStaff(requestId, staffId || null);
      await reload();
    } catch (e: any) {
      alert(e?.message || "Failed to assign request");
    }
  };

  const canAssign =
    !staffMode && (membershipRole === "owner" || membershipRole === "admin");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-gray-900 mb-1 uppercase tracking-tight">
          {staffMode ? "My Workspace" : "Service Requests"}
        </h1>
        <p className="text-[14px] text-gray-500 uppercase tracking-tight">
          {staffMode
            ? "Assigned requests only"
            : membershipRole === "member"
            ? "Your assigned requests"
            : "Manage incoming requests from community members"}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200 p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-[18px] h-[18px] text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 h-11 border border-gray-200 rounded-lg text-[14px] focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all placeholder-gray-400 uppercase tracking-tight"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 border border-gray-200 rounded-lg px-4 text-[14px] font-bold text-gray-600 outline-none focus:border-teal-600 uppercase tracking-tight bg-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Borough
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Date
              </th>
              {!staffMode && (
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Assigned Staff
                </th>
              )}
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRequests.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-teal-50/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="text-[14px] font-bold text-gray-900 uppercase tracking-tight">
                    {req.member?.full_name || "Anonymous"}
                  </p>
                  <p className="text-[12px] text-gray-400 truncate max-w-[200px]">
                    {req.description}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] font-medium text-gray-600 uppercase tracking-tight">
                    {req.category.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-[13px] text-gray-600 font-medium uppercase tracking-tight">
                  {req.borough}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(req.status)}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${getStatusColor(req.status)}`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] text-gray-500 font-bold uppercase tracking-tight">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                {!staffMode && (
                  <td className="px-6 py-4">
                    {canAssign ? (
                      <select
                        value={req.assigned_staff?.id || ""}
                        onChange={(e) =>
                          void handleAssignStaff(req.id, e.target.value)
                        }
                        className="text-[12px] border border-gray-200 rounded px-2 py-1 bg-white focus:border-teal-600 outline-none font-bold text-gray-600"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.profile_id} value={m.profile_id}>
                            {m.full_name} ({m.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[12px] text-gray-700 font-semibold">
                        {req.assigned_staff?.full_name || "Unassigned"}
                      </span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <select
                      value={req.status}
                      onChange={(e) =>
                        handleUpdateStatus(req.id, e.target.value)
                      }
                      className="text-[12px] border border-gray-200 rounded px-2 py-1 bg-white focus:border-teal-600 outline-none uppercase font-bold text-gray-600"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 bg-gray-50 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all border border-transparent"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={noteDraft[req.id] || ""}
                      onChange={(e) =>
                        setNoteDraft((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      placeholder="Add internal note..."
                      className="h-8 px-2 text-xs border border-gray-200 rounded"
                    />
                    <button
                      onClick={() => void handleAddNote(req.id)}
                      className="h-8 px-2 text-xs bg-gray-100 rounded"
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>No service requests found</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Request audit trail
                </p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {selectedRequest.category?.replace("_", " ")} request
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-[11px] text-gray-400 uppercase">Member</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedRequest.member?.full_name || "Anonymous"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-[11px] text-gray-400 uppercase">
                    Assigned Staff
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedRequest.assigned_staff?.full_name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-[11px] text-gray-400 uppercase">Description</p>
                <p className="text-sm text-gray-800 mt-1">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-[11px] text-gray-500 uppercase font-semibold">
                    Full case history
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    ...(selectedRequest.status_history ?? []).map((h: any) => ({
                      id: `status-${h.id}`,
                      created_at: h.created_at,
                      actor: h.changed_by_profile?.full_name || "Staff",
                      title: `Status: ${String(h.new_status || "").replace("_", " ")}`,
                      detail: h.note || "Status updated.",
                    })),
                    ...(selectedRequest.notes ?? []).map((n: any) => ({
                      id: `note-${n.id}`,
                      created_at: n.created_at,
                      actor: n.author?.full_name || "Staff",
                      title: "Internal note",
                      detail: n.content,
                    })),
                  ]
                    .sort(
                      (a, b) =>
                        +new Date(b.created_at) - +new Date(a.created_at),
                    )
                    .map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {item.detail}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          By {item.actor} on{" "}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
