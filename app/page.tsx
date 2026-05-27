"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaTools, FaGem, FaHeadset } from "react-icons/fa";
import { AnimatedText } from "@/components/AnimatedText";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: "transparent" }}>

      {/* ─── SECTION 1: Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        {/* Subtle ambient radial gradient */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(201,168,76,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #0D0D0D)" }} />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="section-label mb-8"
          >
            Premium Audio Equipment
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.5rem, 7vw, 7rem)",
              fontWeight: 300,
              letterSpacing: "0.2em",
              lineHeight: 1,
              marginBottom: "1.5rem",
              color: "#F5F5F5",
              whiteSpace: "nowrap",
            }}
          >
            SOUNDWAVE
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "4rem",
              height: "1px",
              background: "#C9A84C",
              opacity: 0.6,
              marginBottom: "2rem",
            }}
          />

          <AnimatedText
            text="Engineered for Those Who Hear More"
            as="p"
            underlineHeight="h-0"
            duration={0.03}
            delay={0.5}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "#A8A8A8",
              marginBottom: "3rem",
              fontStyle: "italic",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/products" className="btn-gold">
              Explore Products
            </Link>
            <Link
              href="/build-your-sound"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 2rem",
                background: "#C9A84C",
                color: "#0D0D0D",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#b8962f")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#C9A84C")}
            >
              Build Your Sound
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 2: Our Collection ───────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        className="py-28 px-6 container mx-auto max-w-7xl content-visibility-auto"
      >
        <div className="text-center mb-20">
          <p className="section-label mb-5">What We Offer</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "#F5F5F5",
              textTransform: "uppercase",
            }}
          >
            Our Collection
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "Amplifiers", tagline: "Power Your Sound", desc: "From Class-A to reference-grade hybrid designs" },
            { name: "Speakers", tagline: "Crystal Clear Fidelity", desc: "Floor-standing, bookshelf, and custom monitors" },
            { name: "Sound Systems", tagline: "Immersive Audio", desc: "Complete setups engineered for every space" },
            { name: "Cables", tagline: "Pure Connection", desc: "Hand-terminated with audiophile-grade conductors" },
          ].map((cat, i) => (
            <Link key={i} href={`/products?category=${cat.name.toLowerCase().replace(" ", "-")}`}>
              <div
                className="group relative overflow-hidden card-hover cursor-pointer"
                style={{
                  height: "22rem",
                  background: "#141414",
                  border: "1px solid #1F1F1F",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "2.5rem",
                }}
              >
                {/* Ambient gradient */}
                <div
                  className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: "radial-gradient(ellipse at top right, rgba(201,168,76,0.08) 0%, transparent 60%)",
                  }}
                />
                {/* Category number */}
                <span
                  className="absolute top-8 right-10 z-0"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "6rem",
                    fontWeight: 300,
                    color: "#1F1F1F",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  0{i + 1}
                </span>
                <div className="relative z-10 w-full">
                  <p className="section-label mb-3">{cat.tagline}</p>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "2.2rem",
                      fontWeight: 400,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#F5F5F5",
                      marginBottom: "0.75rem",
                      transition: "color 0.3s ease",
                    }}
                    className="group-hover:text-[#C9A84C] transition-colors duration-300"
                  >
                    {cat.name}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#6B6B6B", letterSpacing: "0.03em" }}>
                    {cat.desc}
                  </p>
                  {/* Bottom gold line on hover */}
                  <div
                    className="mt-5 w-0 group-hover:w-12 transition-all duration-500"
                    style={{ height: "1px", background: "#C9A84C" }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 3: Featured Product ─────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        className="py-28 content-visibility-auto"
        style={{ backgroundColor: "transparent" }}
      >
        <div className="container mx-auto px-6 max-w-7xl flex flex-col lg:flex-row items-center gap-20">

          {/* Image placeholder */}
          <div
            className="w-full lg:w-1/2 aspect-square relative flex items-center justify-center overflow-hidden"
            style={{
              background: "#141414",
              border: "1px solid #1F1F1F",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 text-center">
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "5rem",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.06)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "block",
                  lineHeight: 1,
                }}
              >
                Product
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.1)",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                }}
              >
                Image Coming Soon
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div>
              <p className="section-label mb-5">Featured Setup</p>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(2.5rem, 4vw, 3.8rem)",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: "#F5F5F5",
                  lineHeight: 1.15,
                  textTransform: "uppercase",
                }}
              >
                The Horizon<br />
                <span style={{ color: "#C9A84C", fontStyle: "italic", fontWeight: 400 }}>Acoustic Series</span>
              </h2>
            </div>

            <div style={{ height: "1px", background: "#1F1F1F" }} />

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "#A8A8A8", lineHeight: 1.9, letterSpacing: "0.02em" }}>
              Experience unprecedented clarity with our flagship acoustic series. Crafted from aerospace-grade aluminum and tuned by master acoustic engineers for a soundstage that completely immerses you.
            </p>

            <ul className="space-y-3">
              {[
                "Frequency Response: 5Hz – 50kHz",
                "THD: < 0.0001%",
                "Class-A Amplification",
              ].map((spec) => (
                <li key={spec} className="flex items-center gap-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#6B6B6B" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#C9A84C", flexShrink: 0, display: "inline-block" }} />
                  {spec}
                </li>
              ))}
            </ul>

            <Link href="/products/horizon-acoustic-series" className="btn-gold inline-flex">
              Enquire Now
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 4: Why SoundWave ────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        className="py-28 px-6 container mx-auto max-w-7xl content-visibility-auto"
      >
        <div className="text-center mb-20">
          <p className="section-label mb-5">Our Promise</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "#F5F5F5",
              textTransform: "uppercase",
            }}
          >
            Why SoundWave
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { Icon: FaTools, title: "Custom Built", desc: "Every system tailored precisely to your listening environment, acoustics, and preferences." },
            { Icon: FaGem, title: "Premium Components", desc: "We source only the finest audiophile-grade parts from the world's best manufacturers." },
            { Icon: FaHeadset, title: "Expert Support", desc: "Lifetime guidance from our master acoustic engineers — always available, never rushed." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center group">
              <div
                className="flex items-center justify-center mb-8 transition-all duration-500 group-hover:border-[#C9A84C]"
                style={{
                  width: "4.5rem",
                  height: "4.5rem",
                  borderRadius: "50%",
                  border: "1px solid #1F1F1F",
                  color: "#C9A84C",
                  fontSize: "1.25rem",
                  transition: "border-color 0.4s ease",
                }}
              >
                <Icon />
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#F5F5F5",
                  marginBottom: "1rem",
                }}
              >
                {title}
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#6B6B6B", lineHeight: 1.85, letterSpacing: "0.02em", maxWidth: "22rem" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 5: CTA Banner ───────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        className="py-32 px-6 content-visibility-auto"
        style={{ backgroundColor: "transparent" }}
      >
        <div
          className="container mx-auto max-w-3xl text-center"
          style={{
            background: "#141414",
            border: "1px solid #1F1F1F",
            padding: "5rem 3rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Corner accents */}
          <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem", width: "2rem", height: "2rem", borderTop: "1px solid #C9A84C", borderLeft: "1px solid #C9A84C", opacity: 0.4 }} />
          <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", width: "2rem", height: "2rem", borderTop: "1px solid #C9A84C", borderRight: "1px solid #C9A84C", opacity: 0.4 }} />
          <div style={{ position: "absolute", bottom: "1.5rem", left: "1.5rem", width: "2rem", height: "2rem", borderBottom: "1px solid #C9A84C", borderLeft: "1px solid #C9A84C", opacity: 0.4 }} />
          <div style={{ position: "absolute", bottom: "1.5rem", right: "1.5rem", width: "2rem", height: "2rem", borderBottom: "1px solid #C9A84C", borderRight: "1px solid #C9A84C", opacity: 0.4 }} />

          <p className="section-label mb-8">Bespoke Configuration</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300,
              letterSpacing: "0.08em",
              color: "#F5F5F5",
              textTransform: "uppercase",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Design Your Dream<br />Sound System
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "#6B6B6B", lineHeight: 1.9, letterSpacing: "0.02em", marginBottom: "2.5rem", maxWidth: "28rem", marginLeft: "auto", marginRight: "auto" }}>
            Work with our engineers to build a system perfectly matched to your space, acoustics, and listening preferences.
          </p>
          <Link href="/build-your-sound" className="btn-gold">
            Start Building
          </Link>
        </div>
      </motion.section>

    </div>
  );
}
