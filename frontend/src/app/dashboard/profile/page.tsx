"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { authenticatedFetch } from "@/lib/auth";
import { LocationSelect } from "@/components/location/location-select";

interface User {
  id: number;
  name: string;
  email: string;
  picture: string;
  headline: string | null;
  location: string | null;
  school: string | null;
  resume_url: string | null;
  resume_uploaded_at: string | null;
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

interface DiscordIntegration {
  id: number;
  user_id: number;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar_url: string;
  verified: boolean;
  joined_at: string;
}

interface GithubIntegration {
  id: number;
  user_id: number;
  github_id: string;
  username: string;
  avatar_url: string;
  profile_url: string;
  top_repos: string[];
  joined_at: string;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  private: boolean;
}

interface LinkedInIntegration {
  id: number;
  linkedin_id: string;
  profile_url: string;
  first_name: string;
  last_name: string;
  headline: string;
  avatar_url: string;
  connected_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
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

  // Integrations state
  const [discordIntegration, setDiscordIntegration] = useState<DiscordIntegration | null>(null);
  const [loadingDiscord, setLoadingDiscord] = useState(false);
  const [githubIntegration, setGithubIntegration] = useState<GithubIntegration | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [linkedinIntegration, setLinkedinIntegration] = useState<LinkedInIntegration | null>(null);
  const [loadingLinkedin, setLoadingLinkedin] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [savingRepos, setSavingRepos] = useState(false);
  const [showLinkedInUrlModal, setShowLinkedInUrlModal] = useState(false);
  const [linkedInUrlInput, setLinkedInUrlInput] = useState("");
  const [savingLinkedInUrl, setSavingLinkedInUrl] = useState(false);
  
