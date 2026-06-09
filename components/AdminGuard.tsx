"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

    function checkAdmin() {
      const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
      if (adminUid && user?.uid === adminUid) {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admins only.");
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
