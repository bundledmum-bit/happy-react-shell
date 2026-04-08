import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface BulkAction {
  label: string;
  value: string;
  destructive?: boolean;
}

interface Props {
  selectedCount: number;
  actions: BulkAction[];
  onApply: (action: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  totalCount: number;
  allSelected: boolean;
}

export default function BulkActionsBar({ selectedCount, actions, onApply, onSelectAll, onDeselectAll, totalCount, allSelected }: Props) {
  const [action, setAction] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-forest/5 border border-forest/20 rounded-lg px-4 py-2 mb-4">
      <span className="text-xs font-semibold text-forest">{selectedCount} selected</span>
      <button onClick={allSelected ? onDeselectAll : onSelectAll} className="text-xs text-forest underline">
        {allSelected ? "Deselect all" : `Select all ${totalCount}`}
      </button>
      <div className="flex items-center gap-2 ml-auto">
        <select value={action} onChange={e => setAction(e.target.value)}
          className="border border-input rounded-lg px-3 py-1.5 text-xs bg-background">
          <option value="">Bulk actions...</option>
          {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <button onClick={() => { if (action) onApply(action); setAction(""); }}
          disabled={!action}
          className="px-3 py-1.5 bg-forest text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50">
          Apply
        </button>
      </div>
    </div>
  );
}
