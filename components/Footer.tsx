"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const WAVEChatbot = dynamic(() => import("@/components/WAVEChatbot"), { ssr: false });

const data = {
  instaLink: "https://www.instagram.com/soundwave.gear?igsh=MXNxaTA0Mjh4ZWs0dQ==",
  twitterLink: "https://twitter.com/soundwave",
  youtubeLink: "https://youtube.com/soundwave",
  services: {
    amplifiers: "/products?category=amplifiers",
    speakers: "/products?category=speakers",
    systems: "/products?category=sound-systems",
    cables: "/products?category=cables",
  },
  about: {
    home: "/",
    products: "/products",
    customizer: "/build-your-sound",
    nextwave: "/next-wave",
  },
  help: {
    faqs: "/faq",
    support: "/support",
    privacy: "/privacy-policy",
    terms: "/terms-of-service",
    livechat: "#",
  },
  contact: {
    email: "soundwave31330@gmail.com",
    phone: "+91 95679 31330",
    address: "India",
  },
  company: {
    name: "SoundWave",
    description:
      "Experience the pinnacle of acoustic perfection with our premium amplifiers, custom speakers, and state-of-the-art audio systems.",
  },
};

const socialLinks = [
  { icon: FaInstagram, label: "Instagram", href: data.instaLink },
  { icon: FaXTwitter, label: "Twitter", href: data.twitterLink },
  { icon: FaYoutube, label: "YouTube", href: data.youtubeLink },
];

const aboutLinks = [
  { text: "Home", href: data.about.home },
  { text: "All Products", href: data.about.products },
  { text: "Customizer", href: data.about.customizer },
  { text: "Next Wave", href: data.about.nextwave },
];

const serviceLinks = [
  { text: "Amplifiers", href: data.services.amplifiers },
  { text: "Speakers", href: data.services.speakers },
  { text: "Sound Systems", href: data.services.systems },
  { text: "Premium Cables", href: data.services.cables },
];

const helpfulLinks = [
  { text: "FAQs", href: data.help.faqs },
  { text: "Support", href: data.help.support },
  { text: "Privacy Policy", href: data.help.privacy },
  { text: "Terms of Service", href: data.help.terms },
  { text: "Live Chat", href: data.help.livechat, hasIndicator: true, isLiveChat: true },
];

const contactInfo = [
  { icon: FaEnvelope, text: data.contact.email, href: `mailto:${data.contact.email}` },
  { icon: FaWhatsapp, text: data.contact.phone, href: `https://wa.me/919567931330` },
  { icon: FaInstagram, text: "@soundwave.gear", href: data.instaLink },
];

export default function Footer() {
  const pathname = usePathname();
  const isExcluded = pathname === "/welcome" || pathname === "/dashboard" || pathname.startsWith("/admin");

  if (pathname === "/welcome" || pathname.startsWith("/admin")) return null;

  const handleLiveChatClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const btn = document.getElementById("wave-chatbot-toggle");
    if (btn) {
      btn.click();
    }
  };

  return (
    <>
      <footer className="relative bg-background pt-16 pb-12 z-10 font-sans overflow-hidden">
        {/* Animated ambient glow orbs behind the glass card */}
        <div 
          className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-primary/18 to-amber-500/12 blur-[100px] mix-blend-screen pointer-events-none"
          style={{
            animation: "pulse-glow 8s ease-in-out infinite alternate"
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/10 to-yellow-600/5 blur-[90px] mix-blend-screen pointer-events-none"
          style={{
            animation: "pulse-glow 12s ease-in-out infinite alternate-reverse"
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Glass Card Container */}
          <div className="relative rounded-3xl border border-white/[0.06] bg-neutral-950/40 backdrop-blur-xl p-8 md:p-12 shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Subtle inner card border highlights */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60" />

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* Left Column: Brand & Socials */}
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left justify-between">
                <div>
                  <span className="text-2xl font-bold tracking-wider text-foreground">
                    Sound<span className="text-primary font-serif italic">Wave</span>
                  </span>

                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-secondary/60">
                    {data.company.description}
                  </p>
                </div>

                <ul className="mt-8 flex justify-center gap-6 sm:justify-start">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary/50 hover:text-primary hover:scale-110 transition-all duration-300 block"
                      >
                        <span className="sr-only">{label}</span>
                        <Icon className="size-5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Columns Grid */}
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">
                {/* Column 1: Shop */}
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">Categories</p>
                  <ul className="mt-6 space-y-3.5 text-sm">
                    {serviceLinks.map(({ text, href }) => (
                      <li key={text}>
                        <Link
                          href={href}
                          className="text-secondary/70 hover:text-primary transition-all duration-200"
                        >
                          {text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Company */}
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">Company</p>
                  <ul className="mt-6 space-y-3.5 text-sm">
                    {aboutLinks.map(({ text, href }) => (
                      <li key={text}>
                        <Link
                          href={href}
                          className="text-secondary/70 hover:text-primary transition-all duration-200"
                        >
                          {text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Support */}
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">Helpful Links</p>
                  <ul className="mt-6 space-y-3.5 text-sm">
                    {helpfulLinks.map(({ text, href, hasIndicator, isLiveChat }) => (
                      <li key={text}>
                        {isLiveChat ? (
                          <a
                            href={href}
                            onClick={handleLiveChatClick}
                            className="group inline-flex items-center justify-center gap-1.5 sm:justify-start text-secondary/70 hover:text-primary transition-all duration-200 cursor-pointer"
                          >
                            <span>{text}</span>
                            {hasIndicator && (
                              <span className="relative flex size-1.5">
                                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
                              </span>
                            )}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className="text-secondary/70 hover:text-primary transition-all duration-200"
                          >
                            {text}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4: Contact */}
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">Contact Us</p>
                  <ul className="mt-6 space-y-3.5 text-sm">
                    {contactInfo.map(({ icon: Icon, text, href }) => (
                      <li key={text}>
                        <a
                          href={href}
                          className="flex items-center justify-center gap-2 sm:justify-start text-secondary/70 hover:text-primary transition-all duration-200"
                        >
                          <Icon className="text-primary size-4 shrink-0" />
                          <span className="break-all">{text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Centered Copyright Section outside the card */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary/40 px-4">
            <p>&copy; {new Date().getFullYear()} {data.company.name}. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WAVE AI Chatbot — hidden on welcome & dashboard */}
      {!isExcluded && <WAVEChatbot />}

      {/* WhatsApp Floating Glass Button */}
      <a
        href="https://wa.me/919567931330"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        style={{
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "50%",
          background: "rgba(37, 211, 102, 0.18)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "#25D366",
          fontSize: "1.45rem",
          boxShadow: [
            "inset 0 0 0 1px rgba(37,211,102,0.35)",
            "inset 0 1px 0 rgba(255,255,255,0.25)",
            "inset 0 -2px 8px rgba(37,211,102,0.2)",
            "0 4px 24px rgba(37,211,102,0.3)",
            "0 1px 3px rgba(0,0,0,0.5)",
          ].join(", "),
          position: "fixed",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "10px",
            right: "10px",
            height: "40%",
            borderRadius: "50%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <FaWhatsapp />
      </a>

      {/* Keyframes for ambient background glow */}
      <style>{`
        @keyframes pulse-glow {
          0% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.65;
          }
          50% {
            transform: translate(30px, -15px) scale(1.1);
            opacity: 0.90;
          }
          100% {
            transform: translate(-15px, 20px) scale(0.95);
            opacity: 0.60;
          }
        }
      `}</style>
    </>
  );
}
