"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authInitialMode: "login" | "create";
  setAuthInitialMode: (mode: "login" | "create") => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authInitialMode: "login",
  setAuthInitialMode: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "create">("login");

  useEffect(() => {
    // Safety timeout: If Firebase auth state doesn't resolve in 600ms, fallback to not loading (guest state)
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("Firebase Auth state did not resolve within 600ms. Falling back to guest state.");
          return false;
        }
        return prev;
      });
    }, 600);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription and timeout on unmount
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(Object.create(auth.currentUser) as User);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, showAuthModal, setShowAuthModal, authInitialMode, setAuthInitialMode, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
