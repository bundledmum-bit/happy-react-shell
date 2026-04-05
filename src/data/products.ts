export interface BrandTier {
  tier: number;
  label: string;
  brand: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: "baby" | "mum";
  emoji: string;
  badge?: string;
  rating: number;
  reviews: number;
  brands: BrandTier[];
}

export const babyProducts: Product[] = [
  { id: "nappies", name: "Newborn Nappies", category: "baby", emoji: "🧷", rating: 4.9, reviews: 124, brands: [
    { tier: 1, label: "Starter", brand: "Molfix", price: 3200 },
    { tier: 2, label: "Standard", brand: "Huggies Pure", price: 4800 },
    { tier: 3, label: "Premium", brand: "Pampers Premium", price: 6500 },
  ]},
  { id: "wipes", name: "Baby Wipes", category: "baby", emoji: "🧴", badge: "Essential", rating: 4.8, reviews: 98, brands: [
    { tier: 1, label: "Starter", brand: "Local Wipes", price: 800 },
    { tier: 2, label: "Standard", brand: "WaterWipes 60pcs", price: 2200 },
    { tier: 3, label: "Premium", brand: "WaterWipes Pure", price: 3500 },
  ]},
  { id: "skincare", name: "Baby Skincare Set", category: "baby", emoji: "🧴", rating: 4.7, reviews: 87, brands: [
    { tier: 1, label: "Starter", brand: "Purity", price: 2500 },
    { tier: 2, label: "Standard", brand: "Johnson's Complete", price: 4200 },
    { tier: 3, label: "Premium", brand: "Mustela Newborn Set", price: 12500 },
  ]},
  { id: "swaddle", name: "Muslin Swaddle", category: "baby", emoji: "👶", rating: 4.9, reviews: 76, brands: [
    { tier: 1, label: "Starter", brand: "Local Premium 3-pack", price: 4500 },
    { tier: 2, label: "Standard", brand: "Aden+Anais Classic", price: 7200 },
    { tier: 3, label: "Premium", brand: "Aden+Anais Dream 4-pack", price: 14000 },
  ]},
  { id: "onesie", name: "Newborn Onesie Set (3pcs)", category: "baby", emoji: "👕", badge: "Bestseller", rating: 4.8, reviews: 112, brands: [
    { tier: 1, label: "Starter", brand: "Local Brands", price: 3200 },
    { tier: 2, label: "Standard", brand: "H&M Essentials", price: 6800 },
    { tier: 3, label: "Premium", brand: "Carter's Essentials", price: 12000 },
  ]},
  { id: "going-home", name: "Going-Home Outfit", category: "baby", emoji: "👗", rating: 4.6, reviews: 64, brands: [
    { tier: 2, label: "Standard", brand: "H&M Occasion", price: 4500 },
    { tier: 3, label: "Premium", brand: "Carter's Special", price: 8500 },
  ]},
  { id: "cap-set", name: "Cap + Mittens + Booties", category: "baby", emoji: "🧤", rating: 4.7, reviews: 91, brands: [
    { tier: 2, label: "Standard", brand: "Local Knitwear", price: 1800 },
    { tier: 3, label: "Premium", brand: "Carter's Premium", price: 4200 },
  ]},
  { id: "thermometer", name: "Baby Thermometer", category: "baby", emoji: "🌡️", rating: 4.5, reviews: 53, brands: [
    { tier: 2, label: "Standard", brand: "Basic Digital", price: 3500 },
    { tier: 3, label: "Premium", brand: "Braun No-Touch", price: 18000 },
  ]},
  { id: "aspirator", name: "Nasal Aspirator", category: "baby", emoji: "👃", rating: 4.4, reviews: 42, brands: [
    { tier: 2, label: "Standard", brand: "Bulb Syringe", price: 1200 },
    { tier: 3, label: "Premium", brand: "Frida NoseFrida", price: 8500 },
  ]},
  { id: "nail-kit", name: "Baby Nail Kit", category: "baby", emoji: "✂️", rating: 4.3, reviews: 38, brands: [
    { tier: 2, label: "Standard", brand: "Basic Set", price: 1500 },
    { tier: 3, label: "Premium", brand: "Safety 1st Sleepy Baby", price: 4500 },
  ]},
  { id: "white-noise", name: "White Noise Machine", category: "baby", emoji: "🔊", badge: "New", rating: 4.6, reviews: 29, brands: [
    { tier: 2, label: "Standard", brand: "Phone App / Speaker", price: 3000 },
    { tier: 3, label: "Premium", brand: "Hatch Rest", price: 45000 },
  ]},
  { id: "carrier", name: "Baby Carrier", category: "baby", emoji: "🤱", rating: 4.8, reviews: 67, brands: [
    { tier: 2, label: "Standard", brand: "Ring Sling Local", price: 8500 },
    { tier: 3, label: "Premium", brand: "Ergobaby Embrace", price: 58000 },
  ]},
];

