import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-[68px]">
      <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-5 md:px-10 py-12 md:py-24">
        <div className="max-w-[780px] mx-auto text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="pf text-3xl md:text-[50px] text-primary-foreground mb-3.5">Our Story</h1>
          <p className="text-primary-foreground/70 text-[15px] md:text-[17px] leading-[1.8]">BundledMum was born from a very real moment of overwhelm.</p>
        </div>
      </div>
      <div className="max-w-[780px] mx-auto px-5 md:px-10 py-10 md:py-[72px]">
        <p className="text-text-med text-[15px] md:text-[17px] leading-[1.9] mb-5">When our founder was preparing for her first baby in Lagos, she spent weeks figuring out what to pack. Every list she found was either too generic, too foreign, or too expensive for the Nigerian context.</p>
        <p className="text-text-med text-[15px] md:text-[17px] leading-[1.9] mb-5">She wanted a curated, honest, properly Nigerian answer to the question every expectant mum asks: <strong className="text-forest">"What do I actually need?"</strong></p>
        <p className="text-text-med text-[15px] md:text-[17px] leading-[1.9] mb-9">So she built it. BundledMum is the resource she wished she had — a quiz that understands your budget and your baby, and recommends exactly what you need. Nothing more, nothing less.</p>
        <div className="grid md:grid-cols-3 gap-3.5 md:gap-5 mb-9">
          {[
            { icon: "🌿", t: "Curated for Nigeria", d: "Every product is selected for the Nigerian market — our climate, our budget ranges, our preferences." },
            { icon: "❤️", t: "Mum-First Always", d: "We never stock anything we wouldn't give to our own families. Quality and safety are non-negotiable." },
            { icon: "💬", t: "Real Support", d: "Our WhatsApp support team includes mums who've used these products. Real advice, not scripts." },
          ].map(v => (
            <div key={v.t} className="bg-warm-cream rounded-[18px] p-5 md:p-6 text-center">
              <div className="text-3xl mb-2.5">{v.icon}</div>
              <h4 className="pf text-forest text-base mb-2">{v.t}</h4>
              <p className="text-text-med text-[13px] leading-[1.7]">{v.d}</p>
            </div>
          ))}
        </div>
        <div className="bg-forest rounded-[20px] p-7 md:p-10 text-center">
          <h2 className="pf text-primary-foreground text-xl md:text-[34px] mb-3">Ready to Build Your Bundle?</h2>
          <p className="text-primary-foreground/65 text-sm mb-5">Join hundreds of Nigerian mums who've made hospital prep stress-free.</p>
          <Link to="/quiz" className="rounded-pill bg-coral px-8 py-3.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-[15px] inline-block">Start the Quiz →</Link>
        </div>
      </div>
    </div>
  );
}
