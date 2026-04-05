export interface Brand {
  id: string;
  label: string;
  price: number;
  img: string;
  tier: number;
  color: string;
}

export interface Product {
  id: number;
  name: string;
  baseImg: string;
  rating: number;
  reviews: number;
  tags: string[];
  badge: string | null;
  brands: Brand[];
}

export const PRODUCTS: { baby: Product[]; mum: Product[] } = {
  baby: [
    {
      id: 1, name: "Newborn Nappy Pack", baseImg: "🧷", rating: 4.9, reviews: 312,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:baby","type:toiletries","gift:yes"],
      badge: "Bestseller",
      brands: [
        { id: "molfix", label: "Molfix", price: 3200, img: "🧷", tier: 0, color: "#E3F2FD" },
        { id: "huggies", label: "Huggies Pure", price: 4800, img: "🧷", tier: 1, color: "#E8F5E9" },
        { id: "pampers", label: "Pampers Premium", price: 6500, img: "🧷", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 2, name: "Baby Wipes", baseImg: "🫧", rating: 4.8, reviews: 278,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:baby","type:toiletries","gift:yes"],
      badge: "Essential",
      brands: [
        { id: "local_w", label: "Local Wipes", price: 800, img: "🫧", tier: 0, color: "#FFF8E1" },
        { id: "waterwipes", label: "WaterWipes", price: 2200, img: "🫧", tier: 1, color: "#E8F5E9" },
        { id: "waterwipes_p", label: "WaterWipes Pure", price: 3500, img: "🫧", tier: 2, color: "#E3F2FD" },
      ]
    },
    {
      id: 3, name: "Baby Skincare Set", baseImg: "🧴", rating: 4.7, reviews: 189,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:baby","type:skincare","gift:yes"],
      badge: null,
      brands: [
        { id: "purity", label: "Purity", price: 2500, img: "🧴", tier: 0, color: "#FFF8E1" },
        { id: "johnsons", label: "Johnson's", price: 4200, img: "🧴", tier: 1, color: "#E8F5E9" },
        { id: "mustela", label: "Mustela Set", price: 12500, img: "🧴", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 4, name: "Muslin Swaddle", baseImg: "🌿", rating: 4.9, reviews: 165,
      tags: ["bundle:standard","bundle:premium","gender:neutral","gender:boy","gender:girl","category:baby","type:comfort","gift:yes"],
      badge: null,
      brands: [
        { id: "local_s", label: "Local Premium", price: 4500, img: "🌿", tier: 0, color: "#FFF8E1" },
        { id: "adenanais", label: "Aden+Anais", price: 7200, img: "🌿", tier: 1, color: "#E8F5E9" },
        { id: "adenanais_d", label: "Aden+Anais Dream", price: 14000, img: "🌿", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 5, name: "Newborn Onesie Set (3pcs)", baseImg: "👶", rating: 4.8, reviews: 234,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:boy","gender:girl","gender:neutral","category:baby","type:clothing","gift:yes"],
      badge: "Bestseller",
      brands: [
        { id: "local_o", label: "Local Brands", price: 3200, img: "👶", tier: 0, color: "#E3F2FD" },
        { id: "hm", label: "H&M Essentials", price: 6800, img: "👶", tier: 1, color: "#E8F5E9" },
        { id: "carters", label: "Carter's", price: 12000, img: "👶", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 6, name: "Going-Home Outfit", baseImg: "🎀", rating: 4.6, reviews: 143,
      tags: ["bundle:standard","bundle:premium","gender:boy","gender:girl","category:baby","type:clothing","gift:yes"],
      badge: null,
      brands: [
        { id: "hm_o", label: "H&M Occasion", price: 4500, img: "🎀", tier: 1, color: "#E8F5E9" },
        { id: "carters_s", label: "Carter's Special", price: 8500, img: "🎀", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 7, name: "Cap + Mittens + Booties", baseImg: "🧤", rating: 4.7, reviews: 198,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:baby","type:clothing"],
      badge: null,
      brands: [
        { id: "local_k", label: "Local Knitwear", price: 1800, img: "🧤", tier: 0, color: "#FFF8E1" },
        { id: "carters_p", label: "Carter's Premium", price: 4200, img: "🧤", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 8, name: "Baby Thermometer", baseImg: "🌡️", rating: 4.5, reviews: 89,
      tags: ["bundle:premium","gender:neutral","category:baby","type:gear"],
      badge: null,
      brands: [
        { id: "basic_t", label: "Basic Digital", price: 3500, img: "🌡️", tier: 1, color: "#E8F5E9" },
        { id: "braun", label: "Braun No-Touch", price: 18000, img: "🌡️", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 9, name: "Nasal Aspirator", baseImg: "👃", rating: 4.4, reviews: 76,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:baby","type:gear"],
      badge: null,
      brands: [
        { id: "bulb", label: "Bulb Syringe", price: 1200, img: "👃", tier: 0, color: "#FFF8E1" },
        { id: "frida_n", label: "Frida NoseFrida", price: 8500, img: "👃", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 10, name: "Baby Nail Kit", baseImg: "✂️", rating: 4.3, reviews: 65,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:baby","type:gear"],
      badge: null,
      brands: [
        { id: "basic_n", label: "Basic Set", price: 1500, img: "✂️", tier: 0, color: "#FFF8E1" },
        { id: "safety1st", label: "Safety 1st", price: 4500, img: "✂️", tier: 2, color: "#FCE4EC" },
      ]
    },
  ],
  mum: [
    {
      id: 11, name: "Maternity Pads", baseImg: "💛", rating: 4.8, reviews: 287,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort","gift:yes"],
      badge: "Essential",
      brands: [
        { id: "always_b", label: "Always Maxi Basic", price: 2200, img: "💛", tier: 0, color: "#FFF8E1" },
        { id: "always_o", label: "Always Overnight ×3", price: 3800, img: "💛", tier: 1, color: "#E8F5E9" },
        { id: "always_i", label: "Always Infinity ×3", price: 5500, img: "💛", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 12, name: "Nursing Pads", baseImg: "🤱", rating: 4.6, reviews: 156,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:feeding","gift:yes"],
      badge: null,
      brands: [
        { id: "lansinoh_np", label: "Lansinoh ×10", price: 3500, img: "🤱", tier: 1, color: "#E8F5E9" },
        { id: "medela_np", label: "Medela ×30", price: 6800, img: "🤱", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 13, name: "Nipple Cream", baseImg: "💊", rating: 4.9, reviews: 203,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:skincare","gift:yes"],
      badge: null,
      brands: [
        { id: "lansinoh_10", label: "Lansinoh 10ml", price: 4200, img: "💊", tier: 1, color: "#E8F5E9" },
        { id: "lansinoh_40", label: "Lansinoh 40ml", price: 8500, img: "💊", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 14, name: "Postpartum Belly Band", baseImg: "🩺", rating: 4.5, reviews: 112,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort"],
      badge: null,
      brands: [
        { id: "carriwell", label: "Carriwell Seamless", price: 8500, img: "🩺", tier: 1, color: "#E8F5E9" },
        { id: "bellybandit", label: "Belly Bandit", price: 22000, img: "🩺", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 15, name: "Hospital Slippers", baseImg: "🩴", rating: 4.5, reviews: 134,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort"],
      badge: null,
      brands: [
        { id: "eva", label: "Foam EVA Non-Slip", price: 2500, img: "🩴", tier: 0, color: "#FFF8E1" },
        { id: "birkenstock", label: "Birkenstock EVA", price: 18000, img: "🩴", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 16, name: "Labour Snack Pack", baseImg: "🍫", rating: 4.9, reviews: 245,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort","gift:yes"],
      badge: "Bestseller",
      brands: [
        { id: "bm_snack", label: "BundledMum Curated", price: 4500, img: "🍫", tier: 1, color: "#E8F5E9" },
        { id: "bm_snack_p", label: "BundledMum Premium", price: 12000, img: "🍫", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 17, name: "Disposable Underwear", baseImg: "👙", rating: 4.7, reviews: 167,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort"],
      badge: null,
      brands: [
        { id: "always_d", label: "Always Discreet ×10", price: 4200, img: "👙", tier: 1, color: "#E8F5E9" },
        { id: "frida_u", label: "Frida Mom ×12", price: 9500, img: "👙", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 18, name: "Nursing Nightgown", baseImg: "👘", rating: 4.7, reviews: 98,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:clothing","gift:yes"],
      badge: null,
      brands: [
        { id: "seraphine", label: "Seraphine", price: 12500, img: "👘", tier: 1, color: "#E8F5E9" },
        { id: "cachecoeur", label: "Cache Coeur ×2", price: 28000, img: "👘", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 19, name: "Antenatal Records Folder", baseImg: "📋", rating: 4.3, reviews: 67,
      tags: ["bundle:starter","bundle:standard","bundle:premium","gender:neutral","category:mum","type:gear"],
      badge: null,
      brands: [
        { id: "bm_folder", label: "BundledMum Organiser", price: 2200, img: "📋", tier: 1, color: "#E8F5E9" },
        { id: "bm_folder_p", label: "BundledMum Premium", price: 4500, img: "📋", tier: 2, color: "#FCE4EC" },
      ]
    },
    {
      id: 20, name: "Compression Socks", baseImg: "🧦", rating: 4.4, reviews: 56,
      tags: ["bundle:standard","bundle:premium","gender:neutral","category:mum","type:comfort"],
      badge: null,
      brands: [
        { id: "scholl", label: "Scholl Flight", price: 3800, img: "🧦", tier: 1, color: "#E8F5E9" },
        { id: "physix", label: "Physix Gear ×2", price: 7500, img: "🧦", tier: 2, color: "#FCE4EC" },
      ]
    },
  ]
};

export const ALL_PRODUCTS = [...PRODUCTS.baby, ...PRODUCTS.mum];

export const HERO_KIT = [
  { id: "hk1", name: "Huggies Nappy Pack", img: "🧷", price: 9500 },
  { id: "hk2", name: "Avent Bottle Set", img: "🍼", price: 18000 },
  { id: "hk3", name: "Carter's Onesie Set", img: "👶", price: 14500 },
  { id: "hk4", name: "Medela Nursing Pads", img: "💛", price: 8500 },
  { id: "hk5", name: "Aden+Anais Swaddle", img: "🌿", price: 11000 },
  { id: "hk6", name: "Lansinoh Nipple Cream", img: "🤱", price: 9500 },
];

export const TESTIMONIALS = [
  { name: "Adaeze O.", loc: "Lagos", stars: 5, text: "I was so overwhelmed before finding BundledMum. The quiz took 2 minutes and I had the perfect list. My Standard Boy Bundle arrived in 2 days — absolutely everything I needed!" },
  { name: "Ngozi T.", loc: "Abuja", stars: 5, text: "As a first-time mum in Nigeria, I had no idea where to start. BundledMum made it so easy. The products are actually good quality, not cheap imports. 10/10 recommend." },
  { name: "Kemi A.", loc: "Port Harcourt", stars: 5, text: "Bought the Premium Bundle as a baby shower gift. My friend cried when she saw everything. The presentation alone was worth it. Will always shop here for baby gifts." },
];

export const FAQ = [
  { q: "How does the quiz work?", a: "Our 3-question quiz asks about who you're shopping for, your baby's gender, and your budget. We instantly recommend the perfect products — no overwhelm, no guesswork." },
  { q: "Do you deliver across Nigeria?", a: "Yes! We deliver nationwide. Lagos orders arrive in 1–2 business days. Other states are 2–4 business days. Free delivery on orders over ₦30,000." },
  { q: "Can I change my bundle?", a: "Absolutely. The quiz gives you a personalised starting point, but you can add or remove individual items before checkout. It's your bundle." },
  { q: "Are the products safe for newborns?", a: "Every product on BundledMum is vetted for newborn safety. We stock only certified, skin-safe, and age-appropriate items." },
  { q: "What payment methods do you accept?", a: "Card (Mastercard, Visa, Verve), bank transfers, and USSD payments via Paystack. All transactions are secure and encrypted." },
  { q: "Can I return or exchange items?", a: "Yes — unused, sealed items can be returned within 7 days. Contact us on WhatsApp and we'll arrange a pickup." },
];
