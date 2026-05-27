"use client";

import type React from "react";
import "./ShinyButton.css";

interface ShinyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ShinyButton({ children, onClick, className = "", style }: ShinyButtonProps) {
  return (
    <button className={`shiny-cta ${className}`} onClick={onClick} style={style}>
      <span>{children}</span>
    </button>
  );
}
