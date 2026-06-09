export interface Product {
  id: string;
  name: string;
  category: 'amplifiers' | 'speakers' | 'sound-systems' | 'cables';
  technology: 'tube' | 'solid-state' | 'hybrid' | 'digital';
  priceRange: 'under-50k' | '50k-1l' | '1l-3l' | '3l+';
  priceRangeText: string;
  description: string;
  image: string;
  images?: string[];
  specs: Record<string, string>;
  createdAt?: string;
}

export const dummyProducts: Product[] = [
  {
    id: "class-d-amplifier",
    name: "Class D Amplifier",
    category: "amplifiers",
    technology: "digital",
    priceRange: "under-50k",
    priceRangeText: "₹3,000",
    description: "A compact and powerful 50 Watts Class D stereo amplifier (50W + 50W output) featuring dedicated bass and treble tone controls, built-in speaker protection, and an integrated 0.5 Bluetooth receiver.",
    image: "/images/products/class-d-amp-front.jpg",
    images: [
      "/images/products/class-d-amp-front.jpg",
      "/images/products/class-d-amp-back.jpg"
    ],
    specs: {
      "Topology": "Class D Stereo Amplifier",
      "Power Output": "50W + 50W (Stereo Output)",
      "Tone Control": "Dedicated Bass & Treble Knobs",
      "Wireless": "Built-in 0.5 Bluetooth Receiver",
      "Inputs": "RCA Aux Input",
      "Outputs": "Spring Clip Speaker Terminals",
      "Power Supply": "DC Power Input (Toggle Switch control)",
      "Price": "₹3,000"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "amplifier-21",
    name: "2.1 Amplifier",
    category: "amplifiers",
    technology: "solid-state",
    priceRange: "under-50k",
    priceRangeText: "₹27,500",
    description: "A premium 2.1 channel controlled amplifier featuring 100 Watts per channel stereo and 200 Watts subwoofer output. Built with soft start control, 3-channel built-in speaker protection, dedicated bass and treble tone controls with low-pass filtering, gain control, and a 0.5 Bluetooth receiver with auxiliary input.",
    image: "/images/products/amp-21-front.png",
    images: [
      "/images/products/amp-21-front.png",
      "/images/products/amp-21-rear.jpg",
      "/images/products/amp-21-top.jpg"
    ],
    specs: {
      "Topology": "2.1 Channel Controlled Amplifier",
      "Stereo Output": "100 Watts per Channel",
      "Subwoofer Output": "200 Watts",
      "Soft Start": "Inbuilt soft start control",
      "Protection": "3-Channel built-in speaker protection",
      "Tone Control": "Dedicated Bass & Treble with Low-Pass Filter",
      "Gain Control": "Gain control system",
      "Connectivity": "0.5 Bluetooth Receiver with Aux",
      "Price": "₹27,500"
    }
  },
  {
    id: "soundwave-21-combo",
    name: "Soundwave 2.1 System Combo Pack",
    category: "sound-systems",
    technology: "solid-state",
    priceRange: "50k-1l",
    priceRangeText: "₹57,500",
    description: "High-performance audio combo pack featuring the premium 2.1 channel controlled amplifier, paired with matching 2-channel stereo bookshelf speakers and an imported-grade subwoofer box.",
    image: "/images/products/combo-pack.jpg",
    images: [
      "/images/products/combo-pack.jpg"
    ],
    specs: {
      "Included Amplifier": "2.1 Channel Controlled Amplifier",
      "Included Speakers": "2-Channel Stereo Bookshelf Speakers",
      "Included Subwoofer": "Imported Grade Subwoofer Box",
      "Price": "₹57,500"
    }
  },
  {
    id: "yamaha-3inch-bookshelf-speaker",
    name: "Yamaha 3-Inch Bookshelf Speaker with Tweeter",
    category: "speakers",
    technology: "solid-state",
    priceRange: "under-50k",
    priceRangeText: "₹7,500 / pair",
    description: "Premium bookshelf speakers featuring custom Yamaha 3-inch drivers and integrated high-frequency tweeters. Designed with an inbuilt high-performance crossover network specifically optimized for Class-D digital amplifiers, delivering ultra-clear vocal clarity, sparkling highs, and a punchy, well-defined mid-bass response. Housed in custom handcrafted wood enclosures with removable acoustic black fabric grilles.",
    image: "/images/products/yamaha-3inch-bookshelf-front.jpg",
    images: [
      "/images/products/yamaha-3inch-bookshelf-front.jpg",
      "/images/products/yamaha-3inch-bookshelf-grille.jpg",
      "/images/products/yamaha-3inch-bookshelf-back.jpg"
    ],
    specs: {
      "Drivers": "★ 3-Inch Yamaha Woofer Driver + Integrated Tweeter",
      "Crossover": "★ Inbuilt Crossover Network (Optimized for Class-D Amps)",
      "Power Handling": "★ 50 Watts RMS Continuous Power",
      "Enclosure": "Premium Walnut Veneer Wood Cabinets",
      "Grilles": "Acoustic Removable Black Cloth Grilles",
      "Price": "₹7,500 / pair"
    }
  },
  {
    id: "mid-base-21-amplifier",
    name: "Mid Base 2.1 Amplifier",
    category: "amplifiers",
    technology: "solid-state",
    priceRange: "under-50k",
    priceRangeText: "₹22,000",
    description: "A powerhouse 2.1 stereo amplifier built around a dual-channel MOSFET power stage and a dedicated sub-channel transistor circuit. Delivers tight, authoritative bass reproduction alongside pristine stereo mid-range clarity. Features a low-pass stereo preamplifier stage with active speaker protection circuitry, banana-style binding posts, gold-plated RCA inputs, and an inbuilt Bluetooth receiver. Premium SCHACH electrolytic capacitors ensure ultra-low distortion and long-term reliability across the entire signal chain.",
    image: "/images/products/mid-base-21-amp-front.jpg",
    images: [
      "/images/products/mid-base-21-amp-front.jpg",
      "/images/products/mid-base-21-amp-back.png",
      "/images/products/mid-base-21-amp-side.jpg"
    ],
    specs: {
      "Topology": "★ Stereo 2-Channel MOSFET Power Amplifier",
      "Sub Channel": "★ Dedicated Sub-Channel Transistor Stage",
      "Preamp": "Low-Pass Stereo Preamplifier Stage",
      "Protection": "★ Active Speaker Protection Circuit",
      "Speaker Output": "Banana Speaker Binding Posts",
      "Inputs": "RCA Aux Input",
      "Controls": "Low-Pass Volume Control + Selector Mode Switch",
      "Wireless": "Inbuilt Bluetooth Receiver",
      "Capacitors": "★ Special Grade SCHACH Electrolytic",
      "Price": "₹22,000"
    }
  },
  {
    id: "bluetooth-pro-preamp",
    name: "Bluetooth Pre Amplifier for Professional Grade",
    category: "amplifiers",
    technology: "solid-state",
    priceRange: "under-50k",
    priceRangeText: "₹12,500",
    description: "A professional-grade Bluetooth pre-amplifier engineered for audiophiles and studio environments. Features a dedicated Bass + Triple Mid tone stack, professional-grade OP-Amp circuitry with precision gain control, gold-plated RCA phono connectors, and a special-grade CRGO toroidal transformer with an ultra-wide 90 kHz bandwidth. Built on premium SCHACH electrolytic capacitors for crystal-clear signal fidelity. Switchable front panel with a dedicated power socket for a clean, professional desktop installation.",
    image: "/images/products/bluetooth-pro-preamp-front.png",
    images: [
      "/images/products/bluetooth-pro-preamp-front.png",
      "/images/products/bluetooth-pro-preamp-back.png",
      "/images/products/bluetooth-pro-preamp-top.jpg"
    ],
    specs: {
      "Tone Control": "Dedicated Bass + Triple Mid EQ",
      "Bluetooth": "0.5 Bluetooth Receiver with Aux & FM",
      "Amplification": "★ Professional Grade OP-Amp with Gain Control",
      "Connectors": "★ Gold Plated RCA Socket with Phono Connector",
      "Front Panel": "Selected Switch Panel with Power Socket",
      "Transformer": "★ Special Grade CRGO — 90 kHz Bandwidth",
      "Capacitors": "★ Special Grade SCHACH Electrolytic",
      "Price": "₹12,500"
    }
  }
];

// ── Shared session-level product cache ─────────────────────────────────────
// The products LIST page populates this the first time it loads.
// The DETAIL page reads from here first — so navigating from list→detail
// is instant (zero extra Firestore calls).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let sharedProductsCache: any[] | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSharedProductsCache(data: any[]) {
  sharedProductsCache = data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProductById(id: string): any | null {
  if (sharedProductsCache) {
    const found = sharedProductsCache.find((p) => p.id === id);
    if (found) return found;
  }
  return dummyProducts.find((p) => p.id === id) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRelatedFromCache(category: string, excludeId: string): any[] {
  const pool = sharedProductsCache ?? dummyProducts;
  return pool
    .filter((p) => p.category === category && p.id !== excludeId)
    .slice(0, 3);
}
