"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WelcomeContextType {
  hasEntered: boolean;
  triggerEntered: () => void;
}

const WelcomeContext = createContext<WelcomeContextType>({
  hasEntered: false,
  triggerEntered: () => {},
});

export function WelcomeProvider({ children }: { children: ReactNode }) {
  const [hasEntered, setHasEntered] = useState(false);

  const triggerEntered = useCallback(() => {
    // Small delay to let the fade-out complete before animations start
    setTimeout(() => setHasEntered(true), 750);
  }, []);

  return (
    <WelcomeContext.Provider value={{ hasEntered, triggerEntered }}>
      {children}
    </WelcomeContext.Provider>
  );
}

export function useWelcome() {
  return useContext(WelcomeContext);
}
