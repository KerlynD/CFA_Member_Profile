import React from "react";

export default function Layout() {
  const handleLogin = () => {
    window.location.href = "http://localhost:8080/api/auth/google/login";
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Sign in to CFA Member Profile</h1>
      <button
        onClick={handleLogin}
        className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100"
      >
        <img src="/google.svg" alt="Google" className="w-6 h-6" />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
}
