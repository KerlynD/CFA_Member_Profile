"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    // Small delay to show the animation before redirect
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`;
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-slow relative overflow-hidden">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 via-indigo-100/30 to-purple-100/30 animate-gradient-x"></div>
      
      {/* Authentication overlay animation */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
          {/* Wavy animation background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="wave-animation"></div>
            <div className="wave-animation wave-delay-1"></div>
            <div className="wave-animation wave-delay-2"></div>
          </div>
          
          <div className="relative text-gray-700 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Signing you in...</p>
          </div>
        </div>
      )}
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-10 max-w-sm w-full">
        <div className="flex flex-col items-center">
          <img
            src="/assets/codeforall.svg"
            alt="Code for All Logo"
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to Code for All
          </h1>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Sign in with your Google account to access your member profile.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 font-medium shadow-sm hover:shadow-md transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.15 0 5.4 1.37 6.64 2.52l4.86-4.86C32.57 4.58 28.67 3 24 3 14.9 3 7.14 8.92 4.22 17.02l5.92 4.6C11.77 15.23 17.37 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.14 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.5c-.54 2.82-2.14 5.22-4.5 6.84l6.92 5.38C42.6 37.04 46.14 31.22 46.14 24.5z"
              />
              <path
                fill="#4A90E2"
                d="M24 46c6.24 0 11.47-2.06 15.29-5.6l-6.92-5.38C30.04 36.84 27.2 38 24 38c-6.63 0-12.23-5.73-13.86-13.12l-5.92 4.6C7.14 39.08 14.9 46 24 46z"
              />
            </svg>
            Sign In with Google
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-indigo-500">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-indigo-500">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <footer className="absolute bottom-4 text-gray-400 text-xs">
        © {new Date().getFullYear()} Code for All QC
      </footer>
    </div>
  );
}
