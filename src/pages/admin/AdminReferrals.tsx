import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminReferrals() {
  const { data: codes, isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Referral Codes</h1>
      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (codes || []).length === 0 ? (
        <div className="text-center py-10 text-text-med">No referral codes yet. They'll appear here when customers generate them.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Referrer</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Times Used</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med">Total Earned</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
              </tr>
            </thead>
            <tbody>
              {(codes || []).map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.referrer_name} <span className="text-text-light text-xs">({c.referrer_email})</span></td>
                  <td className="px-4 py-3 text-center">{c.times_used}</td>
                  <td className="px-4 py-3 text-right">₦{(c.total_earned || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
