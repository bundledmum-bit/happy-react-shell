import { useEffect } from "react";
import { useBlogPosts } from "@/hooks/useSupabaseData";

export default function BlogPage() {
  const { data: posts, isLoading } = useBlogPosts();

  useEffect(() => { document.title = "Blog | BundledMum"; }, []);

  const articles = posts && posts.length > 0
    ? posts.map(p => ({
        slug: p.slug,
        title: p.title,
        desc: p.excerpt || "",
        date: p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "",
        emoji: "📝",
        readTime: `${Math.max(1, Math.ceil((p.body?.length || 0) / 1000))} min`,
      }))
    : [
        { slug: "hospital-bag-checklist", title: "Hospital Bag Checklist for Nigerian Mums", desc: "The ultimate guide to packing your hospital bag — what you really need (and what you can skip).", date: "Mar 2026", emoji: "🏥", readTime: "5 min" },
        { slug: "public-vs-private", title: "Public vs Private Hospital: What to Pack Differently", desc: "Packing for a public hospital is different from private. Here's exactly what changes.", date: "Mar 2026", emoji: "🏨", readTime: "4 min" },
        { slug: "csection-recovery", title: "C-Section Recovery: What You Actually Need", desc: "Belly bands, compression socks, and the postpartum items that make a real difference after surgery.", date: "Feb 2026", emoji: "🩺", readTime: "6 min" },
        { slug: "first-time-mum", title: "First-Time Mum Essentials: A Nigerian Guide", desc: "Everything a first-time mum in Nigeria should know about preparing for baby's arrival.", date: "Feb 2026", emoji: "👶", readTime: "7 min" },
      ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="max-w-[900px] mx-auto px-4 md:px-10 py-10 md:py-16">
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground mb-2">📝 The BundledMum Blog</h1>
          <p className="text-primary-foreground/65 text-sm md:text-base max-w-[500px]">Guides, checklists, and tips from real Nigerian mums to help you prepare for your baby's arrival.</p>
        </div>
      </div>
      <div className="max-w-[900px] mx-auto px-4 md:px-10 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map(i => <div key={i} className="bg-card rounded-card shadow-card h-[300px] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {articles.map(a => (
              <div key={a.slug} className="bg-card rounded-card shadow-card card-hover overflow-hidden">
                <div className="h-40 flex items-center justify-center text-5xl" style={{ background: "linear-gradient(135deg, #E8F5E9, #FFF8F4)" }}>
                  {a.emoji}
                </div>
                <div className="p-5">
                  <div className="flex gap-2 text-text-light text-[11px] mb-2">
                    <span>{a.date}</span>
                    <span>·</span>
                    <span>{a.readTime} read</span>
                  </div>
                  <h2 className="pf text-lg font-bold mb-2 leading-tight">{a.title}</h2>
                  <p className="text-text-med text-sm leading-relaxed mb-3">{a.desc}</p>
                  <span className="text-forest text-sm font-semibold">Coming soon →</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <p className="text-text-med text-sm mb-3">Want to share your story with BundledMum?</p>
          <a href="https://wa.me/2348012345678?text=Hi! I want to share my BundledMum experience" target="_blank" rel="noopener noreferrer"
            className="rounded-pill bg-forest px-6 py-3 font-body font-semibold text-primary-foreground text-sm interactive inline-block">
            Share Your Story 💬
          </a>
        </div>
      </div>
    </div>
  );
}