export const mumProducts: Product[] = [
  { id: "mat-pads", name: "Maternity Pads", category: "mum", emoji: "🩹", badge: "Essential", rating: 4.8, reviews: 134, brands: [
    { tier: 1, label: "Starter", brand: "Always Maxi Basic", price: 2200 },
    { tier: 2, label: "Standard", brand: "Always Maxi Overnight ×3", price: 3800 },
    { tier: 3, label: "Premium", brand: "Always Infinity FlexFoam ×3", price: 5500 },
  ]},
  { id: "disp-underwear", name: "Disposable Underwear", category: "mum", emoji: "🩲", rating: 4.7, reviews: 89, brands: [
    { tier: 2, label: "Standard", brand: "Always Discreet ×10", price: 4200 },
    { tier: 3, label: "Premium", brand: "Frida Mom ×12", price: 9500 },
  ]},
  { id: "nursing-pads", name: "Nursing Pads", category: "mum", emoji: "🤱", rating: 4.6, reviews: 78, brands: [
    { tier: 2, label: "Standard", brand: "Lansinoh ×10", price: 3500 },
    { tier: 3, label: "Premium", brand: "Medela ×30", price: 6800 },
  ]},
  { id: "nipple-cream", name: "Nipple Cream", category: "mum", emoji: "💧", rating: 4.9, reviews: 102, brands: [
    { tier: 2, label: "Standard", brand: "Lansinoh 10ml", price: 4200 },
    { tier: 3, label: "Premium", brand: "Lansinoh 40ml", price: 8500 },
  ]},
  { id: "belly-band", name: "Postpartum Belly Band", category: "mum", emoji: "🎗️", rating: 4.5, reviews: 56, brands: [
    { tier: 2, label: "Standard", brand: "Carriwell Seamless", price: 8500 },
    { tier: 3, label: "Premium", brand: "Belly Bandit Upsie", price: 22000 },
  ]},
  { id: "compression", name: "Compression Socks", category: "mum", emoji: "🧦", rating: 4.4, reviews: 34, brands: [
    { tier: 2, label: "Standard", brand: "Scholl Flight Class 1", price: 3800 },
    { tier: 3, label: "Premium", brand: "Physix Gear ×2", price: 7500 },
  ]},
  { id: "nightgown", name: "Nursing Nightgown", category: "mum", emoji: "👗", rating: 4.7, reviews: 67, brands: [
    { tier: 2, label: "Standard", brand: "Seraphine High-Waist", price: 12500 },
    { tier: 3, label: "Premium", brand: "Cache Coeur Kaftan ×2", price: 28000 },
  ]},
  { id: "robe", name: "Nursing Robe", category: "mum", emoji: "🧥", rating: 4.8, reviews: 45, brands: [
    { tier: 2, label: "Standard", brand: "Basic Cotton", price: 8500 },
    { tier: 3, label: "Premium", brand: "Cache Coeur Open-Front", price: 22000 },
  ]},
  { id: "sitz-bath", name: "Sitz Bath Soak", category: "mum", emoji: "🛁", rating: 4.5, reviews: 41, brands: [
    { tier: 2, label: "Standard", brand: "Local Herbal", price: 2500 },
    { tier: 3, label: "Premium", brand: "Frida Mom Sitz Bath", price: 9500 },
  ]},
  { id: "breast-pump", name: "Breast Pump", category: "mum", emoji: "🍼", rating: 4.6, reviews: 58, brands: [
    { tier: 2, label: "Standard", brand: "Tommee Tippee Manual", price: 8500 },
    { tier: 3, label: "Premium", brand: "Medela Swing Maxi", price: 85000 },
  ]},
  { id: "snack-pack", name: "Labour Snack Pack", category: "mum", emoji: "🍪", badge: "Bestseller", rating: 4.9, reviews: 143, brands: [
    { tier: 2, label: "Standard", brand: "BundledMum Curated", price: 4500 },
    { tier: 3, label: "Premium", brand: "BundledMum Premium Basket", price: 12000 },
  ]},
  { id: "records-folder", name: "Antenatal Records Folder", category: "mum", emoji: "📋", rating: 4.3, reviews: 32, brands: [
    { tier: 2, label: "Standard", brand: "BundledMum Organiser", price: 2200 },
    { tier: 3, label: "Premium", brand: "BundledMum Premium", price: 4500 },
  ]},
  { id: "slippers", name: "Hospital Slippers", category: "mum", emoji: "🩴", rating: 4.5, reviews: 78, brands: [
    { tier: 2, label: "Standard", brand: "Foam EVA Non-Slip", price: 2500 },
    { tier: 3, label: "Premium", brand: "Birkenstock EVA Arizona", price: 18000 },
  ]},
  { id: "hospital-bag", name: "Hospital Bag", category: "mum", emoji: "👜", rating: 4.7, reviews: 54, brands: [
    { tier: 2, label: "Standard", brand: "Spacious Tote", price: 6500 },
    { tier: 3, label: "Premium", brand: "Chicco Maternity Bag", price: 28000 },
  ]},
];

export const allProducts = [...babyProducts, ...mumProducts];
