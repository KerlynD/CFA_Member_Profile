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

interface WorkHistory {
  id: number;
  user_id: number;
  company: string;
  company_logo_url: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  created_at: string;
}

interface EducationHistory {
  id: number;
  user_id: number;
  school_name: string;
  school_logo_url: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  created_at: string;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Work History state
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [loadingWorkHistory, setLoadingWorkHistory] = useState(false);
  const [showAddWorkForm, setShowAddWorkForm] = useState(false);
  const [showEditWorkForm, setShowEditWorkForm] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<number | null>(null);
  const [savingWork, setSavingWork] = useState(false);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [workFormData, setWorkFormData] = useState({
    company: "",
    title: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    location: "",
    description: "",
  });

  // Education History state
  const [educationHistory, setEducationHistory] = useState<EducationHistory[]>([]);
  const [loadingEducationHistory, setLoadingEducationHistory] = useState(false);
  const [showAddEducationForm, setShowAddEducationForm] = useState(false);
  const [showEditEducationForm, setShowEditEducationForm] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [savingEducation, setSavingEducation] = useState(false);
  const [currentlyStudying, setCurrentlyStudying] = useState(false);
  const [educationFormData, setEducationFormData] = useState({
    schoolName: "",
    degree: "",
    fieldOfStudy: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    location: "",
    description: "",
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  
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

  useEffect(() => {
    if (activeTab === "workHistory") {
      fetchWorkHistory();
    } else if (activeTab === "educationHistory") {
      fetchEducationHistory();
    }
  }, [activeTab]);

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

  const sortWorkHistory = (history: WorkHistory[]) => {
    return [...history].sort((a, b) => {
      // Parse dates - treat "Present" as current date
      const parseDate = (dateStr: string) => {
        if (!dateStr || dateStr.toLowerCase() === "present") {
          return new Date();
        }
        // Parse "Month Year" format (e.g., "June 2025")
        const [month, year] = dateStr.split(" ");
        const monthIndex = months.findIndex(m => m.toLowerCase() === month?.toLowerCase());
        return new Date(parseInt(year) || 0, monthIndex !== -1 ? monthIndex : 0);
      };

      const aEnd = parseDate(a.end_date);
      const bEnd = parseDate(b.end_date);
      
      // Sort by end date descending (most recent first)
      if (bEnd.getTime() !== aEnd.getTime()) {
        return bEnd.getTime() - aEnd.getTime();
      }
      
      // If end dates are equal, sort by start date descending
      const aStart = parseDate(a.start_date);
      const bStart = parseDate(b.start_date);
      return bStart.getTime() - aStart.getTime();
    });
  };

  const fetchWorkHistory = async () => {
    setLoadingWorkHistory(true);
    try {
      const res = await fetch("http://localhost:8080/api/work_history", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setWorkHistory(sortWorkHistory(data || []));
      } else {
        console.error("Failed to fetch work history");
      }
    } catch (error) {
      console.error("Error fetching work history:", error);
    } finally {
      setLoadingWorkHistory(false);
    }
  };

  const handleEditWork = (work: WorkHistory) => {
    // Parse the date back into month/year
    const [startMonth, startYear] = work.start_date.split(" ");
    const isCurrentlyWorking = work.end_date.toLowerCase() === "present";
    const [endMonth, endYear] = isCurrentlyWorking ? ["", ""] : work.end_date.split(" ");

    setWorkFormData({
      company: work.company,
      title: work.title,
      startMonth: startMonth || "",
      startYear: startYear || "",
      endMonth: endMonth || "",
      endYear: endYear || "",
      location: work.location,
      description: work.description,
    });
    setCurrentlyWorking(isCurrentlyWorking);
    setEditingWorkId(work.id);
    setShowEditWorkForm(true);
  };

  const handleDeleteWork = async (id: number) => {
    if (!confirm("Are you sure you want to delete this work experience?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/work_history/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchWorkHistory();
        setSuccessMessage("Work experience deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to delete work experience"}`);
      }
    } catch (error) {
      console.error("Error deleting work experience:", error);
      alert("Failed to delete work experience");
    }
  };

  const handleAddWork = async () => {
    setSavingWork(true);
    try {
      const startDate = `${workFormData.startMonth} ${workFormData.startYear}`;
      const endDate = currentlyWorking 
        ? "Present" 
        : `${workFormData.endMonth} ${workFormData.endYear}`;

      const res = await fetch("http://localhost:8080/api/work_history", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: workFormData.company,
          title: workFormData.title,
          start_date: startDate,
          end_date: endDate,
          location: workFormData.location,
          description: workFormData.description,
        }),
      });

      if (res.ok) {
        // Reset form and close modal
        setWorkFormData({
          company: "",
          title: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          location: "",
          description: "",
        });
        setCurrentlyWorking(false);
        setShowAddWorkForm(false);
        // Refresh work history
        await fetchWorkHistory();
        setSuccessMessage("Work experience added successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to add work experience"}`);
      }
    } catch (error) {
      console.error("Error adding work experience:", error);
      alert("Failed to add work experience");
    } finally {
      setSavingWork(false);
    }
  };

  const handleUpdateWork = async () => {
    if (!editingWorkId) return;
    
    setSavingWork(true);
    try {
      const startDate = `${workFormData.startMonth} ${workFormData.startYear}`;
      const endDate = currentlyWorking 
        ? "Present" 
        : `${workFormData.endMonth} ${workFormData.endYear}`;

      const res = await fetch(`http://localhost:8080/api/work_history/${editingWorkId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: workFormData.company,
          title: workFormData.title,
          start_date: startDate,
          end_date: endDate,
          location: workFormData.location,
          description: workFormData.description,
        }),
      });

      if (res.ok) {
        // Reset form and close modal
        setWorkFormData({
          company: "",
          title: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          location: "",
          description: "",
        });
        setCurrentlyWorking(false);
        setShowEditWorkForm(false);
        setEditingWorkId(null);
        // Refresh work history
        await fetchWorkHistory();
        setSuccessMessage("Work experience updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to update work experience"}`);
      }
    } catch (error) {
      console.error("Error updating work experience:", error);
      alert("Failed to update work experience");
    } finally {
      setSavingWork(false);
    }
  };

