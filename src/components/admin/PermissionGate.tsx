import { ReactNode } from "react";
import { usePagePermission } from "@/hooks/usePagePermission";
import AccessDenied from "@/components/admin/AccessDenied";

interface Props {
  module: string;
  action: string;
  children: ReactNode;
}

export default function PermissionGate({ module, action, children }: Props) {
  const { loading, allowed } = usePagePermission(module, action);

  if (loading) return null;
  if (!allowed) return <AccessDenied />;
  return <>{children}</>;
}
