"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Store the JWT token in localStorage
      // This will be sent in the Authorization header for API requests
      setToken(token);

      // Redirect to dashboard after setting the token
      console.log("✅ Token stored successfully, redirecting to dashboard");
      router.push("/dashboard");
    } else {
      // If no token, redirect to login
      console.error("No token found in callback URL");
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="wave-animation"></div>
        <div className="wave-animation wave-delay-1"></div>
        <div className="wave-animation wave-delay-2"></div>
      </div>
      
      <div className="relative text-gray-700 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}

