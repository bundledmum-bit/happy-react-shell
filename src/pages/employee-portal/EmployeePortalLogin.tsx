import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import bmLogoGreen from "@/assets/logos/BM-LOGO-GREEN.svg";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export default function EmployeePortalLogin() {
  const navigate = useNavigate();
  const { isLoggedIn } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "sent">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { if (isLoggedIn) navigate("/employee-portal", { replace: true }); }, [isLoggedIn, navigate]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const send = async () => {
    const addr = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { toast.error("Please enter a valid email address."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/employee-portal` },
      });
      if (error) throw error;
      setStage("sent");
      setCooldown(30);
      toast.success("Login link sent to your inbox.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't send login link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
      <div className="max-w-[420px] mx-auto pt-20 px-4">
        <div className="bg-card rounded-card shadow-card p-6">
          <img src={bmLogoGreen} alt="BundledMum" className="h-8 mx-auto mb-4" />
          {stage === "sent" ? (
            <div className="text-center space-y-2">
              <div className="text-4xl">✉️</div>
              <h1 className="pf text-xl font-bold">Check your email for your login link.</h1>
              <p className="text-sm text-text-med">
                We sent a login link to <b>{email.trim().toLowerCase()}</b>. Click it to sign in to the employee portal.
              </p>
              <div className="pt-1 text-xs text-text-light">
                Didn't get it? {cooldown > 0 ? <span>Resend in {cooldown}s</span> : <button onClick={send} className="text-forest font-semibold hover:underline">Resend</button>}
              </div>
            </div>
          ) : (
            <>
              <h1 className="pf text-xl font-bold text-center mb-1">Employee sign-in</h1>
              <p className="text-xs text-text-light text-center mb-5">Use the email address HR set up for you.</p>
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1">Work / personal email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !submitting) send(); }}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-input pl-9 pr-3 py-3 text-sm bg-background outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                />
              </div>
              <button
                onClick={send}
                disabled={submitting || !email.trim()}
                className="w-full mt-3 rounded-pill bg-forest py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send me a login link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
