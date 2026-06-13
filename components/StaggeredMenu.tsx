"use client";

import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Outfit } from 'next/font/google';
import { gsap } from 'gsap';
import CartIcon from '@/components/CartIcon';
import { ShinyButton } from '@/components/ShinyButton';
import { cn } from '@/lib/utils';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

interface MenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
}

interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: MenuItem[];
  displayItemNumbering?: boolean;
  className?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  accentColor?: string;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

const getFirstName = (name: string | null | undefined) => {
  if (!name) return "User";
  const cleaned = name.trim();
  if (cleaned.startsWith("+")) return "User " + cleaned.slice(-4);
  if (cleaned.includes("@")) return cleaned.split("@")[0];
  return cleaned.split(/\s+/)[0];
};

// Pure-CSS TextRoll — no per-char React animation nodes, zero JS animation cost
interface TextRollProps {
  children: string;
  className?: string;
  center?: boolean;
}

const TextRoll: React.FC<TextRollProps> = ({ children, className, center = false }) => {
  const chars = children.split("");
  const len = chars.length;
  return (
    <span className={cn("sm-textroll", className)}>
      {/* Top layer — slides up on hover */}
      <span className="sm-textroll-top" aria-hidden="true">
        {chars.map((l, i) => {
          const pct = center
            ? Math.abs(i - (len - 1) / 2) / Math.max(len - 1, 1)
            : i / Math.max(len - 1, 1);
          return (
            <span
              key={i}
              className="sm-textroll-char"
              style={{ transitionDelay: `${(pct * 0.12).toFixed(3)}s` }}
            >
              {l === " " ? "\u00A0" : l}
            </span>
          );
        })}
      </span>
      {/* Bottom layer — slides in from below on hover */}
      <span className="sm-textroll-bottom" aria-hidden="true">
        {chars.map((l, i) => {
          const pct = center
            ? Math.abs(i - (len - 1) / 2) / Math.max(len - 1, 1)
            : i / Math.max(len - 1, 1);
          return (
            <span
              key={i}
              className="sm-textroll-char"
              style={{ transitionDelay: `${(pct * 0.12).toFixed(3)}s` }}
            >
              {l === " " ? "\u00A0" : l}
            </span>
          );
        })}
      </span>
      {/* Screen-reader text */}
      <span className="sr-only">{children}</span>
    </span>
  );
};

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  items = [],
  className = '',
  menuButtonColor = '#C9A84C',
  openMenuButtonColor = '#C9A84C',
  changeMenuColorOnOpen = true,
  isFixed = true,
  accentColor = '#C9A84C',
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, setShowAuthModal, setAuthInitialMode } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);


  // Hamburger icon line refs
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Eagerly prefetch all menu routes on mount so clicks feel instant.
  // Menu panel is hidden (visibility:hidden) so Next.js viewport-prefetcher
  // never fires for these links automatically.
  useEffect(() => {
    if (!items.length) return;
    items.forEach((item) => {
      router.prefetch(item.link);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin Check
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (adminUid && user.uid === adminUid) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);


  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const l1 = line1Ref.current;
      const l2 = line2Ref.current;
      const l3 = line3Ref.current;

      if (!panel || !l1 || !l2 || !l3) return;

      gsap.set(panel, { opacity: 0, visibility: 'hidden' });

      // Reset hamburger lines to closed state
      gsap.set(l1, { y: 0, rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(l2, { opacity: 1, transformOrigin: '50% 50%' });
      gsap.set(l3, { y: 0, rotate: 0, transformOrigin: '50% 50%' });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const controlsContainer = panel.querySelector('.sm-panel-controls');

    if (itemEls.length) gsap.set(itemEls, { y: 36, opacity: 0 });
    if (controlsContainer) gsap.set(controlsContainer, { y: 20, opacity: 0 });

    // Remove the blur class during the open animation — add it back after
    panel.classList.remove('sm-panel-blurred');

    const tl = gsap.timeline({ paused: true });

    tl.fromTo(
      panel,
      { opacity: 0, visibility: 'hidden' },
      { opacity: 1, visibility: 'visible', duration: 0.28, ease: 'power2.out' },
      0
    );

    if (itemEls.length) {
      tl.to(
        itemEls,
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.05 },
        0.08
      );
    }

    if (controlsContainer) {
      tl.to(controlsContainer, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, 0.2);
    }

    // Apply backdrop-blur only after panel is fully opaque to avoid GPU jank
    tl.call(() => { panel.classList.add('sm-panel-blurred'); }, [], 0.28);

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const controlsContainer = panel.querySelector('.sm-panel-controls');

    // Drop backdrop-blur immediately so it doesn't composite during fade-out
    panel.classList.remove('sm-panel-blurred');

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(panel, { opacity: 0, visibility: 'hidden' });
        if (itemEls.length) gsap.set(itemEls, { y: 36, opacity: 0 });
        if (controlsContainer) gsap.set(controlsContainer, { y: 20, opacity: 0 });
        busyRef.current = false;
      }
    });

    if (itemEls.length) {
      tl.to(itemEls, { y: -16, opacity: 0, duration: 0.2, ease: 'power2.in', stagger: 0.025 }, 0);
    }
    if (controlsContainer) {
      tl.to(controlsContainer, { y: -10, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
    }

    tl.to(
      panel,
      { opacity: 0, duration: 0.25, ease: 'power2.inOut' },
      0.08
    );

    closeTweenRef.current = tl;
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    const l3 = line3Ref.current;
    if (!l1 || !l2 || !l3) return;

    spinTweenRef.current?.kill();

    // Line spacing: 1.5px line height + 5px gap = 6.5px between centers
    const SHIFT = 6.5;
    const ease = 'power2.inOut';
    const dur = 0.3;

    if (opening) {
      // Animate to X
      spinTweenRef.current = gsap
        .timeline({ defaults: { duration: dur, ease } })
        .to(l1, { y: SHIFT, rotate: 45 }, 0)
        .to(l2, { opacity: 0 }, 0)
        .to(l3, { y: -SHIFT, rotate: -45 }, 0);
    } else {
      // Reverse back to 3 lines
      spinTweenRef.current = gsap
        .timeline({ defaults: { duration: dur, ease } })
        .to(l1, { y: 0, rotate: 0 }, 0)
        .to(l2, { opacity: 1 }, 0)
        .to(l3, { y: 0, rotate: 0 }, 0);
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
  }, [playOpen, playClose, animateIcon, animateColor, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
    }
  }, [playClose, animateIcon, animateColor, onMenuClose]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  // Close menu on route changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  return (
    <div
      className={`sm-scope z-40 pointer-events-none ${isFixed ? 'fixed top-0 left-0 w-screen h-screen overflow-hidden' : 'w-full h-full'}`}
    >
      <div
        className={
          (className ? className + ' ' : '') + 'staggered-menu-wrapper pointer-events-none relative w-full h-full'
        }
        style={accentColor ? { ['--sm-accent']: accentColor } as React.CSSProperties : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        <header
          className="staggered-menu-header fixed top-0 left-0 w-full flex items-center justify-between p-[0_1.5em] pointer-events-none z-20 h-20 md:p-[0_3em]"
          style={{
            background: open ? "transparent" : (isScrolled ? "rgba(10, 10, 10, 0.75)" : "transparent"),
            backdropFilter: open ? "none" : (isScrolled ? "blur(20px)" : "none"),
            WebkitBackdropFilter: open ? "none" : (isScrolled ? "blur(20px)" : "none"),
            borderBottom: open ? "none" : (isScrolled
              ? "0.5px solid rgba(201, 168, 76, 0.2)"
              : "0.5px solid transparent"),
            transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
          }}
          aria-label="Main navigation header"
        >
          {/* Logo Left */}
          <Link
            href="/"
            onClick={closeMenu}
            className="sm-logo flex items-center select-none pointer-events-auto tracking-[0.28em] uppercase"
            style={{
              fontFamily: "'Bebas Neue', 'Impact', ui-sans-serif, system-ui, sans-serif",
              fontSize: "1.45rem",
              fontWeight: 400,
              color: "#C9A84C",
              lineHeight: 1,
            }}
          >
            SOUNDWAVE
            {mounted && isAdmin && (
              <span className="ml-2 bg-[#C9A84C] text-[#0D0D0D] text-[0.55rem] font-bold
                               tracking-widest px-2 py-0.5 rounded-full uppercase align-middle
                               shadow-[0_0_10px_rgba(201,168,76,0.3)]">
                Admin
              </span>
            )}
          </Link>

          {/* Desktop Nav Links (Centred) */}
          <nav className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-auto" aria-label="Primary">
            <ul className="list-none flex items-center gap-1.5 m-0 p-0">
              {items.map((link) => {
                const isActive = pathname === link.link;
                return (
                  <li key={link.link}>
                    <Link
                      href={link.link}
                      className={`nav-link ${outfit.className} ${
                        isActive ? "nav-link-active" : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right side controls (Cart + User + Toggle Button) */}
          <div className="flex items-center gap-4 shrink-0 pointer-events-auto">
            {/* Desktop Only Controls (Cart + User name) */}
            <div className="hidden md:flex items-center gap-4">
              <CartIcon />
              {mounted && user ? (
                <Link href="/dashboard" onClick={closeMenu}>
                  <ShinyButton
                    style={{ "--shiny-cta-padding": "0.45rem 1.15rem", "--shiny-cta-font-size": "0.75rem" } as React.CSSProperties}
                  >
                    {getFirstName(user.displayName || user.email || user.phoneNumber)}
                  </ShinyButton>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthInitialMode("login");
                      setShowAuthModal(true);
                    }}
                    className="nav-auth-login"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthInitialMode("create");
                      setShowAuthModal(true);
                    }}
                    className="nav-auth-signup"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Only Cart (Cart is visible on mobile top-right, next to menu toggle) */}
            <div className="block md:hidden">
              <CartIcon />
            </div>

            {/* Toggle Button — bare hamburger icon, no text label */}
            <button
              ref={toggleBtnRef}
              className="sm-hamburger-btn"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="staggered-menu-panel"
              onClick={toggleMenu}
              type="button"
            >
              <span ref={iconRef} className="sm-hamburger-icon" aria-hidden="true">
                <span ref={line1Ref} className="sm-hamburger-line" />
                <span ref={line2Ref} className="sm-hamburger-line" />
                <span ref={line3Ref} className="sm-hamburger-line" />
              </span>
            </button>
          </div>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 left-0 w-full h-full flex flex-col justify-center items-center p-[7.5em_5vw_3em_5vw] md:p-[9em_10vw_4em_10vw] overflow-y-auto z-10 pointer-events-auto"
          style={{
            background: 'rgba(10, 10, 10, 0.88)',
            visibility: 'hidden',
            opacity: 0,
          }}
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col justify-center items-center relative w-full h-full">
            {/* Nav List */}
            <ul
              className="sm-panel-list list-none m-0 p-0 flex flex-col gap-4 text-center items-center justify-center"
              role="list"
            >
              {items && items.length ? (
                items.map((it, idx) => {
                  const isActive = pathname === it.link;
                  return (
                    <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                      <Link
                        className={`${outfit.className} sm-panel-item relative font-extrabold cursor-pointer leading-none tracking-[-0.03em] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline`}
                        style={{
                          fontSize: 'clamp(2.2rem, 6vw, 4rem)',
                          color: isActive ? '#C9A84C' : '#FFFFFF',
                        }}
                        href={it.link}
                        prefetch={true}
                        onClick={closeMenu}
                        aria-label={it.ariaLabel}
                      >
                        <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%]">
                          <TextRoll center>{it.label}</TextRoll>
                        </span>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item relative text-white font-semibold text-[2rem] cursor-pointer leading-none tracking-[-1px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline">
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {/* Mobile Controls section inside panel (hidden on desktop) */}
            <div className="sm-panel-controls flex flex-col gap-6 items-center pt-8 border-t border-neutral-900/80 mt-12 md:hidden">
              <div className="flex items-center gap-6">
                <span className={`${outfit.className} text-white/50 text-xs tracking-[0.1em] uppercase`}>Cart:</span>
                <CartIcon />
              </div>
              
              <div className="w-full flex justify-center">
                {mounted && user ? (
                  <Link href="/dashboard" onClick={closeMenu}>
                    <ShinyButton
                      style={{ "--shiny-cta-padding": "0.55rem 1.4rem", "--shiny-cta-font-size": "0.8rem" } as React.CSSProperties}
                    >
                      {getFirstName(user.displayName || user.email || user.phoneNumber)}
                    </ShinyButton>
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAuthInitialMode("login");
                        setShowAuthModal(true);
                        closeMenu();
                      }}
                      className="nav-auth-login"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setAuthInitialMode("create");
                        setShowAuthModal(true);
                        closeMenu();
                      }}
                      className="nav-auth-signup"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; p-0; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }

/* ---- Hamburger toggle button ---- */
.sm-scope .sm-hamburger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #C9A84C;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.sm-scope .sm-hamburger-btn:hover { opacity: 0.7; }
.sm-scope .sm-hamburger-btn:focus-visible { outline: 2px solid rgba(255,255,255,0.5); outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 22px;
}
.sm-scope .sm-hamburger-line {
  display: block;
  width: 22px;
  height: 1.5px;
  background: currentColor;
  border-radius: 2px;
  will-change: transform, opacity;
  transform-origin: 50% 50%;
}
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
.sm-scope .sm-panel-blurred { backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.sm-scope .sm-panel-item { position: relative; cursor: pointer; line-height: 1; text-transform: uppercase; display: inline-block; text-decoration: none; }
.sm-scope .sm-panel-itemLabel { display: inline-block; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover .sm-textroll-char { color: #C9A84C; }

/* ---- Pure-CSS TextRoll ---- */
.sm-textroll { position: relative; display: inline-block; overflow: hidden; line-height: 1; vertical-align: top; }
.sm-textroll-top,
.sm-textroll-bottom { display: block; white-space: nowrap; }
.sm-textroll-bottom { position: absolute; top: 0; left: 0; }
.sm-textroll-char {
  display: inline-block;
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s ease;
  will-change: transform;
}
/* Top row: hover slides up */
.sm-textroll-top .sm-textroll-char { transform: translateY(0); }
.sm-panel-item:hover .sm-textroll-top .sm-textroll-char { transform: translateY(-105%); }
/* Bottom row: starts below, hover slides into place */
.sm-textroll-bottom .sm-textroll-char { transform: translateY(105%); }
.sm-panel-item:hover .sm-textroll-bottom .sm-textroll-char { transform: translateY(0); }

.sm-scope .nav-link {
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.85);
  transition: color 0.2s ease, letter-spacing 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sm-scope .nav-link:hover {
  color: #FFFFFF !important;
  letter-spacing: 0.15em !important;
}
.sm-scope .nav-link-active {
  color: #C9A84C !important;
  background: rgba(201, 168, 76, 0.1) !important;
  border: 1px solid rgba(201, 168, 76, 0.3) !important;
}

/* ---- Redesigned Auth Buttons ---- */
@keyframes nav-auth-btn-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sm-scope .staggered-menu-header .nav-auth-login {
  animation: nav-auth-btn-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}
.sm-scope .staggered-menu-header .nav-auth-signup {
  animation: nav-auth-btn-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
}

.sm-scope .nav-auth-login {
  background: transparent;
  border: 1px solid rgba(201,168,76,0.6);
  color: #C9A84C;
  border-radius: 980px;
  padding: 8px 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sm-scope .nav-auth-login:hover {
  background-color: rgba(201,168,76,0.1);
  border-color: #C9A84C;
  transform: translateY(-1px) scale(1.02);
}
.sm-scope .nav-auth-login:active {
  transform: translateY(0) scale(0.98);
}

.sm-scope .nav-auth-signup {
  background: #C9A84C;
  border: none;
  color: #000000;
  border-radius: 980px;
  padding: 8px 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sm-scope .nav-auth-signup:hover {
  background-color: #b8852a;
  box-shadow: 0 6px 20px rgba(201,168,76,0.45);
  transform: translateY(-1px) scale(1.02);
}
.sm-scope .nav-auth-signup:active {
  transform: translateY(0) scale(0.98);
}
}
      `}} />
    </div>
  );
};

export default StaggeredMenu;
