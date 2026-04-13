import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldX className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-bold mb-1">Access Denied</h2>
      <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
    </div>
  );
}
