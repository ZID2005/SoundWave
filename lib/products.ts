export interface Product {
  id: string;
  name: string;
  category: 'amplifiers' | 'speakers' | 'sound-systems' | 'cables';
  technology: 'tube' | 'solid-state' | 'hybrid' | 'digital';
  priceRange: 'under-50k' | '50k-1l' | '1l-3l' | '3l+';
  priceRangeText: string;
  description: string;
  image: string;
  specs: Record<string, string>;
}

export const dummyProducts: Product[] = [
  {
    id: "horizon-acoustic-series",
    name: "The Horizon Acoustic Series",
    category: "sound-systems",
    technology: "hybrid",
    priceRange: "3l+",
    priceRangeText: "₹3.5L - ₹4.2L",
    description: "Experience unprecedented clarity with our flagship acoustic series. Crafted from aerospace-grade aluminum and tuned by master acoustic engineers.",
    image: "placeholder",
    specs: {
      "Frequency Response": "5Hz - 50kHz",
      "THD": "< 0.0001%",
      "Amplification": "Class-A"
    }
  },
  {
    id: "aethos-integrated-amp",
    name: "Aethos Integrated Amp",
    category: "amplifiers",
    technology: "solid-state",
    priceRange: "1l-3l",
    priceRangeText: "₹2.1L",
    description: "A dual-mono integrated amplifier delivering pristine power and unparalleled control over even the most demanding loudspeakers.",
    image: "placeholder",
    specs: {
      "Power Output": "150W per channel",
      "Inputs": "5x RCA, 1x XLR",
      "Weight": "17.5 kg"
    }
  },
  {
    id: "valkyrie-tube-preamp",
    name: "Valkyrie Tube Preamp",
    category: "amplifiers",
    technology: "tube",
    priceRange: "50k-1l",
    priceRangeText: "₹85,000",
    description: "Warmth, holographic soundstage, and lush mids. The Valkyrie brings the magic of vacuum tubes to your digital and analog sources.",
    image: "placeholder",
    specs: {
      "Tubes": "4x 12AX7, 2x 12AU7",
      "Gain": "15dB",
      "Output Impedance": "200 Ohms"
    }
  },
  {
    id: "obsidian-bookshelf",
    name: "Obsidian Monitors",
    category: "speakers",
    technology: "solid-state",
    priceRange: "1l-3l",
    priceRangeText: "₹1.4L / pair",
    description: "Reference-grade bookshelf speakers featuring beryllium tweeters and custom carbon-fiber mid-woofers.",
    image: "placeholder",
    specs: {
      "Sensitivity": "87dB",
      "Impedance": "8 Ohms",
      "Recommended Power": "50W - 200W"
    }
  },
  {
    id: "obsidian-floorstanders",
    name: "Obsidian Towers",
    category: "speakers",
    technology: "hybrid",
    priceRange: "3l+",
    priceRangeText: "₹4.8L / pair",
    description: "Full-range floorstanding monoliths capable of reproducing the full scale and dynamics of a live orchestra.",
    image: "placeholder",
    specs: {
      "Sensitivity": "90dB",
      "Impedance": "4 Ohms",
      "Frequency Response": "20Hz - 40kHz"
    }
  },
  {
    id: "quantum-dac",
    name: "Quantum DAC",
    category: "amplifiers",
    technology: "digital",
    priceRange: "under-50k",
    priceRangeText: "₹45,000",
    description: "A reference digital-to-analog converter with proprietary FPGA architecture.",
    image: "placeholder",
    specs: {
      "Decoding": "Up to 32-bit/768kHz PCM, DSD512",
      "Outputs": "RCA, XLR",
      "Dynamic Range": "130dB"
    }
  },
  {
    id: "silver-streak-interconnects",
    name: "Silver Streak RCA",
    category: "cables",
    technology: "solid-state",
    priceRange: "under-50k",
    priceRangeText: "₹15,000 / pair",
    description: "Pure silver conductors with Teflon dielectric for zero signal degradation and perfect phase coherency.",
    image: "placeholder",
    specs: {
      "Conductor": "99.999% Pure Silver",
      "Shielding": "Double braided copper",
      "Connectors": "Rhodium-plated"
    }
  },
  {
    id: "titan-speaker-cables",
    name: "Titan Speaker Cables",
    category: "cables",
    technology: "solid-state",
    priceRange: "50k-1l",
    priceRangeText: "₹65,000 / pair",
    description: "Massive gauge pure OCC copper for effortless current delivery to your hungry loudspeakers.",
    image: "placeholder",
    specs: {
      "Gauge": "8 AWG",
      "Dielectric": "Air-spaced Polyethylene",
      "Termination": "Cold-welded Bananas or Spades"
    }
  }
];
