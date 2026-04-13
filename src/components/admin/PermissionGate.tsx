import { usePagePermission } from "@/hooks/usePagePermission";
import AccessDenied from "./AccessDenied";

interface Props {
  module: string;
  action: string;
  children: React.ReactNode;
}

export default function PermissionGate({ module, action, children }: Props) {
  const { allowed, loading } = usePagePermission(module, action);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!allowed) return <AccessDenied />;

  return <>{children}</>;
}
