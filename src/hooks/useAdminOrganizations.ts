import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgsApi } from "../api/organizations";

export type AdminOrgStatus = "pending" | "approved" | "rejected" | "suspended";

export type AdminOrg = {
  id: string;
  name: string;
  borough: string;
  status: AdminOrgStatus;
  email?: string | null;
  phone?: string | null;
  rejection_reason?: string | null;
};

export const adminOrganizationsQueryKeys = {
  all: ["admin", "organizations"] as const,
  list: () => [...adminOrganizationsQueryKeys.all, "list"] as const,
};

export function useAdminOrganizations(enabled: boolean) {
  return useQuery({
    queryKey: adminOrganizationsQueryKeys.list(),
    queryFn: async () => (await orgsApi.getAll()) as AdminOrg[],
    enabled,
    staleTime: 10_000,
  });
}

export function useUpdateOrganizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orgId: string;
      status: "approved" | "rejected" | "suspended";
      reason?: string;
    }) => orgsApi.updateStatus(input.orgId, input.status, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminOrganizationsQueryKeys.all,
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orgId: string) => orgsApi.delete(orgId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminOrganizationsQueryKeys.all,
      });
    },
  });
}
