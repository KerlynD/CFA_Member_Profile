"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    
    console.log("🔍 Auth callback - URL:", window.location.href);
    console.log("🔍 Auth callback - Token present:", !!token);
    console.log("🔍 Auth callback - Token length:", token?.length || 0);

    if (token) {
      // Store the JWT token in localStorage
      // This will be sent in the Authorization header for API requests
      setToken(token);
      
      // Verify it was stored
      console.log("✅ Token stored in localStorage");
      console.log("🔍 Verification - Token in localStorage:", localStorage.getItem("session_token") ? "Yes" : "No");

      // Redirect to dashboard after setting the token
      console.log("🔄 Redirecting to dashboard...");
      router.push("/dashboard");
    } else {
      // If no token, redirect to login
      console.error("❌ No token found in callback URL");
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="relative text-gray-700 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