  // Education History Functions
  const sortEducationHistory = (history: EducationHistory[]) => {
    return [...history].sort((a, b) => {
      const parseDate = (dateStr: string) => {
        if (!dateStr || dateStr.toLowerCase() === "present") {
          return new Date();
        }
        const [month, year] = dateStr.split(" ");
        const monthIndex = months.findIndex(m => m.toLowerCase() === month?.toLowerCase());
        return new Date(parseInt(year) || 0, monthIndex !== -1 ? monthIndex : 0);
      };

      const aEnd = parseDate(a.end_date);
      const bEnd = parseDate(b.end_date);
      
      if (bEnd.getTime() !== aEnd.getTime()) {
        return bEnd.getTime() - aEnd.getTime();
      }
      
      const aStart = parseDate(a.start_date);
      const bStart = parseDate(b.start_date);
      return bStart.getTime() - aStart.getTime();
    });
  };

  const fetchEducationHistory = async () => {
    setLoadingEducationHistory(true);
    try {
      const res = await fetch("http://localhost:8080/api/education_history", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setEducationHistory(sortEducationHistory(data || []));
      } else {
        console.error("Failed to fetch education history");
      }
    } catch (error) {
      console.error("Error fetching education history:", error);
    } finally {
      setLoadingEducationHistory(false);
    }
  };

  const handleEditEducation = (education: EducationHistory) => {
    const [startMonth, startYear] = education.start_date.split(" ");
    const isCurrentlyStudying = education.end_date.toLowerCase() === "present";
    const [endMonth, endYear] = isCurrentlyStudying ? ["", ""] : education.end_date.split(" ");

    setEducationFormData({
      schoolName: education.school_name,
      degree: education.degree,
      fieldOfStudy: education.field_of_study,
      startMonth: startMonth || "",
      startYear: startYear || "",
      endMonth: endMonth || "",
      endYear: endYear || "",
      location: education.location,
      description: education.description,
    });
    setCurrentlyStudying(isCurrentlyStudying);
    setEditingEducationId(education.id);
    setShowEditEducationForm(true);
  };

