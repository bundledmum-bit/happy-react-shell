import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, GripVertical, Plus, Save, Search, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCouriers,
  useUpdateCourier,
  useCreateCourier,
  useDeleteCourier,
  useReorderCouriers,
  useShippingZonesAdmin,
  useUpdateShippingZone,
  type Courier,
  type AdminShippingZone,
  type SubscriptionPlan,
} from "@/hooks/useCouriers";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";
const sectionCls = "text-xs uppercase tracking-widest font-bold text-text-med mt-4 mb-2";
const saveBtnCls = "inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-40";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fmtN = (n: number) => `₦${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminCouriers() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="pf text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6" /> Courier Partners
        </h1>
        <p className="text-text-med text-sm mt-1 max-w-[720px]">
          Manage delivery partners, zone routing rules, and interstate rate tables.
        </p>
      </div>

      <Tabs defaultValue="partners">
        <TabsList className="mb-4">
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="routing">Zone Routing</TabsTrigger>
          <TabsTrigger value="interstate">Interstate Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-3"><PartnersTab /></TabsContent>
        <TabsContent value="routing" className="space-y-4"><ZoneRoutingTab /></TabsContent>
        <TabsContent value="interstate" className="space-y-4"><InterstateTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable: chip list editor (with optional autocomplete suggestions)
// ---------------------------------------------------------------------------

function ChipList({
  value,
  onChange,
  color = "green",
  placeholder = "Add item and press Enter",
  suggestions,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  color?: "green" | "red" | "grey";
  placeholder?: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const listId = useMemo(() => `dl-${Math.random().toString(36).slice(2, 8)}`, []);
  const palette = {
    green: "bg-green-100 text-green-700 hover:text-green-900",
    red: "bg-red-100 text-red-700 hover:text-red-900",
    grey: "bg-muted text-text-med hover:text-foreground",
  }[color];

  const add = () => {
    const v = input.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((a, i) => (
            <span key={i} className={`text-[10px] font-semibold px-2 py-1 rounded-pill inline-flex items-center gap-1 ${palette}`}>
              {a}
              <button onClick={() => remove(i)} aria-label="Remove"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-text-light text-xs">Empty.</p>
      )}
      <div className="flex gap-2">
        <input
          list={suggestions ? listId : undefined}
          className={inputCls + " flex-1"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button onClick={add} className="px-3 py-2 rounded-lg bg-muted text-xs font-semibold hover:bg-border"><Plus className="w-3.5 h-3.5 inline-block" /> Add</button>
        {suggestions && (
          <datalist id={listId}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 — Partners
// ---------------------------------------------------------------------------

const emptyCourier: Partial<Courier> = {
  name: "",
  is_active: true,
  coverage: [],
  excluded_areas: [],
  pricing_model: "flat_rate",
  subscription_plans: [],
  weight_limit_kg: null,
  weight_rounding: "up",
  express_available: false,
  express_surcharge: null,
  display_order: 99,
};

function PartnersTab() {
  const { data: couriers, isLoading } = useCouriers();
  const reorder = useReorderCouriers();
  const create = useCreateCourier();

  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const filtered = useMemo(() => {
    if (!couriers) return [];
    if (!search.trim()) return couriers;
    const q = search.trim().toLowerCase();
    return couriers.filter(c => c.name.toLowerCase().includes(q));
  }, [couriers, search]);

  const handleDrop = async (targetId: string) => {
    if (!couriers || !draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const ordered = [...couriers];
    const fromIdx = ordered.findIndex(c => c.id === draggingId);
    const toIdx = ordered.findIndex(c => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { setDraggingId(null); return; }
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    setDraggingId(null);
    try {
      await reorder.mutateAsync(ordered.map(c => c.id));
      toast.success("Reordered");
    } catch (e: any) {
      toast.error(e.message || "Reorder failed");
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) { toast.error("Name is required"); return; }
    try {
      const nextOrder = (couriers?.length || 0);
      await create.mutateAsync({ ...emptyCourier, name, display_order: nextOrder });
      toast.success(`${name} added`);
      setAddingNew(false);
      setNewName("");
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    }
  };

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading couriers…</div>;
  if (!couriers) return null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search couriers…"
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background"
          />
        </div>
        {addingNew ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setAddingNew(false); setNewName(""); } }}
              placeholder="Courier name"
              className={inputCls + " w-[200px]"}
            />
            <button onClick={handleCreate} disabled={create.isPending} className={saveBtnCls}><Save className="w-3.5 h-3.5" /> Add</button>
            <button onClick={() => { setAddingNew(false); setNewName(""); }} className="text-xs text-text-med hover:text-destructive">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAddingNew(true)} className="inline-flex items-center gap-1.5 bg-forest-light text-forest px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest/20">
            <Plus className="w-3.5 h-3.5" /> Add courier
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-text-med text-sm">No couriers match "{search}".</div>
      ) : (
        filtered.map(c => (
          <CourierCard
            key={c.id}
            courier={c}
            draggingId={draggingId}
            onDragStart={() => setDraggingId(c.id)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={() => handleDrop(c.id)}
            onDragEnd={() => setDraggingId(null)}
          />
        ))
      )}
    </div>
  );
}

function CourierCard({
  courier,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  courier: Courier;
  draggingId: string | null;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Courier>(courier);
  const update = useUpdateCourier();
  const del = useDeleteCourier();

  useEffect(() => { setDraft(courier); }, [courier]);

  const field = <K extends keyof Courier>(k: K, v: Courier[K]) => setDraft(d => ({ ...d, [k]: v }));

  const addPlan = () => {
    const next = [...(draft.subscription_plans || []), { plan: "New plan", cost: 0, deliveries: 0, valid_days: 30, cost_per_delivery: 0 }];
    field("subscription_plans", next as any);
  };
  const updatePlan = (i: number, changes: Partial<SubscriptionPlan>) => {
    const next = (draft.subscription_plans || []).map((p, idx) => {
      if (idx !== i) return p;
      const merged = { ...p, ...changes } as SubscriptionPlan;
      merged.cost_per_delivery = merged.deliveries > 0 ? Math.round(merged.cost / merged.deliveries) : 0;
      return merged;
    });
    field("subscription_plans", next as any);
  };
  const removePlan = (i: number) => {
    field("subscription_plans", (draft.subscription_plans || []).filter((_, idx) => idx !== i) as any);
  };

  const toggleActive = async () => {
    try {
      await update.mutateAsync({ id: courier.id, is_active: !courier.is_active });
      toast.success(`${courier.name} ${!courier.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
  };

  // Validation warnings
  const warnings: string[] = [];
  if (!draft.name.trim()) warnings.push("Name is required");
  if ((draft.express_surcharge || 0) < 0) warnings.push("Express surcharge must be ≥ 0");
  if ((draft.weight_limit_kg || 0) < 0) warnings.push("Weight limit must be ≥ 0");
  (draft.subscription_plans || []).forEach((p, i) => {
    if (p.deliveries === 0 && draft.pricing_model === "subscription") warnings.push(`Plan ${i + 1}: deliveries must be > 0`);
    if (p.cost < 0) warnings.push(`Plan ${i + 1}: cost must be ≥ 0`);
  });

  const save = async () => {
    if (warnings.length > 0) { toast.error(warnings[0]); return; }
    try {
      await update.mutateAsync(draft);
      toast.success(`${draft.name} saved`);
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  const remove = async () => {
    if (!confirm(`Delete "${courier.name}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(courier.id);
      toast.success(`${courier.name} deleted`);
    } catch (e: any) { toast.error(e.message || "Delete failed"); }
  };

  const isDragging = draggingId === courier.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-card border border-border rounded-xl overflow-hidden transition-opacity ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-text-light cursor-grab flex-shrink-0" />
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left flex-1">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <div>
              <div className="font-bold text-base">{courier.name || <span className="text-text-light italic">Unnamed</span>}</div>
              <div className="text-[11px] text-text-light mt-0.5">
                {courier.pricing_model} · {courier.coverage?.length || 0} zones · {courier.is_active ? "Active" : "Inactive"}
              </div>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" checked={courier.is_active} onChange={toggleActive} />
            <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-forest peer-checked:after:translate-x-4" />
          </label>
          <button onClick={remove} className="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Delete courier">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-5 space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={draft.name} onChange={e => field("name", e.target.value)} />
          </div>

          <h4 className={sectionCls}>Contact & Info</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Address</label><input className={inputCls} value={draft.address || ""} onChange={e => field("address", e.target.value)} /></div>
            <div><label className={labelCls}>Website</label><input className={inputCls} value={draft.website || ""} onChange={e => field("website", e.target.value)} /></div>
            <div><label className={labelCls}>Working Hours</label><input className={inputCls} value={draft.working_hours || ""} onChange={e => field("working_hours", e.target.value)} /></div>
            <div><label className={labelCls}>Working Days</label><input className={inputCls} value={draft.working_days || ""} onChange={e => field("working_days", e.target.value)} /></div>
            <div><label className={labelCls}>Contact WhatsApp</label><input className={inputCls} value={draft.contact_whatsapp || ""} onChange={e => field("contact_whatsapp", e.target.value)} /></div>
            <div><label className={labelCls}>Contact Phone</label><input className={inputCls} value={draft.contact_phone || ""} onChange={e => field("contact_phone", e.target.value)} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Contact Email</label><input className={inputCls} value={draft.contact_email || ""} onChange={e => field("contact_email", e.target.value)} /></div>
          </div>

          <h4 className={sectionCls}>Coverage (zones this partner serves)</h4>
          <ChipList value={draft.coverage || []} onChange={v => field("coverage", v)} color="green" placeholder="e.g. Island, Mainland" />

          <h4 className={sectionCls}>Excluded Areas</h4>
          <ChipList value={draft.excluded_areas || []} onChange={v => field("excluded_areas", v)} color="red" placeholder="e.g. Ajah, Badagry" />

          <h4 className={sectionCls}>Pricing</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Pricing Model</label>
              <select className={inputCls} value={draft.pricing_model} onChange={e => field("pricing_model", e.target.value)}>
                <option value="flat_rate">Flat rate</option>
                <option value="weight_based">Weight-based</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Max kg per booking</label>
              <input type="number" className={inputCls} value={draft.weight_limit_kg ?? ""} onChange={e => field("weight_limit_kg", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className={labelCls}>Weight rounding</label>
              <select className={inputCls} value={draft.weight_rounding || "up"} onChange={e => field("weight_rounding", e.target.value as "up" | "down")}>
                <option value="up">Round up</option>
                <option value="down">Round down</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={draft.express_available} onChange={e => field("express_available", e.target.checked)} />
                Express available
              </label>
            </div>
            {draft.express_available && (
              <div>
                <label className={labelCls}>Express surcharge (₦)</label>
                <input type="number" className={inputCls} value={draft.express_surcharge ?? ""} onChange={e => field("express_surcharge", e.target.value ? Number(e.target.value) : null)} />
              </div>
            )}
          </div>

          {draft.pricing_model === "subscription" && (
            <>
              <h4 className={sectionCls}>Subscription Plans</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-2 text-left">Plan</th>
                      <th className="px-2 py-2 text-right">Cost (₦)</th>
                      <th className="px-2 py-2 text-right">Deliveries</th>
                      <th className="px-2 py-2 text-right">Valid (days)</th>
                      <th className="px-2 py-2 text-right">₦/delivery</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {(draft.subscription_plans || []).map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-1 py-1"><input className={inputCls} value={p.plan} onChange={e => updatePlan(i, { plan: e.target.value })} /></td>
                        <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.cost} onChange={e => updatePlan(i, { cost: Number(e.target.value) })} /></td>
                        <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.deliveries} onChange={e => updatePlan(i, { deliveries: Number(e.target.value) })} /></td>
                        <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.valid_days} onChange={e => updatePlan(i, { valid_days: Number(e.target.value) })} /></td>
                        <td className="px-2 py-1 text-right font-mono text-text-med">{fmtN(p.cost_per_delivery || 0)}</td>
                        <td className="px-1 py-1 text-right"><button onClick={() => removePlan(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addPlan} className="text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add plan</button>
            </>
          )}

          <h4 className={sectionCls}>Special Notes</h4>
          <textarea className={inputCls + " h-24"} value={draft.special_notes || ""} onChange={e => field("special_notes", e.target.value)} />

          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-1">Validation issues</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={save} disabled={update.isPending || warnings.length > 0} className={saveBtnCls}>
              <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save Partner"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 — Zone Routing
// ---------------------------------------------------------------------------

function ZoneRoutingTab() {
  const { data: zones, isLoading } = useShippingZonesAdmin();
  const { data: couriers } = useCouriers();

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading zones…</div>;
  if (!zones || zones.length === 0) return <div className="text-center py-10 text-text-med text-sm">No zones configured.</div>;

  const lagosZones = zones.filter(z => (z.states || []).includes("Lagos"));

  return (
    <div className="space-y-4">
      {lagosZones.map(z => <ZoneRoutingCard key={z.id} zone={z} couriers={couriers || []} />)}
    </div>
  );
}

function ZoneRoutingCard({ zone, couriers }: { zone: AdminShippingZone; couriers: Courier[] }) {
  const [draft, setDraft] = useState<AdminShippingZone>(zone);
  const update = useUpdateShippingZone();

  useEffect(() => { setDraft(zone); }, [zone]);

  const schedule = (draft.partner_schedule || {}) as Record<string, any>;
  const isIkorodu = zone.name === "Ikorodu";
  const hasExcludedAreas = zone.name === "Island" || zone.name === "Mainland";

  const setSchedule = (patch: Record<string, any>) =>
    setDraft(d => ({ ...d, partner_schedule: { ...(d.partner_schedule || {}), ...patch } }));

  const toggleEfdtDay = (day: string) => {
    const cur: string[] = schedule.efdt_days || [];
    const next = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day];
    const brainDays = WEEKDAYS.filter(d => !next.includes(d));
    setSchedule({ efdt_days: next, brain_express_days: brainDays });
  };

  const toggleActive = async () => {
    try {
      await update.mutateAsync({ id: zone.id, is_active: !zone.is_active });
      toast.success(`${zone.name} zone ${!zone.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
  };

  const save = async () => {
    if (warnings.length > 0) { toast.error(warnings[0]); return; }
    try {
      await update.mutateAsync({
        id: draft.id,
        primary_partner: draft.primary_partner,
        secondary_partner: draft.secondary_partner,
        flat_rate: draft.flat_rate,
        free_delivery_threshold: draft.free_delivery_threshold,
        partner_schedule: draft.partner_schedule,
        areas: draft.areas,
        lgas: draft.lgas,
        estimated_days_min: draft.estimated_days_min,
        estimated_days_max: draft.estimated_days_max,
        express_available: draft.express_available,
        express_rate: draft.express_rate,
        express_days_min: draft.express_days_min,
        express_days_max: draft.express_days_max,
      });
      toast.success(`${draft.name} zone saved`);
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  const ourCost = zone.name === "Island" ? 6000 : zone.name === "Mainland" ? 8000 : (schedule.brain_express_rate || 0);
  const markupPct = ourCost > 0 ? Math.round(((draft.flat_rate - ourCost) / ourCost) * 100) : 0;

  const warnings: string[] = [];
  if (draft.flat_rate < 0) warnings.push("Flat rate must be ≥ 0");
  if ((draft.free_delivery_threshold ?? 0) < 0) warnings.push("Free threshold must be ≥ 0");
  if ((draft.estimated_days_min ?? 0) < 0 || (draft.estimated_days_max ?? 0) < 0) warnings.push("Days must be ≥ 0");
  if (draft.estimated_days_min != null && draft.estimated_days_max != null && draft.estimated_days_min > draft.estimated_days_max) {
    warnings.push("Estimated days min must be ≤ max");
  }

  // Routing preview for Ikorodu: what happens today?
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayRouting = isIkorodu ? (
    (schedule.efdt_days || []).includes(todayStr)
      ? { partner: "eFTD Africa", rate: schedule.efdt_rate || 0 }
      : { partner: "Brain Express", rate: schedule.brain_express_rate || 0 }
  ) : null;

  return (
    <div className={`bg-card border rounded-xl p-5 ${draft.is_active ? "border-border" : "border-border/60 bg-muted/20"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-base">{zone.name}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(zone.states || []).map(s => (
                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-muted text-text-med">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-med">Active</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" checked={zone.is_active} onChange={toggleActive} />
            <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-forest peer-checked:after:translate-x-4" />
          </label>
        </div>
      </div>

      <h4 className={sectionCls}>Routing</h4>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Primary Partner</label>
          <select className={inputCls} value={draft.primary_partner || ""} onChange={e => setDraft(d => ({ ...d, primary_partner: e.target.value || null }))}>
            <option value="">None</option>
            {couriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Secondary Partner</label>
          <select className={inputCls} value={draft.secondary_partner || ""} onChange={e => setDraft(d => ({ ...d, secondary_partner: e.target.value || null }))}>
            <option value="">None</option>
            {couriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {isIkorodu && (
        <>
          <h4 className={sectionCls}>Day-of-week routing</h4>
          <div>
            <div className={labelCls}>eFTD days</div>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(d => {
                const on = (schedule.efdt_days || []).includes(d);
                return (
                  <label key={d} className={`text-xs font-semibold px-3 py-1.5 rounded-pill border-[1.5px] cursor-pointer transition-colors ${on ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleEfdtDay(d)} />
                    {d.slice(0, 3)}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-text-light mt-2">
              Brain Express fallback days: <span className="font-mono">{(WEEKDAYS.filter(d => !(schedule.efdt_days || []).includes(d))).join(", ") || "—"}</span>
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className={labelCls}>eFTD rate (₦)</label>
              <input type="number" className={inputCls} value={schedule.efdt_rate ?? ""} onChange={e => setSchedule({ efdt_rate: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className={labelCls}>Brain Express rate (₦)</label>
              <input type="number" className={inputCls} value={schedule.brain_express_rate ?? ""} onChange={e => setSchedule({ brain_express_rate: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
          {todayRouting && (
            <div className="mt-3 bg-forest-light border border-forest/30 rounded-lg p-3 text-xs">
              <div className="font-semibold text-forest">📅 Today is {todayStr}</div>
              <div className="text-text-med mt-1">Orders will go via <span className="font-bold">{todayRouting.partner}</span> at <span className="font-mono">{fmtN(todayRouting.rate)}</span></div>
            </div>
          )}
        </>
      )}

      {hasExcludedAreas && (
        <>
          <h4 className={sectionCls}>eFTD excluded areas</h4>
          <p className="text-[11px] text-text-light mb-2">Areas listed here force Brain Express instead of eFTD. Start typing to pick from this zone's areas.</p>
          <ChipList
            value={schedule.efdt_excluded_areas || []}
            onChange={v => setSchedule({ efdt_excluded_areas: v })}
            color="red"
            suggestions={draft.areas || []}
            placeholder="e.g. Awoyaya"
          />
        </>
      )}

      <h4 className={sectionCls}>Zone Areas</h4>
      <ChipList
        value={draft.areas || []}
        onChange={v => setDraft(d => ({ ...d, areas: v }))}
        color="grey"
        placeholder="e.g. Lekki Phase 1"
      />

      <h4 className={sectionCls}>LGAs</h4>
      <LgasEditor
        value={draft.lgas || []}
        onChange={v => setDraft(d => ({ ...d, lgas: v }))}
        zoneAreas={draft.areas || []}
      />

      <h4 className={sectionCls}>Rates & ETA</h4>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Customer delivery fee (₦)</label>
          <input type="number" className={inputCls} value={draft.flat_rate} onChange={e => setDraft(d => ({ ...d, flat_rate: Number(e.target.value) }))} />
        </div>
        <div>
          <label className={labelCls}>Free delivery threshold (₦)</label>
          <input type="number" className={inputCls} value={draft.free_delivery_threshold ?? ""} onChange={e => setDraft(d => ({ ...d, free_delivery_threshold: e.target.value ? Number(e.target.value) : null }))} />
        </div>
        <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs">
          <div className="text-text-med">Our cost</div>
          <div className="font-mono font-semibold text-foreground">{fmtN(ourCost)}</div>
          <div className="text-text-med mt-1">Markup</div>
          <div className="font-mono font-semibold text-forest">{markupPct}%</div>
        </div>
        <div>
          <label className={labelCls}>Est. days min</label>
          <input type="number" className={inputCls} value={draft.estimated_days_min ?? ""} onChange={e => setDraft(d => ({ ...d, estimated_days_min: e.target.value ? Number(e.target.value) : 0 }))} />
        </div>
        <div>
          <label className={labelCls}>Est. days max</label>
          <input type="number" className={inputCls} value={draft.estimated_days_max ?? ""} onChange={e => setDraft(d => ({ ...d, estimated_days_max: e.target.value ? Number(e.target.value) : 0 }))} />
        </div>
      </div>

      <h4 className={sectionCls}>Express</h4>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 pt-5">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={draft.express_available} onChange={e => setDraft(d => ({ ...d, express_available: e.target.checked }))} />
            Express available
          </label>
        </div>
        {draft.express_available && <>
          <div>
            <label className={labelCls}>Express rate (₦)</label>
            <input type="number" className={inputCls} value={draft.express_rate ?? ""} onChange={e => setDraft(d => ({ ...d, express_rate: e.target.value ? Number(e.target.value) : null }))} />
          </div>
          <div>
            <label className={labelCls}>Express days min</label>
            <input type="number" className={inputCls} value={draft.express_days_min ?? ""} onChange={e => setDraft(d => ({ ...d, express_days_min: e.target.value ? Number(e.target.value) : null }))} />
          </div>
          <div>
            <label className={labelCls}>Express days max</label>
            <input type="number" className={inputCls} value={draft.express_days_max ?? ""} onChange={e => setDraft(d => ({ ...d, express_days_max: e.target.value ? Number(e.target.value) : null }))} />
          </div>
        </>}
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">Validation issues</div>
              <ul className="list-disc list-inside space-y-0.5">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={update.isPending || warnings.length > 0} className={saveBtnCls}>
          <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save Zone"}
        </button>
      </div>
    </div>
  );
}

// Nested LGA + areas editor — list of {lga, areas[]} blocks
function LgasEditor({
  value,
  onChange,
  zoneAreas,
}: {
  value: Array<{ lga: string; areas: string[] }>;
  onChange: (next: Array<{ lga: string; areas: string[] }>) => void;
  zoneAreas: string[];
}) {
  const addLga = () => onChange([...value, { lga: "", areas: [] }]);
  const removeLga = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateLga = (i: number, patch: Partial<{ lga: string; areas: string[] }>) =>
    onChange(value.map((l, idx) => idx === i ? { ...l, ...patch } : l));

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-text-light text-xs">No LGAs configured yet.</p>}
      {value.map((l, i) => (
        <div key={i} className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className={inputCls + " flex-1"}
              value={l.lga}
              onChange={e => updateLga(i, { lga: e.target.value })}
              placeholder="LGA name, e.g. Eti-Osa"
            />
            <button onClick={() => removeLga(i)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Remove LGA">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-text-med mb-1">Areas in this LGA</div>
            <ChipList
              value={l.areas}
              onChange={v => updateLga(i, { areas: v })}
              color="grey"
              suggestions={zoneAreas}
              placeholder="e.g. Lekki Phase 1"
            />
          </div>
        </div>
      ))}
      <button onClick={addLga} className="text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add LGA
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 3 — Interstate Rates
// ---------------------------------------------------------------------------

const DEFAULT_BUNDLE_WEIGHTS = {
  starter: { bookings: 1, weight_kg: 9.2, rounded_kg: 10 as string | number },
  standard: { bookings: 2, weight_kg: 16.1, rounded_kg: "10+7" as string | number },
  premium: { bookings: 3, weight_kg: 28.3, rounded_kg: "10+10+9" as string | number },
};

function InterstateTab() {
  const { data: zones, isLoading } = useShippingZonesAdmin();
  const update = useUpdateShippingZone();

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading interstate zones…</div>;
  if (!zones) return null;

  const interstate = zones.filter(z => !((z.states || []).includes("Lagos")) && z.is_active !== false);

  if (interstate.length === 0) return <div className="text-center py-10 text-text-med text-sm">No interstate zones found.</div>;

  const applyMarkupEverywhere = async (pct: number) => {
    if (!confirm(`Apply ${pct}% markup to all ${interstate.length} interstate zones?`)) return;
    try {
      await Promise.all(interstate.map(z => {
        const sched = { ...(z.partner_schedule || {}), markup_percent: pct };
        return update.mutateAsync({ id: z.id, partner_schedule: sched });
      }));
      toast.success(`Applied ${pct}% markup to all interstate zones`);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="space-y-4">
      {interstate.map(z => (
        <InterstateCard key={z.id} zone={z} onApplyMarkupEverywhere={applyMarkupEverywhere} />
      ))}
    </div>
  );
}

type RateRow = { max_kg: number; fee: number };

function InterstateCard({ zone, onApplyMarkupEverywhere }: { zone: AdminShippingZone; onApplyMarkupEverywhere: (pct: number) => void }) {
  const schedule = (zone.partner_schedule || {}) as Record<string, any>;

  const initialRates: RateRow[] = Array.isArray(schedule.rates_per_10kg_block)
    ? schedule.rates_per_10kg_block.map((r: any) => ({ max_kg: Number(r.max_kg), fee: Number(r.fee) }))
    : [];

  const initialMarkup = (() => {
    if (schedule.markup_percent != null) return Number(schedule.markup_percent);
    const bc = schedule.bundle_costs as Record<string, any> | undefined;
    const sample = bc?.starter || bc?.standard || bc?.premium;
    if (sample && sample.efdt_cost > 0) return Math.round(((sample.customer_charge / sample.efdt_cost) - 1) * 1000) / 10;
    return 10;
  })();

  const initialWeights = (() => {
    const bc = schedule.bundle_costs as Record<string, any> | undefined;
    return {
      starter: {
        bookings: bc?.starter?.bookings ?? DEFAULT_BUNDLE_WEIGHTS.starter.bookings,
        weight_kg: bc?.starter?.weight_kg ?? DEFAULT_BUNDLE_WEIGHTS.starter.weight_kg,
        rounded_kg: bc?.starter?.rounded_kg ?? DEFAULT_BUNDLE_WEIGHTS.starter.rounded_kg,
      },
      standard: {
        bookings: bc?.standard?.bookings ?? DEFAULT_BUNDLE_WEIGHTS.standard.bookings,
        weight_kg: bc?.standard?.weight_kg ?? DEFAULT_BUNDLE_WEIGHTS.standard.weight_kg,
        rounded_kg: bc?.standard?.rounded_kg ?? DEFAULT_BUNDLE_WEIGHTS.standard.rounded_kg,
      },
      premium: {
        bookings: bc?.premium?.bookings ?? DEFAULT_BUNDLE_WEIGHTS.premium.bookings,
        weight_kg: bc?.premium?.weight_kg ?? DEFAULT_BUNDLE_WEIGHTS.premium.weight_kg,
        rounded_kg: bc?.premium?.rounded_kg ?? DEFAULT_BUNDLE_WEIGHTS.premium.rounded_kg,
      },
    };
  })();

  const [rates, setRates] = useState<RateRow[]>(initialRates);
  const [markupPct, setMarkupPct] = useState<number>(initialMarkup);
  const [threshold, setThreshold] = useState<number | null>(zone.free_delivery_threshold);
  const [weights, setWeights] = useState(initialWeights);
  const [previewKg, setPreviewKg] = useState<number>(10);
  const update = useUpdateShippingZone();

  useEffect(() => {
    setRates(initialRates);
    setMarkupPct(initialMarkup);
    setThreshold(zone.free_delivery_threshold);
    setWeights(initialWeights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.id]);

  const sortedRates = useMemo(() => [...rates].sort((a, b) => a.max_kg - b.max_kg), [rates]);

  const feeAt = (kg: number): number => {
    const match = sortedRates.find(r => kg <= r.max_kg) || sortedRates[sortedRates.length - 1];
    return match?.fee || 0;
  };

  // Parse rounded_kg like "10+7" or number 10 into numeric parts
  const parseRounded = (rounded: string | number): number[] => {
    if (typeof rounded === "number") return [rounded];
    return String(rounded).split("+").map(s => Number(s.trim())).filter(n => !isNaN(n));
  };

  const costForTier = (tier: "starter" | "standard" | "premium") => {
    const parts = parseRounded(weights[tier].rounded_kg);
    return parts.reduce((sum, kg) => sum + feeAt(kg), 0);
  };

  const withMarkup = (cost: number) => Math.round(cost * (1 + markupPct / 100));

  const bundleCostsComputed = {
    starter: { ...weights.starter, efdt_cost: costForTier("starter"), customer_charge: withMarkup(costForTier("starter")) },
    standard: { ...weights.standard, efdt_cost: costForTier("standard"), customer_charge: withMarkup(costForTier("standard")) },
    premium: { ...weights.premium, efdt_cost: costForTier("premium"), customer_charge: withMarkup(costForTier("premium")) },
  };

  const updateRate = (i: number, fee: number) => setRates(prev => prev.map((r, idx) => idx === i ? { ...r, fee } : r));
  const updateRateWeight = (i: number, max_kg: number) => setRates(prev => prev.map((r, idx) => idx === i ? { ...r, max_kg } : r));
  const addRateRow = () => {
    const last = sortedRates[sortedRates.length - 1];
    setRates(prev => [...prev, { max_kg: (last?.max_kg || 0) + 5, fee: last?.fee || 0 }]);
  };
  const removeRateRow = (i: number) => setRates(prev => prev.filter((_, idx) => idx !== i));

  // Validation
  const warnings: string[] = [];
  for (let i = 1; i < sortedRates.length; i++) {
    if (sortedRates[i].max_kg <= sortedRates[i - 1].max_kg) { warnings.push("Rate rows must have ascending max_kg values"); break; }
  }
  if (sortedRates.some(r => r.fee < 0)) warnings.push("Rates cannot be negative");
  if (markupPct < 0) warnings.push("Markup cannot be negative");

  const save = async () => {
    if (warnings.length > 0) { toast.error(warnings[0]); return; }
    try {
      const nextSchedule = {
        ...(zone.partner_schedule || {}),
        markup_percent: markupPct,
        rates_per_10kg_block: sortedRates,
        bundle_costs: bundleCostsComputed,
      };
      await update.mutateAsync({
        id: zone.id,
        free_delivery_threshold: threshold,
        flat_rate: bundleCostsComputed.standard.customer_charge,
        partner_schedule: nextSchedule,
      });
      toast.success(`${zone.name} rates saved`);
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  const previewCost = feeAt(previewKg);
  const previewCharge = withMarkup(previewCost);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-bold text-base">{zone.name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(zone.states || []).map(s => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-muted text-text-med">{s}</span>
            ))}
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-green-100 text-green-700">
          {zone.primary_partner || "eFTD Africa"}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className={sectionCls}>Rate table</h4>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <label className="text-xs font-semibold text-text-med">Markup (%)</label>
            <input type="number" step="0.1" className="border border-input rounded-lg px-3 py-1 text-sm bg-background w-24" value={markupPct} onChange={e => setMarkupPct(Number(e.target.value) || 0)} />
            <button onClick={() => onApplyMarkupEverywhere(markupPct)} className="text-[11px] font-semibold text-forest hover:underline">
              Apply to all zones
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left">Max kg</th>
                  <th className="px-2 py-2 text-right">eFTD cost (₦)</th>
                  <th className="px-2 py-2 text-right">Customer fee (₦)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-1 py-1">
                      <input type="number" className={inputCls + " text-right w-20"} value={r.max_kg} onChange={e => updateRateWeight(i, Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={r.fee} onChange={e => updateRate(i, Number(e.target.value) || 0)} /></td>
                    <td className="px-2 py-1 text-right font-mono text-forest">{fmtN(withMarkup(r.fee))}</td>
                    <td className="px-1 py-1 text-right">
                      <button onClick={() => removeRateRow(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRateRow} className="mt-2 text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add weight row
          </button>

          <h4 className={sectionCls}>Customer-fee preview</h4>
          <div className="bg-muted/30 rounded-lg p-3 text-xs flex items-center gap-3 flex-wrap">
            <label className="text-text-med">Preview fee for</label>
            <input type="number" step="0.1" className="border border-input rounded-lg px-2 py-1 text-xs bg-background w-20" value={previewKg} onChange={e => setPreviewKg(Number(e.target.value) || 0)} />
            <span className="text-text-med">kg →</span>
            <span className="font-mono">eFTD {fmtN(previewCost)}</span>
            <span className="text-text-med">·</span>
            <span className="font-mono text-forest font-bold">Customer {fmtN(previewCharge)}</span>
          </div>
        </div>

        <div>
          <h4 className={sectionCls}>Bundle weights & breakdown</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left">Bundle</th>
                  <th className="px-2 py-2 text-right">Weight (kg)</th>
                  <th className="px-2 py-2 text-right">Rounded</th>
                  <th className="px-2 py-2 text-right">Bookings</th>
                  <th className="px-2 py-2 text-right">eFTD</th>
                  <th className="px-2 py-2 text-right">Customer</th>
                  <th className="px-2 py-2 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {(["starter", "standard", "premium"] as const).map(tier => {
                  const bc = bundleCostsComputed[tier];
                  const profit = bc.customer_charge - bc.efdt_cost;
                  return (
                    <tr key={tier} className="border-t border-border">
                      <td className="px-2 py-1 capitalize font-semibold">{tier}</td>
                      <td className="px-1 py-1">
                        <input type="number" step="0.1" className={inputCls + " text-right w-20"} value={weights[tier].weight_kg}
                          onChange={e => setWeights(w => ({ ...w, [tier]: { ...w[tier], weight_kg: Number(e.target.value) || 0 } }))} />
                      </td>
                      <td className="px-1 py-1">
                        <input type="text" className={inputCls + " text-right w-24"} value={String(weights[tier].rounded_kg)}
                          onChange={e => {
                            const val = e.target.value;
                            const asNum = Number(val);
                            setWeights(w => ({ ...w, [tier]: { ...w[tier], rounded_kg: isNaN(asNum) || val.includes("+") ? val : asNum } }));
                          }} />
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" className={inputCls + " text-right w-14"} value={weights[tier].bookings}
                          onChange={e => setWeights(w => ({ ...w, [tier]: { ...w[tier], bookings: Number(e.target.value) || 1 } }))} />
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{fmtN(bc.efdt_cost)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmtN(bc.customer_charge)}</td>
                      <td className="px-2 py-1 text-right font-mono text-forest font-semibold">{fmtN(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <label className={labelCls}>Free delivery threshold (₦)</label>
            <input type="number" className={inputCls} value={threshold ?? ""} onChange={e => setThreshold(e.target.value ? Number(e.target.value) : null)} placeholder="Leave blank for none" />
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">Validation issues</div>
              <ul className="list-disc list-inside space-y-0.5">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={update.isPending || warnings.length > 0} className={saveBtnCls}>
          <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save Zone"}
        </button>
      </div>
    </div>
  );
}
