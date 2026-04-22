import type { EmploymentLetterData } from "@/hooks/useHR";

/**
 * Print-ready employment confirmation letter. Wrapped in an `.employment-letter`
 * div so the print CSS in index.css can hide everything else and render only
 * this element on the page.
 */
export default function EmploymentLetter({ data }: { data: EmploymentLetterData }) {
  const formattedDate = formatLongDate(data.letter_date);
  const formattedStart = formatLongDate(data.start_date);

  return (
    <div className="employment-letter bg-white text-black p-10 max-w-[780px] mx-auto text-[14px] leading-relaxed">
      <header className="text-center mb-8">
        <div className="text-2xl font-black" style={{ color: "#E98074" }}>BundledMum</div>
        <div className="text-[11px] text-black/60 mt-0.5">hr@bundledmum.com</div>
      </header>

      <p className="mb-6">{formattedDate}</p>

      <h1 className="text-center font-bold tracking-widest text-[13px] mb-5">TO WHOM IT MAY CONCERN</h1>
      <h2 className="font-bold text-[14px] mb-5">RE: CONFIRMATION OF EMPLOYMENT — {data.full_name.toUpperCase()}</h2>

      <p className="mb-4">
        This is to confirm that <b>{data.full_name}</b> is a {formatEmploymentType(data.employment_type)} employee of
        BundledMum, currently serving as <b>{data.job_title}</b>
        {data.department ? <> in the <b>{data.department}</b> department</> : null}.
      </p>

      <p className="mb-4">
        {data.full_name} has been employed with us since {formattedStart}, representing {data.years_of_service} of service.
      </p>

      <p className="mb-4">
        This letter is issued at the request of the employee for whatever legitimate purpose it may serve.
      </p>

      <p className="mb-8">
        For further enquiries, please contact us at <b>hr@bundledmum.com</b>.
      </p>

      <p className="mb-10">Yours faithfully,</p>

      <div>
        <div className="w-56 border-b border-black mb-1" />
        <div className="font-semibold">Human Resources Department</div>
        <div>BundledMum</div>
        <div>Lagos, Nigeria</div>
      </div>
    </div>
  );
}

function formatLongDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}
function formatEmploymentType(t: string): string {
  return t ? t.replace(/_/g, " ") : "";
}
