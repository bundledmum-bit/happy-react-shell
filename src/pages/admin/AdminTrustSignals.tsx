import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GripVertical, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import {
  useAllTrustSignals, useUpsertTrustSignal, useDeleteTrustSignal,
  type TrustSignal,
} from "@/hooks/useHomepage";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const btnPrimary = "inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-forest-deep";

export default function AdminTrustSignals() {
  const { data: items } = useAllTrustSignals();
  const upsert = useUpsertTrustSignal();
  const del = useDeleteTrustSignal();
  const [drafts, setDrafts] = useState<TrustSignal[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  useEffect(() => { if (items) setDrafts(items); }, [items]);

  const add = () => {
    const next = (drafts[drafts.length - 1]?.display_order ?? 0) + 1;
    upsert.mutateAsync({ icon: "✅", label: "New trust signal", sublabel: "", is_active: true, display_order: next } as any)
      .then(() => toast.success("Added"));
  };

  const handleDrop = async (targetId: string) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return; }
    const next = [...drafts];
    const from = next.findIndex(s => s.id === draggingId);
    const to = next.findIndex(s => s.id === targetId);
    if (from < 0 || to < 0) { setDraggingId(null); return; }
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setDrafts(next);
    setDraggingId(null);
    await Promise.all(next.map((s, i) => upsert.mutateAsync({ id: s.id, display_order: i } as any)));
    toast.success("Order saved");
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-forest flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> Trust Signals</h1>
          <p className="text-xs text-text-light mt-1">Badges shown in the homepage trust strip (e.g. "🔒 Paystack secure", "🚚 Lagos next-day").</p>
        </div>
        <button onClick={add} className={btnPrimary}><Plus className="w-3.5 h-3.5" /> Add</button>
      </header>

      <div className="space-y-2">
        {drafts.map(t => (
          <Row
            key={t.id}
            t={t}
            draggingId={draggingId}
            onDragStart={() => setDraggingId(t.id)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={() => handleDrop(t.id)}
            onDragEnd={() => setDraggingId(null)}
            onSave={p => upsert.mutateAsync({ id: t.id, ...p } as any).then(() => toast.success("Saved"))}
            onDelete={() => { if (confirm("Delete?")) del.mutateAsync(t.id).then(() => toast.success("Deleted")); }}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  t, draggingId, onDragStart, onDragOver, onDrop, onDragEnd, onSave, onDelete,
}: {
  t: TrustSignal;
  draggingId: string | null;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onSave: (p: Partial<TrustSignal>) => Promise<any>;
  onDelete: () => void;
}) {
  const [d, setD] = useState<TrustSignal>(t);
  useEffect(() => { setD(t); }, [t]);
  const dirty = JSON.stringify(d) !== JSON.stringify(t);
  const isDragging = draggingId === t.id;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-card border border-border rounded-xl p-3 flex items-center gap-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <GripVertical className="w-4 h-4 text-text-light cursor-grab flex-shrink-0" />
      <input value={d.icon} onChange={e => setD({ ...d, icon: e.target.value })} className="w-14 border border-input rounded px-2 py-1 text-center text-lg bg-background" />
      <input value={d.label} onChange={e => setD({ ...d, label: e.target.value })} placeholder="Label" className={inputCls + " flex-1"} />
      <input value={d.sublabel || ""} onChange={e => setD({ ...d, sublabel: e.target.value })} placeholder="Sublabel (optional)" className={inputCls + " flex-1"} />
      <label className="flex items-center gap-1 text-[11px] ml-1"><input type="checkbox" checked={!!d.is_active} onChange={e => setD({ ...d, is_active: e.target.checked })} /> Active</label>
      <button onClick={() => onSave({ icon: d.icon, label: d.label, sublabel: d.sublabel, is_active: d.is_active })} disabled={!dirty} className="text-forest hover:underline text-xs font-semibold disabled:text-text-light disabled:no-underline">Save</button>
      <button onClick={onDelete} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}
