"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:8080/api/me", { credentials: "include" })
      .then(res => {
        if (res.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Welcome to your ColorStack-style member profile 🚀</p>
    </div>
  );
}
