"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    async function checkAdmin() {
      try {
        const q = query(collection(db, "admins"), where("phone", "==", user?.phoneNumber));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setIsAdmin(true);
        } else {
          toast.error("Access denied. Admins only.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Access denied.");
        router.push("/");
      }
    }

    checkAdmin();
  }, [user, authLoading, router]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}
