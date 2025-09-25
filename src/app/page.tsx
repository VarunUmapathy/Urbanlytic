"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase/provider";
import { PhoneLayout } from "@/components/phone-layout";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/alerts");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <PhoneLayout showBottomNav={false}>
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </PhoneLayout>
  );
}
