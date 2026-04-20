import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Save, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCouriers,
  useUpdateCourier,
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

        <TabsContent value="partners" className="space-y-3">
          <PartnersTab />
        </TabsContent>
        <TabsContent value="routing" className="space-y-4">
          <ZoneRoutingTab />
        </TabsContent>
        <TabsContent value="interstate" className="space-y-4">
          <InterstateTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 — Partners
// ---------------------------------------------------------------------------

function PartnersTab() {
  const { data: couriers, isLoading } = useCouriers();

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading couriers…</div>;
  if (!couriers || couriers.length === 0) return <div className="text-center py-10 text-text-med text-sm">No couriers configured.</div>;

  return (
    <div className="space-y-3">
      {couriers.map(c => <CourierCard key={c.id} courier={c} />)}
    </div>
  );
}

function CourierCard({ courier }: { courier: Courier }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Courier>(courier);
  const update = useUpdateCourier();

  useEffect(() => { setDraft(courier); }, [courier]);

  const field = <K extends keyof Courier>(k: K, v: Courier[K]) => setDraft(d => ({ ...d, [k]: v }));

  const addExcludedArea = (area: string) => {
    const trimmed = area.trim();
    if (!trimmed) return;
    const next = [...(draft.excluded_areas || []), trimmed];
    field("excluded_areas", next);
  };
  const removeExcludedArea = (i: number) => {
    const next = (draft.excluded_areas || []).filter((_, idx) => idx !== i);
    field("excluded_areas", next);
  };

  const addPlan = () => {
    const next = [...(draft.subscription_plans || []), { plan: "New plan", cost: 0, deliveries: 0, valid_days: 30 }];
    field("subscription_plans", next as any);
  };
  const updatePlan = (i: number, changes: Partial<SubscriptionPlan>) => {
    const next = (draft.subscription_plans || []).map((p, idx) => idx === i ? { ...p, ...changes } : p);
    field("subscription_plans", next as any);
  };
  const removePlan = (i: number) => {
    const next = (draft.subscription_plans || []).filter((_, idx) => idx !== i);
    field("subscription_plans", next as any);
  };

  const toggleActive = async () => {
    try {
      await update.mutateAsync({ id: courier.id, is_active: !courier.is_active });
      toast.success(`${courier.name} ${!courier.is_active ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const save = async () => {
    try {
      await update.mutateAsync(draft);
      toast.success(`${draft.name} saved`);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const [excludedInput, setExcludedInput] = useState("");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left flex-1">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div>
            <div className="font-bold text-base">{courier.name}</div>
            <div className="text-[11px] text-text-light mt-0.5">
              {courier.pricing_model} · {courier.coverage?.length || 0} zones · {courier.is_active ? "Active" : "Inactive"}
            </div>
          </div>
        </button>
        <label className="relative inline-flex cursor-pointer items-center ml-3">
          <input type="checkbox" className="peer sr-only" checked={courier.is_active} onChange={toggleActive} />
          <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-forest peer-checked:after:translate-x-4" />
        </label>
      </div>

      {open && (
        <div className="border-t border-border p-5 space-y-4">
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

          <h4 className={sectionCls}>Coverage</h4>
          {courier.coverage && courier.coverage.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {courier.coverage.map((c, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-green-100 text-green-700">{c}</span>
              ))}
            </div>
          ) : (
            <p className="text-text-light text-xs">No coverage zones listed.</p>
          )}

          <h4 className={sectionCls}>Excluded Areas</h4>
          <div className="space-y-2">
            {(draft.excluded_areas || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(draft.excluded_areas || []).map((a, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-red-100 text-red-700 inline-flex items-center gap-1">
                    {a}
                    <button onClick={() => removeExcludedArea(i)} className="hover:text-red-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-text-light text-xs">No excluded areas.</p>
            )}
            <div className="flex gap-2">
              <input className={inputCls + " flex-1"} value={excludedInput} onChange={e => setExcludedInput(e.target.value)} placeholder="e.g. Ajah, Badagry" />
              <button onClick={() => { addExcludedArea(excludedInput); setExcludedInput(""); }} className="px-3 py-2 rounded-lg bg-muted text-xs font-semibold hover:bg-border">
                <Plus className="w-3.5 h-3.5 inline-block" /> Add
              </button>
            </div>
          </div>

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
                    {(draft.subscription_plans || []).map((p, i) => {
                      const perDelivery = p.deliveries > 0 ? Math.round(p.cost / p.deliveries) : 0;
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="px-1 py-1"><input className={inputCls} value={p.plan} onChange={e => updatePlan(i, { plan: e.target.value })} /></td>
                          <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.cost} onChange={e => updatePlan(i, { cost: Number(e.target.value) })} /></td>
                          <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.deliveries} onChange={e => updatePlan(i, { deliveries: Number(e.target.value) })} /></td>
                          <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={p.valid_days} onChange={e => updatePlan(i, { valid_days: Number(e.target.value) })} /></td>
                          <td className="px-2 py-1 text-right font-mono text-text-med">₦{perDelivery.toLocaleString()}</td>
                          <td className="px-1 py-1 text-right">
                            <button onClick={() => removePlan(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={addPlan} className="text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add plan</button>
            </>
          )}

          <h4 className={sectionCls}>Special Notes</h4>
          <textarea className={inputCls + " h-24"} value={draft.special_notes || ""} onChange={e => field("special_notes", e.target.value)} />

          <div className="flex justify-end pt-2">
            <button onClick={save} disabled={update.isPending} className={saveBtnCls}>
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

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ZoneRoutingTab() {
  const { data: zones, isLoading } = useShippingZonesAdmin();
  const { data: couriers } = useCouriers();

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading zones…</div>;
  if (!zones || zones.length === 0) return <div className="text-center py-10 text-text-med text-sm">No zones configured.</div>;

  // Lagos zones (where our routing logic lives): Island, Mainland, Ikorodu
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

  const setSchedule = (patch: Record<string, any>) => {
    setDraft(d => ({ ...d, partner_schedule: { ...(d.partner_schedule || {}), ...patch } }));
  };

  const toggleEfdtDay = (day: string) => {
    const cur: string[] = schedule.efdt_days || [];
    const next = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day];
    const brainDays = WEEKDAYS.filter(d => !next.includes(d));
    setSchedule({ efdt_days: next, brain_express_days: brainDays });
  };

  const [newExcluded, setNewExcluded] = useState("");
  const addExcluded = () => {
    if (!newExcluded.trim()) return;
    const next = [...(schedule.efdt_excluded_areas || []), newExcluded.trim()];
    setSchedule({ efdt_excluded_areas: next });
    setNewExcluded("");
  };
  const removeExcluded = (i: number) => {
    const next = (schedule.efdt_excluded_areas || []).filter((_: string, idx: number) => idx !== i);
    setSchedule({ efdt_excluded_areas: next });
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        id: draft.id,
        primary_partner: draft.primary_partner,
        secondary_partner: draft.secondary_partner,
        flat_rate: draft.flat_rate,
        free_delivery_threshold: draft.free_delivery_threshold,
        partner_schedule: draft.partner_schedule,
      });
      toast.success(`${draft.name} zone saved`);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  // Informational: infer our cost from partner_schedule or hardcoded defaults
  const ourCost = zone.name === "Island" ? 6000
    : zone.name === "Mainland" ? 8000
    : (schedule.brain_express_rate || 0);
  const markupPct = ourCost > 0 ? Math.round(((draft.flat_rate - ourCost) / ourCost) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-base">{zone.name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(zone.states || []).map(s => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-muted text-text-med">{s}</span>
            ))}
          </div>
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
        </>
      )}

      {hasExcludedAreas && (
        <>
          <h4 className={sectionCls}>eFTD excluded areas</h4>
          <p className="text-[11px] text-text-light mb-2">Areas listed here force Brain Express instead of eFTD.</p>
          <div className="space-y-2">
            {(schedule.efdt_excluded_areas || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(schedule.efdt_excluded_areas || []).map((a: string, i: number) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-1 rounded-pill bg-red-100 text-red-700 inline-flex items-center gap-1">
                    {a}
                    <button onClick={() => removeExcluded(i)} className="hover:text-red-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-text-light text-xs">No excluded areas.</p>
            )}
            <div className="flex gap-2">
              <input className={inputCls + " flex-1"} value={newExcluded} onChange={e => setNewExcluded(e.target.value)} placeholder="e.g. Awoyaya" />
              <button onClick={addExcluded} className="px-3 py-2 rounded-lg bg-muted text-xs font-semibold hover:bg-border"><Plus className="w-3.5 h-3.5 inline-block" /> Add</button>
            </div>
          </div>
        </>
      )}

      <h4 className={sectionCls}>Rates</h4>
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
          <div className="text-text-med">Our cost (Brain Express)</div>
          <div className="font-mono font-semibold text-foreground">₦{ourCost.toLocaleString()}</div>
          <div className="text-text-med mt-1">Markup</div>
          <div className="font-mono font-semibold text-forest">{markupPct}%</div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={update.isPending} className={saveBtnCls}>
          <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save Zone"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 3 — Interstate Rates
// ---------------------------------------------------------------------------

const INTERSTATE_NAMES = ["Abuja", "Ibadan", "Port Harcourt"];

function InterstateTab() {
  const { data: zones, isLoading } = useShippingZonesAdmin();

  if (isLoading) return <div className="text-center py-10 text-text-med text-sm">Loading interstate zones…</div>;
  if (!zones) return null;

  const interstate = zones.filter(z => INTERSTATE_NAMES.includes(z.name));

  if (interstate.length === 0) return <div className="text-center py-10 text-text-med text-sm">No interstate zones found.</div>;

  return (
    <div className="space-y-4">
      {interstate.map(z => <InterstateCard key={z.id} zone={z} />)}
    </div>
  );
}

type RateRow = { max_kg: number; fee: number };
type BundleCost = { bookings: number; efdt_cost: number; weight_kg: number; rounded_kg: string | number; customer_charge: number };

function InterstateCard({ zone }: { zone: AdminShippingZone }) {
  const schedule = (zone.partner_schedule || {}) as Record<string, any>;

  const initialRates: RateRow[] = Array.isArray(schedule.rates_per_10kg_block)
    ? schedule.rates_per_10kg_block.map((r: any) => ({ max_kg: Number(r.max_kg), fee: Number(r.fee) }))
    : [];

  // Infer markup from existing bundle_costs (customer_charge / efdt_cost)
  const initialMarkup = (() => {
    const bc = schedule.bundle_costs as Record<string, BundleCost> | undefined;
    const sample = bc?.starter || bc?.standard || bc?.premium;
    if (sample && sample.efdt_cost > 0) {
      return Math.round(((sample.customer_charge / sample.efdt_cost) - 1) * 1000) / 10; // e.g. 10.0
    }
    return 10;
  })();

  const [rates, setRates] = useState<RateRow[]>(initialRates);
  const [markupPct, setMarkupPct] = useState<number>(initialMarkup);
  const [threshold, setThreshold] = useState<number | null>(zone.free_delivery_threshold);
  const update = useUpdateShippingZone();

  useEffect(() => {
    setRates(initialRates);
    setMarkupPct(initialMarkup);
    setThreshold(zone.free_delivery_threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.id]);

  const feeAt = (kg: number): number => {
    // Find the rate row where kg <= max_kg (exact match or next highest)
    const sorted = [...rates].sort((a, b) => a.max_kg - b.max_kg);
    const match = sorted.find(r => kg <= r.max_kg) || sorted[sorted.length - 1];
    return match?.fee || 0;
  };

  const withMarkup = (cost: number) => Math.round(cost * (1 + markupPct / 100));

  const bundleCostsComputed = (() => {
    // Starter: 1 booking, 10kg
    const starterCost = feeAt(10);
    const starterCharge = withMarkup(starterCost);
    // Standard: 2 bookings, 10+7kg
    const standardCost = feeAt(10) + feeAt(7);
    const standardCharge = withMarkup(standardCost);
    // Premium: 3 bookings, 10+10+9kg
    const premiumCost = feeAt(10) + feeAt(10) + feeAt(9);
    const premiumCharge = withMarkup(premiumCost);
    return {
      starter: { bookings: 1, weight_kg: 9.2, rounded_kg: 10, efdt_cost: starterCost, customer_charge: starterCharge },
      standard: { bookings: 2, weight_kg: 16.1, rounded_kg: "10+7", efdt_cost: standardCost, customer_charge: standardCharge },
      premium: { bookings: 3, weight_kg: 28.3, rounded_kg: "10+10+9", efdt_cost: premiumCost, customer_charge: premiumCharge },
    };
  })();

  const updateRate = (i: number, fee: number) => {
    setRates(prev => prev.map((r, idx) => idx === i ? { ...r, fee } : r));
  };

  const save = async () => {
    try {
      const nextSchedule = {
        ...(zone.partner_schedule || {}),
        markup_percent: markupPct,
        rates_per_10kg_block: rates,
        bundle_costs: bundleCostsComputed,
      };
      await update.mutateAsync({
        id: zone.id,
        free_delivery_threshold: threshold,
        flat_rate: bundleCostsComputed.standard.customer_charge,
        partner_schedule: nextSchedule,
      });
      toast.success(`${zone.name} rates saved`);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

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
          <h4 className={sectionCls}>Rate table (per 10kg block)</h4>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-xs font-semibold text-text-med">Markup (%)</label>
            <input type="number" step="0.1" className="border border-input rounded-lg px-3 py-1 text-sm bg-background w-24" value={markupPct} onChange={e => setMarkupPct(Number(e.target.value) || 0)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left">Weight</th>
                  <th className="px-2 py-2 text-right">eFTD cost (₦)</th>
                  <th className="px-2 py-2 text-right">Customer fee (₦)</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 font-mono">≤ {r.max_kg}kg</td>
                    <td className="px-1 py-1"><input type="number" className={inputCls + " text-right"} value={r.fee} onChange={e => updateRate(i, Number(e.target.value) || 0)} /></td>
                    <td className="px-2 py-1 text-right font-mono text-forest">₦{withMarkup(r.fee).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className={sectionCls}>Bundle cost breakdown (computed)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left">Bundle</th>
                  <th className="px-2 py-2 text-right">Weight</th>
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
                      <td className="px-2 py-1 text-right font-mono">{bc.weight_kg}kg → {bc.rounded_kg}</td>
                      <td className="px-2 py-1 text-right">{bc.bookings}</td>
                      <td className="px-2 py-1 text-right font-mono">₦{bc.efdt_cost.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right font-mono">₦{bc.customer_charge.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right font-mono text-forest font-semibold">₦{profit.toLocaleString()}</td>
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

      <div className="flex justify-end mt-4">
        <button onClick={save} disabled={update.isPending} className={saveBtnCls}>
          <Save className="w-4 h-4" /> {update.isPending ? "Saving…" : "Save Zone"}
        </button>
      </div>
    </div>
  );
}
