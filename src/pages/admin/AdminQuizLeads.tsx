import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminQuizLeads() {
  const [filterPurchased, setFilterPurchased] = useState<"all" | "yes" | "no">("no");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["quiz-leads", filterPurchased],
    queryFn: async () => {
      let q = supabase
        .from("quiz_customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterPurchased === "yes") q = q.eq("has_purchased", true);
      if (filterPurchased === "no") q = q.eq("has_purchased", false);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            People who completed the quiz — follow up with those who haven't purchased yet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Filter:</label>
          <select
            value={filterPurchased}
            onChange={e => setFilterPurchased(e.target.value as "all" | "yes" | "no")}
            className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background"
          >
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
