import { useAdminUser, hasPermission } from "./useAdminPermissions";

/**
 * Hook to check if the current admin user has a specific permission.
 * Returns { canView, canEdit, canDelete, canCreate } for a given section.
 */
export function usePermissionCheck(section: string) {
  const { data: adminUser } = useAdminUser();

  return {
    adminUser,
    canView: hasPermission(adminUser, section, "view"),
    canEdit: hasPermission(adminUser, section, "edit"),
    canDelete: hasPermission(adminUser, section, "delete"),
    canCreate: hasPermission(adminUser, section, "create"),
    canExport: hasPermission(adminUser, section, "export"),
  };
}
