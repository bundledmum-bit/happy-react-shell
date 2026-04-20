import { useEffect, useState } from "react";
import { Save, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useDeliverableStates, useUpdateDeliverableState, type DeliverableState } from "@/hooks/useDeliverableStates";

export default function AdminDeliverableStates() {
  const { data: states, isLoading } = useDeliverableStates(false);
  const update = useUpdateDeliverableState();

  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!states) return;
    const next: Record<string, string> = {};
    states.forEach(s => { next[s.id] = s.note || ""; });
    setNotes(next);
  }, [states]);

  const toggleActive = async (state: DeliverableState) => {
    try {
      await update.mutateAsync({ id: state.id, is_active: !state.is_active });
      toast.success(`${state.name} ${!state.is_active ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update state");
    }
  };

  const saveNote = async (state: DeliverableState) => {
    try {
      await update.mutateAsync({ id: state.id, note: notes[state.id] || null });
      toast.success(`${state.name} note saved`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save note");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="pf text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Deliverable States
        </h1>
        <p className="text-text-med text-sm mt-1 max-w-[720px]">
          Toggle which states you deliver to. States with zones (like Lagos) use zone-based delivery fees.
          All others use the default delivery fee from Settings.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading states…</div>
      ) : !states || states.length === 0 ? (
        <div className="text-center py-10 text-text-med">No deliverable states configured yet.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">State</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Pricing</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Note</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med w-[110px]">Save Note</th>
              </tr>
            </thead>
            <tbody>
              {states.map(s => {
                const pendingNote = notes[s.id] ?? "";
                const dirty = (s.note || "") !== pendingNote;
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.is_active && <span className="w-2 h-2 rounded-full bg-green-500" aria-label="Active" />}
                        {!s.is_active && <span className="w-2 h-2 rounded-full bg-border" aria-label="Inactive" />}
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.has_zones ? (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-green-100 text-green-700">Zones</span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-muted text-text-med">Flat rate</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={s.is_active}
                          onChange={() => toggleActive(s)}
                        />
                        <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-forest peer-checked:after:translate-x-4" />
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={pendingNote}
                        onChange={e => setNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="e.g. Coming soon, pilot area"
                        className={`w-full border rounded-lg px-3 py-2 text-sm bg-background ${dirty ? "border-coral" : "border-input"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => saveNote(s)}
                        disabled={!dirty || update.isPending}
                        className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
