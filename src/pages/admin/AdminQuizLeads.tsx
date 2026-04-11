import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";

const DATE_PRESETS = [
  { label: "Today", getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: new Date() }; }},
  { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); const e = new Date(d); e.setDate(e.getDate()+1); return { from: d, to: e }; }},
  { label: "This Week", getValue: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return { from: d, to: new Date() }; }},
  { label: "This Month", getValue: () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return { from: d, to: new Date() }; }},
];

export default function AdminQuizLeads() {
  const { canEdit, canExport } = usePermissionCheck("orders");
  const [filterPurchased, setFilterPurchased] = useState<"all" | "yes" | "no">("no");
  const [datePreset, setDatePreset] = useState("This Month");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const dateRange = useMemo(() => {
    if (datePreset === "Custom" && customFrom) {
      return { from: customFrom.toISOString(), to: (customTo || new Date()).toISOString() };
    }
    const preset = DATE_PRESETS.find(p => p.label === datePreset);
    if (!preset) return { from: new Date(0).toISOString(), to: new Date().toISOString() };
    const { from, to } = preset.getValue();
    return { from: from.toISOString(), to: to.toISOString() };
  }, [datePreset, customFrom, customTo]);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["quiz-leads", filterPurchased, dateRange.from, dateRange.to],
    queryFn: async () => {
      let q = supabase
        .from("quiz_customers")
        .select("*")
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to)
        .order("created_at", { ascending: false });

      if (filterPurchased === "yes") q = q.eq("has_purchased", true);
      if (filterPurchased === "no") q = q.eq("has_purchased", false);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const downloadCSV = () => {
    if (!leads?.length) return;
    const headers = ["WhatsApp Number", "Hospital Type", "Delivery Method", "Baby Gender", "Budget Tier", "Purchased", "Order ID", "Date Submitted"];
    const rows = leads.map(l => [
      l.whatsapp_number || "", l.hospital_type || "", l.delivery_method || "",
      l.baby_gender || "", l.budget_tier || "", l.has_purchased ? "Yes" : "No",
      l.order_id || "", l.created_at ? new Date(l.created_at).toLocaleDateString("en-NG") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "quiz-leads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    if (!leads?.length) return;
    const XLSX = await import("xlsx");
    const data = leads.map(l => ({
      "WhatsApp Number": l.whatsapp_number || "",
      "Hospital Type": l.hospital_type || "",
      "Delivery Method": l.delivery_method || "",
      "Baby Gender": l.baby_gender || "",
      "Budget Tier": l.budget_tier || "",
      "Purchased": l.has_purchased ? "Yes" : "No",
      "Order ID": l.order_id || "",
      "Date Submitted": l.created_at ? new Date(l.created_at).toLocaleDateString("en-NG") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quiz Leads");
    XLSX.writeFile(wb, "quiz-leads.xlsx");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quiz Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            People who completed the quiz — follow up with those who haven't purchased yet.
          </p>
        </div>
        {canExport && (
          <div className="flex items-center gap-2">
            <button onClick={downloadCSV} className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <Download className="w-3 h-3" /> CSV
            </button>
            <button onClick={downloadExcel} className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
              <Download className="w-3 h-3" /> Excel
            </button>
          </div>
        )}
      </div>

      {/* Date & purchase filter */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {DATE_PRESETS.map(p => (
          <button key={p.label} onClick={() => setDatePreset(p.label)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${datePreset === p.label ? "border-forest bg-forest/10 text-forest" : "border-border text-muted-foreground"}`}>
            {p.label}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("text-[11px]", datePreset === "Custom" && "border-forest bg-forest/10 text-forest")}>
              <Calendar className="w-3 h-3 mr-1" /> Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent mode="range" selected={customFrom && customTo ? { from: customFrom, to: customTo } : undefined}
              onSelect={(range: any) => { setCustomFrom(range?.from); setCustomTo(range?.to); setDatePreset("Custom"); }}
              className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Filter:</label>
          <select value={filterPurchased} onChange={e => setFilterPurchased(e.target.value as "all" | "yes" | "no")}
            className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background">
            <option value="no">Not Purchased</option>
            <option value="yes">Purchased</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading leads...</div>
      ) : !leads?.length ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No quiz leads found.</div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-mono text-sm">
                    {lead.whatsapp_number || <span className="text-muted-foreground italic">—</span>}
                  </TableCell>
                  <TableCell className="capitalize">{lead.hospital_type || "—"}</TableCell>
                  <TableCell className="capitalize">{lead.delivery_method || "—"}</TableCell>
                  <TableCell className="capitalize">{lead.baby_gender || "—"}</TableCell>
                  <TableCell className="capitalize">{lead.budget_tier || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={lead.has_purchased ? "default" : "secondary"} className={lead.has_purchased ? "bg-green-600" : ""}>
                      {lead.has_purchased ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