  const handleDeleteEducation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this education entry?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/education_history/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchEducationHistory();
        setSuccessMessage("Education deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to delete education"}`);
      }
    } catch (error) {
      console.error("Error deleting education:", error);
      alert("Failed to delete education");
    }
  };

  const handleAddEducation = async () => {
    setSavingEducation(true);
    try {
      const startDate = `${educationFormData.startMonth} ${educationFormData.startYear}`;
      const endDate = currentlyStudying 
        ? "Present" 
        : `${educationFormData.endMonth} ${educationFormData.endYear}`;

      const res = await fetch("http://localhost:8080/api/education_history", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_name: educationFormData.schoolName,
          degree: educationFormData.degree,
          field_of_study: educationFormData.fieldOfStudy,
          start_date: startDate,
          end_date: endDate,
          location: educationFormData.location,
          description: educationFormData.description,
        }),
      });

      if (res.ok) {
        setEducationFormData({
          schoolName: "",
          degree: "",
          fieldOfStudy: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          location: "",
          description: "",
        });
        setCurrentlyStudying(false);
        setShowAddEducationForm(false);
        await fetchEducationHistory();
        setSuccessMessage("Education added successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to add education"}`);
      }
    } catch (error) {
      console.error("Error adding education:", error);
      alert("Failed to add education");
    } finally {
      setSavingEducation(false);
    }
  };

  const handleUpdateEducation = async () => {
    if (!editingEducationId) return;
    
    setSavingEducation(true);
    try {
      const startDate = `${educationFormData.startMonth} ${educationFormData.startYear}`;
      const endDate = currentlyStudying 
        ? "Present" 
        : `${educationFormData.endMonth} ${educationFormData.endYear}`;

      const res = await fetch(`http://localhost:8080/api/education_history/${editingEducationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_name: educationFormData.schoolName,
          degree: educationFormData.degree,
          field_of_study: educationFormData.fieldOfStudy,
          start_date: startDate,
          end_date: endDate,
          location: educationFormData.location,
          description: educationFormData.description,
        }),
      });

      if (res.ok) {
        setEducationFormData({
          schoolName: "",
          degree: "",
          fieldOfStudy: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          location: "",
          description: "",
        });
        setCurrentlyStudying(false);
        setShowEditEducationForm(false);
        setEditingEducationId(null);
        await fetchEducationHistory();
        setSuccessMessage("Education updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to update education"}`);
      }
    } catch (error) {
      console.error("Error updating education:", error);
      alert("Failed to update education");
    } finally {
      setSavingEducation(false);
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
        setSuccessMessage("Profile updated successfully!");
        // Auto-hide after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        setSuccessMessage(`Error: ${error.error || "Unknown error"}`);
        setTimeout(() => setSuccessMessage(null), 5000);
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
            <button
              onClick={() => setActiveTab("workHistory")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "workHistory"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Work History
            </button>
            <button
              onClick={() => setActiveTab("educationHistory")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "educationHistory"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Education History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "general" && (
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
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${
                  successMessage.startsWith("Error") 
                    ? "bg-red-50 text-red-800 border border-red-200" 
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {!successMessage.startsWith("Error") && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {successMessage.startsWith("Error") && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

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
          )}

          {activeTab === "workHistory" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Work History</h2>
                <button
                  onClick={() => setShowAddWorkForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Experience
                </button>
              </div>

              {/* Add Work Form Modal */}
              {showAddWorkForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Add Work Experience</h3>
                      <button
                        onClick={() => {
                          setShowAddWorkForm(false);
                          setCurrentlyWorking(false);
                          setWorkFormData({
                            company: "",
                            title: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* Company */}
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="company"
                          value={workFormData.company}
                          onChange={(e) => setWorkFormData({ ...workFormData, company: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Capital One"
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="jobTitle"
                          value={workFormData.title}
                          onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Software Engineer Intern"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={workFormData.startMonth}
                            onChange={(e) => setWorkFormData({ ...workFormData, startMonth: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Month</option>
                            {months.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            value={workFormData.startYear}
                            onChange={(e) => setWorkFormData({ ...workFormData, startYear: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Currently Working Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="currentlyWorking"
                          checked={currentlyWorking}
                          onChange={(e) => setCurrentlyWorking(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="currentlyWorking" className="text-sm font-medium text-gray-700">
                          I currently work here
                        </label>
                      </div>

                      {/* End Date */}
                      {!currentlyWorking && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={workFormData.endMonth}
                              onChange={(e) => setWorkFormData({ ...workFormData, endMonth: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Month</option>
                              {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={workFormData.endYear}
                              onChange={(e) => setWorkFormData({ ...workFormData, endYear: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Year</option>
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      <div>
                        <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="workLocation"
                          value={workFormData.location}
                          onChange={(e) => setWorkFormData({ ...workFormData, location: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="New York, NY • Hybrid"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                          Add bullet points about your responsibilities and achievements. Start each line with &quot;•&quot; for bullet points.
                        </p>
                        <textarea
                          id="description"
                          value={workFormData.description}
                          onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                          placeholder="• Built a Java Spring Boot microservice&#10;• Created a Snowflake SQL pipeline&#10;• Designed REST APIs in Python"
                        />
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowAddWorkForm(false);
                          setCurrentlyWorking(false);
                          setWorkFormData({
                            company: "",
                            title: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddWork}
                        disabled={savingWork || !workFormData.company || !workFormData.title || !workFormData.startMonth || !workFormData.startYear || (!currentlyWorking && (!workFormData.endMonth || !workFormData.endYear))}
                        className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingWork ? "Adding..." : "Add Experience"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Work Form Modal */}
              {showEditWorkForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Edit Work Experience</h3>
                      <button
                        onClick={() => {
                          setShowEditWorkForm(false);
                          setEditingWorkId(null);
                          setCurrentlyWorking(false);
                          setWorkFormData({
                            company: "",
                            title: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* Company */}
                      <div>
                        <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700 mb-2">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-company"
                          value={workFormData.company}
                          onChange={(e) => setWorkFormData({ ...workFormData, company: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Capital One"
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label htmlFor="edit-jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-jobTitle"
                          value={workFormData.title}
                          onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Software Engineer Intern"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={workFormData.startMonth}
                            onChange={(e) => setWorkFormData({ ...workFormData, startMonth: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Month</option>
                            {months.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            value={workFormData.startYear}
                            onChange={(e) => setWorkFormData({ ...workFormData, startYear: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Currently Working Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-currentlyWorking"
                          checked={currentlyWorking}
                          onChange={(e) => setCurrentlyWorking(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-currentlyWorking" className="text-sm font-medium text-gray-700">
                          I currently work here
                        </label>
                      </div>

                      {/* End Date */}
                      {!currentlyWorking && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={workFormData.endMonth}
                              onChange={(e) => setWorkFormData({ ...workFormData, endMonth: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Month</option>
                              {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={workFormData.endYear}
                              onChange={(e) => setWorkFormData({ ...workFormData, endYear: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Year</option>
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      <div>
                        <label htmlFor="edit-workLocation" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="edit-workLocation"
                          value={workFormData.location}
                          onChange={(e) => setWorkFormData({ ...workFormData, location: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="New York, NY • Hybrid"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                          Add bullet points about your responsibilities and achievements. Start each line with &quot;•&quot; for bullet points.
                        </p>
                        <textarea
                          id="edit-description"
                          value={workFormData.description}
                          onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                          placeholder="• Built a Java Spring Boot microservice&#10;• Created a Snowflake SQL pipeline&#10;• Designed REST APIs in Python"
                        />
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowEditWorkForm(false);
                          setEditingWorkId(null);
                          setCurrentlyWorking(false);
                          setWorkFormData({
                            company: "",
                            title: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateWork}
                        disabled={savingWork || !workFormData.company || !workFormData.title || !workFormData.startMonth || !workFormData.startYear || (!currentlyWorking && (!workFormData.endMonth || !workFormData.endYear))}
                        className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingWork ? "Updating..." : "Update Experience"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingWorkHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Loading work history...</div>
                </div>
              ) : workHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No work history yet</h3>
                  <p className="text-gray-600 mb-4">
                    Click &quot;Add Experience&quot; to start building your professional profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workHistory.map((work) => (
                    <div
                      key={work.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          <Image
                            src={work.company_logo_url}
                            alt={work.company}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Hide broken image and show fallback icon
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallbackIcon = document.createElement('div');
                                fallbackIcon.className = 'fallback-icon w-full h-full flex items-center justify-center text-gray-400';
                                fallbackIcon.innerHTML = `
                                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
                                  </svg>
                                `;
                                parent.appendChild(fallbackIcon);
                              }
                            }}
                          />
                        </div>

                        {/* Work Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{work.title}</h3>
                          <p className="text-gray-700 font-medium">{work.company}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {work.start_date && work.end_date && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {work.start_date} - {work.end_date}
                              </span>
                            )}
                            {work.location && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {work.location}
                              </span>
                            )}
                          </div>
                          {work.description && (
                            <div className="mt-3 text-gray-700 text-sm leading-relaxed">
                              {work.description.split('\n').map((line, idx) => (
                                <p key={idx} className="mb-1">{line}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleEditWork(work)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteWork(work.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "educationHistory" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Education History</h2>
                <button
                  onClick={() => setShowAddEducationForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Education
                </button>
              </div>

              {/* Add Education Form Modal */}
              {showAddEducationForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Add Education</h3>
                      <button
                        onClick={() => {
                          setShowAddEducationForm(false);
                          setCurrentlyStudying(false);
                          setEducationFormData({
                            schoolName: "",
                            degree: "",
                            fieldOfStudy: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* School Name */}
                      <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                          School Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="schoolName"
                          value={educationFormData.schoolName}
                          onChange={(e) => setEducationFormData({ ...educationFormData, schoolName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Queens College"
                        />
                      </div>

                      {/* Degree */}
                      <div>
                        <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="degree"
                          value={educationFormData.degree}
                          onChange={(e) => setEducationFormData({ ...educationFormData, degree: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Bachelor of Science"
                        />
                      </div>

                      {/* Field of Study */}
                      <div>
                        <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          id="fieldOfStudy"
                          value={educationFormData.fieldOfStudy}
                          onChange={(e) => setEducationFormData({ ...educationFormData, fieldOfStudy: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Computer Science"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={educationFormData.startMonth}
                            onChange={(e) => setEducationFormData({ ...educationFormData, startMonth: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Month</option>
                            {months.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            value={educationFormData.startYear}
                            onChange={(e) => setEducationFormData({ ...educationFormData, startYear: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Currently Studying Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="currentlyStudying"
                          checked={currentlyStudying}
                          onChange={(e) => setCurrentlyStudying(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="currentlyStudying" className="text-sm font-medium text-gray-700">
                          I currently study here
                        </label>
                      </div>

                      {/* End Date */}
                      {!currentlyStudying && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={educationFormData.endMonth}
                              onChange={(e) => setEducationFormData({ ...educationFormData, endMonth: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Month</option>
                              {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={educationFormData.endYear}
                              onChange={(e) => setEducationFormData({ ...educationFormData, endYear: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Year</option>
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      <div>
                        <label htmlFor="eduLocation" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="eduLocation"
                          value={educationFormData.location}
                          onChange={(e) => setEducationFormData({ ...educationFormData, location: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Queens, NY"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="eduDescription" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                          Activities, honors, and coursework.
                        </p>
                        <textarea
                          id="eduDescription"
                          value={educationFormData.description}
                          onChange={(e) => setEducationFormData({ ...educationFormData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                          placeholder="Dean's List, Computer Science Club President"
                        />
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowAddEducationForm(false);
                          setCurrentlyStudying(false);
                          setEducationFormData({
                            schoolName: "",
                            degree: "",
                            fieldOfStudy: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddEducation}
                        disabled={savingEducation || !educationFormData.schoolName || !educationFormData.degree || !educationFormData.startMonth || !educationFormData.startYear || (!currentlyStudying && (!educationFormData.endMonth || !educationFormData.endYear))}
                        className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingEducation ? "Adding..." : "Add Education"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Education Form Modal */}
              {showEditEducationForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Edit Education</h3>
                      <button
                        onClick={() => {
                          setShowEditEducationForm(false);
                          setEditingEducationId(null);
                          setCurrentlyStudying(false);
                          setEducationFormData({
                            schoolName: "",
                            degree: "",
                            fieldOfStudy: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* School Name */}
                      <div>
                        <label htmlFor="edit-schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                          School Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-schoolName"
                          value={educationFormData.schoolName}
                          onChange={(e) => setEducationFormData({ ...educationFormData, schoolName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Queens College"
                        />
                      </div>

                      {/* Degree */}
                      <div>
                        <label htmlFor="edit-degree" className="block text-sm font-medium text-gray-700 mb-2">
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-degree"
                          value={educationFormData.degree}
                          onChange={(e) => setEducationFormData({ ...educationFormData, degree: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Bachelor of Science"
                        />
                      </div>

                      {/* Field of Study */}
                      <div>
                        <label htmlFor="edit-fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          id="edit-fieldOfStudy"
                          value={educationFormData.fieldOfStudy}
                          onChange={(e) => setEducationFormData({ ...educationFormData, fieldOfStudy: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Computer Science"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={educationFormData.startMonth}
                            onChange={(e) => setEducationFormData({ ...educationFormData, startMonth: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Month</option>
                            {months.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            value={educationFormData.startYear}
                            onChange={(e) => setEducationFormData({ ...educationFormData, startYear: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          >
                            <option value="">Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Currently Studying Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-currentlyStudying"
                          checked={currentlyStudying}
                          onChange={(e) => setCurrentlyStudying(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="edit-currentlyStudying" className="text-sm font-medium text-gray-700">
                          I currently study here
                        </label>
                      </div>

                      {/* End Date */}
                      {!currentlyStudying && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={educationFormData.endMonth}
                              onChange={(e) => setEducationFormData({ ...educationFormData, endMonth: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Month</option>
                              {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                            <select
                              value={educationFormData.endYear}
                              onChange={(e) => setEducationFormData({ ...educationFormData, endYear: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            >
                              <option value="">Year</option>
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      <div>
                        <label htmlFor="edit-eduLocation" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="edit-eduLocation"
                          value={educationFormData.location}
                          onChange={(e) => setEducationFormData({ ...educationFormData, location: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          placeholder="Queens, NY"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="edit-eduDescription" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                          Activities, honors, and coursework.
                        </p>
                        <textarea
                          id="edit-eduDescription"
                          value={educationFormData.description}
                          onChange={(e) => setEducationFormData({ ...educationFormData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                          placeholder="Dean's List, Computer Science Club President"
                        />
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowEditEducationForm(false);
                          setEditingEducationId(null);
                          setCurrentlyStudying(false);
                          setEducationFormData({
                            schoolName: "",
                            degree: "",
                            fieldOfStudy: "",
                            startMonth: "",
                            startYear: "",
                            endMonth: "",
                            endYear: "",
                            location: "",
                            description: "",
                          });
                        }}
                        className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateEducation}
                        disabled={savingEducation || !educationFormData.schoolName || !educationFormData.degree || !educationFormData.startMonth || !educationFormData.startYear || (!currentlyStudying && (!educationFormData.endMonth || !educationFormData.endYear))}
                        className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingEducation ? "Updating..." : "Update Education"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingEducationHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Loading education history...</div>
                </div>
              ) : educationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No education history yet</h3>
                  <p className="text-gray-600 mb-4">
                    Click &quot;Add Education&quot; to start building your education profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {educationHistory.map((education) => (
                    <div
                      key={education.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* School Logo */}
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          <Image
                            src={education.school_logo_url}
                            alt={education.school_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallbackIcon = document.createElement('div');
                                fallbackIcon.className = 'fallback-icon w-full h-full flex items-center justify-center text-gray-400';
                                fallbackIcon.innerHTML = `
                                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                  </svg>
                                `;
                                parent.appendChild(fallbackIcon);
                              }
                            }}
                          />
                        </div>

                        {/* Education Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{education.school_name}</h3>
                          <p className="text-gray-700 font-medium">
                            {education.degree}{education.field_of_study && `, ${education.field_of_study}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {education.start_date && education.end_date && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {education.start_date} - {education.end_date}
                              </span>
                            )}
                            {education.location && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {education.location}
                              </span>
                            )}
                          </div>
                          {education.description && (
                            <div className="mt-3 text-gray-700 text-sm leading-relaxed">
                              {education.description.split('\n').map((line, idx) => (
                                <p key={idx} className="mb-1">{line}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleEditEducation(education)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEducation(education.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
