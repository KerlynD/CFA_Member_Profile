"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface User {
  id: number;
  name: string;
  email: string;
  picture: string;
  headline: string | null;
  location: string | null;
  school: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  
  // Form state for General section
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    preferredName: "",
    headline: "",
    location: "",
    school: "",
  });

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/me", {
        credentials: "include",
      });

      if (res.status === 401) {
        console.log("Unauthorized - redirecting to login");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch user:", res.status, errorData);
        setError(`Failed to load user data: ${errorData.error || res.statusText}`);
        return;
      }

      const data = await res.json();
      console.log("User data loaded:", data);
      setUser(data);
      
      // Parse name into first/last
      const nameParts = data.name?.split(" ") || ["", ""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setFormData({
        firstName,
        lastName,
        preferredName: "",
        headline: data.headline || "",
        location: data.location || "",
        school: data.school || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      setError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const displayName = formData.preferredName 
        ? `${formData.firstName} (${formData.preferredName}) ${formData.lastName}`.trim()
        : fullName;
      
      const res = await fetch("http://localhost:8080/api/users/me", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: displayName,
          headline: formData.headline,
          location: formData.location,
          school: formData.school,
        }),
      });

      if (res.ok) {
        // Refresh user data
        await fetchUser();
        alert("Profile updated successfully!");
      } else {
        const error = await res.json();
        alert(`Failed to update profile: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-600 text-lg font-semibold">Failed to load user data</div>
        <div className="text-gray-600 text-sm max-w-md text-center">{error}</div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchUser();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">No user data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPhotoUrlInput(!showPhotoUrlInput)}
              className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-lg transition"
              title="Change photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {user.name || "No name set"}
            </h1>
            <p className="text-gray-600 mb-2">
              {user.headline || "No headline set"}
            </p>
            
            {showPhotoUrlInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Your photo is synced from your Google account. To change it, update your Google profile picture or paste a URL below:
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!photoUrl) return;
                      // TODO: Implement update photo URL endpoint
                      alert("Photo URL update coming soon! For now, your Google photo will be used.");
                      setShowPhotoUrlInput(false);
                      setPhotoUrl("");
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setShowPhotoUrlInput(false);
                      setPhotoUrl("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "general"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              General
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">General</h2>
              
              <div className="space-y-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Kerlyn"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Difo"
                  />
                </div>

                {/* Preferred Name */}
                <div>
                  <label htmlFor="preferredName" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Name
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    If you go by a different name, let us know here.
                  </p>
                  <input
                    type="text"
                    id="preferredName"
                    value={formData.preferredName}
                    onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Angel"
                  />
                  {(formData.firstName || formData.lastName) && (
                    <p className="text-sm text-gray-500 mt-2">
                      Your full name will appear as &quot;{formData.firstName} {formData.preferredName && `(${formData.preferredName}) `}{formData.lastName}&quot;.
                    </p>
                  )}
                </div>

                {/* Headline */}
                <div>
                  <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                    Headline <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    A LinkedIn-style headline.
                  </p>
                  <input
                    type="text"
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Past SWE @ Capital One | Queens College '27"
                  />
                </div>

                {/* Current Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    We&apos;ll use this to connect you to ColorStack members and events in your area.
                  </p>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Jamaica, Queens, NY, USA"
                  />
                </div>

                {/* Phone Number (optional for now) */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Enter your 10-digit phone number. We&apos;ll use this to send you important Code for All updates.
                  </p>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="(516) 462-5419"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.firstName || !formData.lastName || !formData.headline || !formData.location}
                  className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
