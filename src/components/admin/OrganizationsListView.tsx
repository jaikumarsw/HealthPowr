import { useMemo, useState } from "react";
import { Check, PauseCircle, Search, Trash2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAdminOrganizations,
  useDeleteOrganization,
  useUpdateOrganizationStatus,
  type AdminOrg,
  type AdminOrgStatus,
} from "../../hooks/useAdminOrganizations";

export function OrganizationsListView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const orgsQuery = useAdminOrganizations(!!user);
  const updateStatus = useUpdateOrganizationStatus();
  const deleteOrg = useDeleteOrganization();

  const orgs = (orgsQuery.data ?? []) as AdminOrg[];
  const loading = orgsQuery.isLoading;

  const filtered = useMemo(() => {
    const items = orgs.filter((o) =>
      `${o.name} ${o.borough}`.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return [...items].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [orgs, searchTerm]);

  async function handleSetStatus(
    id: string,
    status: Exclude<AdminOrgStatus, "pending">,
  ) {
    try {
      setUpdatingId(id);
      await updateStatus.mutateAsync({
        orgId: id,
        status,
        reason:
          status === "rejected"
            ? rejectReason[id] || "Not provided"
            : undefined,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        Loading organizations...
      </div>
    );
  }

  if (orgsQuery.isError) {
    return (
      <div className="py-20 text-center text-red-600">
        Failed to load organizations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search organizations by name or borough..."
          className="w-full h-10 border border-gray-200 rounded-lg pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No organizations match your search.
          </div>
        ) : (
          filtered.map((org) => (
            <div
              key={org.id}
              className={`rounded-xl border p-4 ${org.status === "pending" ? "border-amber-300 bg-amber-50/40" : "border-gray-200 bg-white"}`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{org.name}</p>
                  <p className="text-sm text-gray-600">{org.borough}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {org.status}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {(org.status === "pending" || org.status === "suspended") && (
                    <input
                      value={rejectReason[org.id] || ""}
                      onChange={(e) =>
                        setRejectReason((prev) => ({
                          ...prev,
                          [org.id]: e.target.value,
                        }))
                      }
                      placeholder="Rejection reason"
                      className="h-9 border border-gray-200 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    />
                  )}

                  {org.status !== "approved" && (
                    <button
                      disabled={updatingId === org.id}
                      onClick={() => void handleSetStatus(org.id, "approved")}
                      className="h-9 px-3 rounded-lg bg-green-600 text-white text-sm flex items-center gap-1 hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  )}

                  {(org.status === "pending" || org.status === "approved") && (
                    <button
                      disabled={updatingId === org.id}
                      onClick={() => void handleSetStatus(org.id, "suspended")}
                      className="h-9 px-3 rounded-lg bg-amber-600 text-white text-sm flex items-center gap-1 hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Suspend
                    </button>
                  )}

                  {(org.status === "pending" || org.status === "suspended") && (
                    <button
                      disabled={updatingId === org.id}
                      onClick={() => void handleSetStatus(org.id, "rejected")}
                      className="h-9 px-3 rounded-lg bg-red-600 text-white text-sm flex items-center gap-1 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  )}

                  <button
                    disabled={deleteOrg.isPending}
                    onClick={async () => {
                      const first = window.confirm(
                        `Delete organization "${org.name}"? This cannot be undone.`,
                      );
                      if (!first) return;
                      const second = window.confirm(
                        `This will delete "${org.name}" and may remove related services/members. Continue?`,
                      );
                      if (!second) return;
                      await deleteOrg.mutateAsync(org.id);
                    }}
                    className="h-9 px-3 rounded-lg border border-red-200 text-red-700 text-sm flex items-center gap-1 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Delete organization"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
              {org.rejection_reason && (
                <p className="text-xs text-red-600 mt-2">
                  Previous rejection: {org.rejection_reason}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