  // Resume state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

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
    headline: "",
    location: "",
    school: "",
  });

  useEffect(() => {
    fetchUser();
    fetchDiscordIntegration(); // Fetch Discord status on page load for verified badge
    fetchGithubIntegration(); // Fetch GitHub status on page load
    fetchLinkedinIntegration(); // Fetch LinkedIn status on page load
    
    // Check for GitHub OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("github_connected") === "true") {
      setSuccessMessage("GitHub connected successfully! Select your top 3 repositories.");
      setActiveTab("integrations");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/profile?tab=integrations");
      // Load repos and show modal
      handleSelectRepos();
    }
    
    // Check for LinkedIn OAuth callback
    if (urlParams.get("linkedin_connected") === "true") {
      setSuccessMessage("LinkedIn connected successfully!");
      setActiveTab("integrations");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/profile?tab=integrations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "workHistory") {
      fetchWorkHistory();
    } else if (activeTab === "educationHistory") {
      fetchEducationHistory();
    } else if (activeTab === "integrations") {
      // Refresh integrations when tab is opened
      fetchDiscordIntegration();
      fetchGithubIntegration();
      fetchLinkedinIntegration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUser = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`);

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
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work_history`);

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
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work_history/${id}`, {
        method: "DELETE",
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

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work_history`, {
        method: "POST",
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

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work_history/${editingWorkId}`, {
        method: "PUT",
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
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education_history`);

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
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education_history/${id}`, {
        method: "DELETE",
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

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education_history`, {
        method: "POST",
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

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education_history/${editingEducationId}`, {
        method: "PUT",
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

  // Discord Integration Functions
  const fetchDiscordIntegration = async () => {
    setLoadingDiscord(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/discord`, {
      });

      if (res.ok) {
        const data = await res.json();
        setDiscordIntegration(data);
      } else {
        // Not linked yet - this is fine
        setDiscordIntegration(null);
      }
    } catch (error) {
      console.error("Error fetching Discord integration:", error);
    } finally {
      setLoadingDiscord(false);
    }
  };

  const handleConnectDiscord = async () => {
    // Call the Discord login endpoint with authentication
    // The backend will redirect to Discord OAuth with user ID in state
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/discord/login`);
      
      if (response.ok) {
        // Backend returns redirect URL, navigate to it
        const data = await response.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        }
      } else {
        alert("Failed to initiate Discord connection. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting Discord:", error);
      alert("Failed to connect Discord");
    }
  };

  const handleVerifyDiscord = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/discord/verify`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh Discord integration to show updated status
        await fetchDiscordIntegration();
        
        if (data.verified) {
          setSuccessMessage("Verified! You are a member of the server.");
        } else {
          setSuccessMessage("Not verified. Please join the Discord server and try again.");
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Verification failed"}`);
      }
    } catch (error) {
      console.error("Error verifying Discord:", error);
      alert("Failed to verify Discord membership");
    }
  };

  // GitHub Integration Functions
  const fetchGithubIntegration = async () => {
    setLoadingGithub(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/github`, {
      });

      if (res.ok) {
        const data = await res.json();
        setGithubIntegration(data);
        setSelectedRepos(data.top_repos || []);
      } else {
        // Not linked yet - this is fine
        setGithubIntegration(null);
        setSelectedRepos([]);
      }
    } catch (error) {
      console.error("Error fetching GitHub integration:", error);
    } finally {
      setLoadingGithub(false);
    }
  };

  const handleConnectGithub = async () => {
    // Call the GitHub login endpoint with authentication
    // The backend will redirect to GitHub OAuth with user ID in state
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github/login`);
      
      if (response.ok) {
        // Backend returns redirect URL, navigate to it
        const data = await response.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        }
      } else {
        alert("Failed to initiate GitHub connection. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      alert("Failed to connect GitHub");
    }
  };

  // LinkedIn Integration Functions
  const fetchLinkedinIntegration = async () => {
    setLoadingLinkedin(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/linkedin`, {
      });

      if (res.ok) {
        const data = await res.json();
        setLinkedinIntegration(data);
      } else {
        // Not linked yet - this is fine
        setLinkedinIntegration(null);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn integration:", error);
    } finally {
      setLoadingLinkedin(false);
    }
  };

  const handleConnectLinkedin = async () => {
    // Call the LinkedIn login endpoint with authentication
    // The backend will redirect to LinkedIn OAuth with user ID in state
    try {
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/linkedin/connect`);
      
      if (response.ok) {
        // Backend returns redirect URL, navigate to it
        const data = await response.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        }
      } else {
        alert("Failed to initiate LinkedIn connection. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting LinkedIn:", error);
      alert("Failed to connect LinkedIn");
    }
  };

  const handleDisconnectLinkedin = async () => {
    if (!confirm("Are you sure you want to disconnect LinkedIn?")) {
      return;
    }

    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/linkedin`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLinkedinIntegration(null);
        setSuccessMessage("LinkedIn disconnected successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to disconnect LinkedIn"}`);
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      alert("Failed to disconnect LinkedIn");
    }
  };

  const handleUpdateLinkedInUrl = async () => {
    if (!linkedInUrlInput.trim()) {
      alert("Please enter a LinkedIn profile URL");
      return;
    }

    setSavingLinkedInUrl(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/linkedin/url`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile_url: linkedInUrlInput.trim() }),
      });

      if (res.ok) {
        // Refresh LinkedIn integration to show updated URL
        await fetchLinkedinIntegration();
        setShowLinkedInUrlModal(false);
        setLinkedInUrlInput("");
        setSuccessMessage("LinkedIn profile URL updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to update LinkedIn URL"}`);
      }
    } catch (error) {
      console.error("Error updating LinkedIn URL:", error);
      alert("Failed to update LinkedIn URL");
    } finally {
      setSavingLinkedInUrl(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/resume`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Refresh user data to show new resume
        await fetchUser();
        setSuccessMessage("Resume uploaded successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to upload resume"}`);
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Failed to upload resume");
    } finally {
      setUploadingResume(false);
      // Reset the input
      event.target.value = "";
    }
  };

  const handleResumeDelete = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) {
      return;
    }

    setDeletingResume(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/resume`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Refresh user data to remove resume
        await fetchUser();
        setSuccessMessage("Resume deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to delete resume"}`);
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume");
    } finally {
      setDeletingResume(false);
    }
  };

  const handleSelectRepos = async () => {
    // Fetch user's repositories
    setLoadingRepos(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/github/repos`, {
      });

      if (res.ok) {
        const data = await res.json();
        setGithubRepos(data);
        setShowRepoModal(true);
      } else {
        alert("Failed to fetch repositories");
      }
    } catch (error) {
      console.error("Error fetching repos:", error);
      alert("Failed to fetch repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleToggleRepo = (repoFullName: string) => {
    if (selectedRepos.includes(repoFullName)) {
      // Remove repo
      setSelectedRepos(selectedRepos.filter(r => r !== repoFullName));
    } else {
      // Add repo (max 3)
      if (selectedRepos.length < 3) {
        setSelectedRepos([...selectedRepos, repoFullName]);
      }
    }
  };

  const handleSaveRepos = async () => {
    setSavingRepos(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/github/repos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repos: selectedRepos }),
      });

      if (res.ok) {
        await fetchGithubIntegration();
        setShowRepoModal(false);
        setSuccessMessage("Top repositories saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to save repositories"}`);
      }
    } catch (error) {
      console.error("Error saving repos:", error);
      alert("Failed to save repositories");
    } finally {
      setSavingRepos(false);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Read file and set as selected image for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new window.Image();
    image.src = imageSrc;
    
    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, "image/jpeg", 0.95);
      };
      
      image.onerror = () => reject(new Error("Failed to load image"));
    });
  };

  const handlePhotoUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setUploadingPhoto(true);
    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(selectedImage, croppedAreaPixels);
      
      // Create form data with cropped image
      const formData = new FormData();
      formData.append("file", croppedBlob, "profile-photo.jpg");

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/picture`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Refresh user data to show new picture
        await fetchUser();
        setShowPhotoModal(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setSuccessMessage("Profile picture updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to upload image"}`);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
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
    <>
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-6">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="relative group cursor-pointer"
            title="Click to change profile picture"
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-4 ring-transparent group-hover:ring-indigo-500 transition-all">
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
              {/* Overlay on hover */}
              <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name || "No name set"}
              </h1>
              {discordIntegration?.verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-2">
              {user.headline || "No headline set"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 mb-6">
        <div className="border-b border-white/10">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 relative ${
                activeTab === "general"
                  ? "border-indigo-400 text-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200 hover:bg-gray-50/50"
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
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 relative ${
                activeTab === "workHistory"
                  ? "border-indigo-400 text-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200 hover:bg-gray-50/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Work History
            </button>
            <button
              onClick={() => setActiveTab("educationHistory")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 relative ${
                activeTab === "educationHistory"
                  ? "border-indigo-400 text-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200 hover:bg-gray-50/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Education History
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 relative ${
                activeTab === "integrations"
                  ? "border-indigo-400 text-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200 hover:bg-gray-50/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 relative ${
                activeTab === "resume"
                  ? "border-indigo-400 text-indigo-600 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200 hover:bg-gray-50/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Resume
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
                    placeholder="John"
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
                    placeholder="Doe"
                  />
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
                    placeholder="Software Engineer @ Tech Company | University '25"
                  />
                </div>

                <LocationSelect
                  value={formData.location}
                  onChange={(location) => setFormData({ ...formData, location })}
                  required
                />
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
                  className="px-8 py-3 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                  {saving ? "Saving..." : "Save Changes"}
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
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-indigo-600/90 hover:to-purple-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Experience
                </button>
              </div>



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
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-indigo-600/90 hover:to-purple-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Education
                </button>
              </div>



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

          {activeTab === "integrations" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h2>
              <p className="text-gray-600 mb-8">
                Connect your accounts to unlock additional features and verify your membership.
              </p>

              {/* Success Message */}
              {successMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                  successMessage.startsWith("Error") || successMessage.startsWith("Not verified")
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-200" 
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {successMessage.startsWith("Verified") && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {successMessage.startsWith("Not verified") && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {loadingDiscord ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Loading integrations...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Discord Integration Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative flex flex-col">
                    {/* Connected Badge */}
                    {discordIntegration && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Connected
                        </span>
                      </div>
                    )}

                    {/* Discord Logo */}
                    <div className="w-16 h-16 bg-[#5865F2] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Discord</h3>

                    {/* Description */}
                    <div className="flex-1">
                      {discordIntegration ? (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] hover:underline">
                              discord.com
                            </a>
                          </p>
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {discordIntegration.username}#{discordIntegration.discriminator}
                          </p>
                          {discordIntegration.verified ? (
                            <div className="flex items-center gap-1.5 text-green-700">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">Verified Member</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-yellow-700">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">Not in Server</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mb-4">
                          Connect your Discord account to verify your membership in the Code for All server.
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    {discordIntegration ? (
                      <button
                        onClick={handleVerifyDiscord}
                        className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-xl border border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        Refresh Status
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectDiscord}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-[#5865F2]/90 to-[#4752C4]/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-[#4752C4]/90 hover:to-[#3c45a3]/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* GitHub Integration Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative flex flex-col">
                    {/* Connected Badge */}
                    {githubIntegration && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Connected
                        </span>
                      </div>
                    )}

                    <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">GitHub</h3>

                    <div className="flex-1">
                      {githubIntegration ? (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <a href={githubIntegration.profile_url} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline">
                              @{githubIntegration.username}
                            </a>
                          </p>
                          {githubIntegration.top_repos && githubIntegration.top_repos.length > 0 ? (
                            <div className="text-green-700 flex items-center gap-1.5 mb-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">{githubIntegration.top_repos.length} Top Repo{githubIntegration.top_repos.length !== 1 ? 's' : ''} Selected</span>
                            </div>
                          ) : (
                            <div className="text-yellow-700 flex items-center gap-1.5 mb-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">No Repos Selected</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mb-4">
                          Showcase your top 3 repositories on your profile.
                        </p>
                      )}
                    </div>

                    {githubIntegration ? (
                      <button
                        onClick={handleSelectRepos}
                        disabled={loadingRepos}
                        className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-xl border border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loadingRepos ? "Loading..." : "Update Repositories"}
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGithub}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-gray-700/90 hover:to-gray-600/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* LinkedIn Integration Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative flex flex-col">
                    {/* Connected Badge */}
                    {linkedinIntegration && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Connected
                        </span>
                      </div>
                    )}

                    <div className="w-16 h-16 bg-[#0A66C2] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">LinkedIn</h3>
                    
                    <div className="flex-1">
                      {linkedinIntegration ? (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            {linkedinIntegration.profile_url.includes("profile-not-set") ? (
                              <span className="text-gray-500">
                                {linkedinIntegration.first_name} {linkedinIntegration.last_name}
                              </span>
                            ) : (
                              <a href={linkedinIntegration.profile_url} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline">
                                {linkedinIntegration.first_name} {linkedinIntegration.last_name}
                              </a>
                            )}
                          </p>
                          {linkedinIntegration.headline && (
                            <p className="text-sm text-gray-700 font-medium mb-2">
                              {linkedinIntegration.headline}
                            </p>
                          )}
                          {linkedinIntegration.profile_url.includes("profile-not-set") ? (
                            <div className="text-yellow-700 flex items-center gap-1.5 mb-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">Profile URL Not Set</span>
                            </div>
                          ) : (
                            <div className="text-green-700 flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold">Profile Connected</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mb-4">
                          Connect your LinkedIn profile to display your professional link in the directory.
                        </p>
                      )}
                    </div>

                    {linkedinIntegration ? (
                      <div className="space-y-2">
                        {linkedinIntegration.profile_url.includes("profile-not-set") && (
                          <button
                            onClick={() => {
                              setLinkedInUrlInput("");
                              setShowLinkedInUrlModal(true);
                            }}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0A66C2]/90 to-[#004182]/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-[#004182]/90 hover:to-[#003366]/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Set Profile URL
                          </button>
                        )}
                        <button
                          onClick={handleDisconnectLinkedin}
                          disabled={loadingLinkedin}
                          className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-xl border border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {loadingLinkedin ? "Loading..." : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectLinkedin}
                        disabled={loadingLinkedin}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0A66C2]/90 to-[#004182]/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-[#004182]/90 hover:to-[#003366]/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loadingLinkedin ? "Loading..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "resume" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume</h2>
              <p className="text-gray-600 mb-8">
                Upload your resume to share with potential employers and networking contacts.
              </p>

              {/* Success Message */}
              {successMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                  successMessage.startsWith("Error") 
                    ? "bg-red-50 text-red-800 border border-red-200" 
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {!successMessage.startsWith("Error") && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Resume Card */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all">
                <div className="text-center">
                  {/* Resume Icon */}
                  <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {user?.resume_url ? (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Resume Uploaded</h3>
                      <p className="text-gray-600 mb-6">
                        {user.resume_uploaded_at && (
                          <>Uploaded on {new Date(user.resume_uploaded_at).toLocaleDateString()}</>
                        )}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-green-600/90 hover:to-emerald-600/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            disabled={uploadingResume}
                            className="hidden"
                          />
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {uploadingResume ? "Uploading..." : "Replace Resume"}
                        </label>

                        <button
                          onClick={handleResumeDelete}
                          disabled={deletingResume}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-sm text-red-600 font-semibold rounded-xl border border-red-200/50 hover:bg-red-50/80 hover:border-red-300/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {deletingResume ? "Deleting..." : "Delete Resume"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Resume Uploaded</h3>
                      <p className="text-gray-600 mb-6">
                        Upload your resume to share with employers and make networking easier.
                      </p>
                      
                      <label className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-indigo-600/90 hover:to-purple-600/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleResumeUpload}
                          disabled={uploadingResume}
                          className="hidden"
                        />
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {uploadingResume ? "Uploading..." : "Upload Resume"}
                      </label>
                      
                      <p className="text-sm text-gray-500 mt-4">
                        Only PDF files are accepted. Maximum file size: 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Profile Picture Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Profile Picture</h3>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedImage(null);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
                disabled={uploadingPhoto}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedImage ? (
                // Show current photo and upload button
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden bg-gray-100 mb-4">
                      {user?.picture ? (
                        <Image
                          src={user.picture}
                          alt={user.name || "Profile"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-center mb-4">
                      Upload a new profile picture. You'll be able to crop and adjust it before saving.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="px-8 py-3 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-indigo-600/90 hover:to-purple-600/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                        Choose New Photo
                      </div>
                    </label>
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    Supported formats: JPG, PNG, GIF, WEBP (max 5MB)
                  </p>
                </div>
              ) : (
                // Show cropping interface
                <div className="space-y-4">
                  <p className="text-gray-700 font-medium text-center">
                    Drag to adjust position, use slider to zoom
                  </p>
                  
                  {/* Cropper Container */}
                  <div className="relative w-full h-96 bg-black/20 rounded-lg overflow-hidden">
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="px-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zoom
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                      }}
                      disabled={uploadingPhoto}
                      className="flex-1 px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300 disabled:opacity-50"
                    >
                      Choose Different Photo
                    </button>
                    <button
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="flex-1 px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                    >
                      {uploadingPhoto ? "Uploading..." : "Save Photo"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repository Selection Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Top 3 Repositories</h3>
                <p className="text-sm text-gray-600 mt-1">Choose up to 3 repositories to showcase on your profile</p>
              </div>
              <button
                onClick={() => setShowRepoModal(false)}
                disabled={savingRepos}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {githubRepos.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600">No repositories found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {githubRepos.filter(repo => !repo.private).map((repo) => {
                    const isSelected = selectedRepos.includes(repo.full_name);
                    const selectionIndex = selectedRepos.indexOf(repo.full_name);
                    
                    return (
                      <button
                        key={repo.id}
                        onClick={() => handleToggleRepo(repo.full_name)}
                        disabled={!isSelected && selectedRepos.length >= 3}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">{repo.name}</h4>
                              {isSelected && (
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                  {selectionIndex + 1}
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {repo.language && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                {repo.forks_count}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-600">
                {selectedRepos.length} of 3 selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRepoModal(false)}
                  disabled={savingRepos}
                  className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRepos}
                  disabled={savingRepos || selectedRepos.length === 0}
                  className="px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                  {savingRepos ? "Saving..." : "Save Selection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Experience Modals */}
      {/* Add Work Form Modal */}
      {showAddWorkForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                  placeholder="Tech Company"
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
                  placeholder="Software Engineer"
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
                  placeholder="New York, NY"
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
                  placeholder="• Developed web applications using modern frameworks&#10;• Collaborated with cross-functional teams&#10;• Implemented new features and bug fixes"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 flex items-center justify-end gap-3">
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
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWork}
                disabled={savingWork || !workFormData.company || !workFormData.title || !workFormData.startMonth || !workFormData.startYear || (!currentlyWorking && (!workFormData.endMonth || !workFormData.endYear))}
                className="px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {savingWork ? "Adding..." : "Add Experience"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Form Modal */}
      {showEditWorkForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                  placeholder="Tech Company"
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
                  placeholder="Software Engineer"
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
                  placeholder="New York, NY"
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
                  placeholder="• Developed web applications using modern frameworks&#10;• Collaborated with cross-functional teams&#10;• Implemented new features and bug fixes"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 flex items-center justify-end gap-3">
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
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWork}
                disabled={savingWork || !workFormData.company || !workFormData.title || !workFormData.startMonth || !workFormData.startYear || (!currentlyWorking && (!workFormData.endMonth || !workFormData.endYear))}
                className="px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {savingWork ? "Updating..." : "Update Experience"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education Modals */}
      {/* Add Education Form Modal */}
      {showAddEducationForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                  placeholder="University Name"
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
                  placeholder="City, State"
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
                  placeholder="Dean's List, Relevant coursework, Extracurricular activities"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 flex items-center justify-end gap-3">
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
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEducation}
                disabled={savingEducation || !educationFormData.schoolName || !educationFormData.degree || !educationFormData.startMonth || !educationFormData.startYear || (!currentlyStudying && (!educationFormData.endMonth || !educationFormData.endYear))}
                className="px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {savingEducation ? "Adding..." : "Add Education"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Education Form Modal */}
      {showEditEducationForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                  placeholder="University Name"
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
                  placeholder="City, State"
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
                  placeholder="Dean's List, Relevant coursework, Extracurricular activities"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 flex items-center justify-end gap-3">
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
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEducation}
                disabled={savingEducation || !educationFormData.schoolName || !educationFormData.degree || !educationFormData.startMonth || !educationFormData.startYear || (!currentlyStudying && (!educationFormData.endMonth || !educationFormData.endYear))}
                className="px-8 py-2.5 bg-gradient-to-r from-teal-500/90 to-emerald-500/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-teal-600/90 hover:to-emerald-600/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                {savingEducation ? "Updating..." : "Update Education"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn URL Modal */}
      {showLinkedInUrlModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Set LinkedIn Profile URL</h3>
              <button
                onClick={() => setShowLinkedInUrlModal(false)}
                disabled={savingLinkedInUrl}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Enter your LinkedIn profile URL so others can find you in the directory.
              </p>
              
              <div className="mb-4">
                <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  id="linkedinUrl"
                  value={linkedInUrlInput}
                  onChange={(e) => setLinkedInUrlInput(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: https://www.linkedin.com/in/john-doe
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkedInUrlModal(false)}
                  disabled={savingLinkedInUrl}
                  className="flex-1 px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLinkedInUrl}
                  disabled={savingLinkedInUrl || !linkedInUrlInput.trim()}
                  className="flex-1 px-8 py-2.5 bg-gradient-to-r from-[#0A66C2]/90 to-[#004182]/90 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:from-[#004182]/90 hover:to-[#003366]/90 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                  {savingLinkedInUrl ? "Saving..." : "Save URL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
