import { fromKobo, type HRJobHistory } from "@/hooks/useHR";

const CHANGE_BADGE: Record<string, { label: string; cls: string }> = {
  hire:              { label: "Joined",          cls: "bg-emerald-100 text-emerald-700" },
  salary_review:     { label: "Salary Review",   cls: "bg-blue-100 text-blue-700" },
  title_change:      { label: "Title Change",    cls: "bg-purple-100 text-purple-700" },
  promotion:         { label: "Promotion",       cls: "bg-amber-100 text-amber-700" },
  department_change: { label: "Dept Change",     cls: "bg-orange-100 text-orange-700" },
  status_change:     { label: "Status Change",   cls: "bg-gray-100 text-gray-600" },
  contract_change:   { label: "Contract Change", cls: "bg-teal-100 text-teal-700" },
};

export default function JobHistoryTimeline({ entries, hideSensitive }: { entries: HRJobHistory[]; hideSensitive?: boolean }) {
  if (!entries || entries.length === 0) {
    return <p className="text-xs text-text-light">No history entries yet.</p>;
  }

  const visible = hideSensitive
    ? entries.filter(e => e.change_type !== "status_change")
    : entries;

  return (
    <ol className="relative border-l border-border ml-2 pl-4 space-y-3">
      {visible.map(entry => {
        const badge = CHANGE_BADGE[entry.change_type] || { label: entry.change_type, cls: "bg-muted text-text-med" };
        return (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-forest" aria-hidden />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-foreground">{formatDate(entry.effective_date)}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="text-xs text-foreground mt-0.5">{describeEntry(entry, hideSensitive)}</p>
            {entry.reason && <p className="text-[11px] italic text-text-light mt-0.5">"{entry.reason}"</p>}
          </li>
        );
      })}
    </ol>
  );
}

function describeEntry(e: HRJobHistory, hideSensitive?: boolean): string {
  const money = (kobo: number | null | undefined) => `₦${fromKobo(kobo).toLocaleString()}`;
  switch (e.change_type) {
    case "hire":
      return `Joined as ${e.new_job_title ?? "—"}`;
    case "salary_review":
      return `Salary updated — ${money(e.previous_basic)} → ${money(e.new_basic)} basic`;
    case "title_change":
      return `${e.previous_job_title ?? "—"} → ${e.new_job_title ?? "—"}`;
    case "promotion":
      return `${e.previous_job_title ?? "—"} → ${e.new_job_title ?? "—"}${e.new_basic != null && e.previous_basic != null ? ` · ${money(e.previous_basic)} → ${money(e.new_basic)}` : ""}`;
    case "department_change":
      return `${e.prev_department?.name ?? "—"} → ${e.new_department?.name ?? "—"}`;
    case "status_change":
      return hideSensitive ? "Status updated" : `Status: ${pretty(e.previous_status)} → ${pretty(e.new_status)}`;
    case "contract_change":
      return `Contract: ${pretty(e.previous_employment_type)} → ${pretty(e.new_employment_type)}`;
    default:
      return pretty(e.change_type);
  }
}
function pretty(s: string | null | undefined): string { return (s || "—").replace(/_/g, " "); }
function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}
