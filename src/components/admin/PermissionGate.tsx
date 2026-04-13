import { ReactNode } from "react";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";
import AccessDenied from "@/components/admin/AccessDenied";

interface Props {
  module: string;
  action: string;
  children: ReactNode;
}

export default function PermissionGate({ module, action, children }: Props) {
  const { can, loading } = usePermissions();

  if (loading) return null;
  if (!can(module, action)) return <AccessDenied />;
  return <>{children}</>;
}
