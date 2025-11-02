"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type User = {
  id: number;
  name: string;
  email: string;
  headline?: string;
  picture: string;
  is_admin?: boolean;
}

type UserEvents = {
  count: number;
  events: any[];
}

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  room?: string;
  external_link?: string;
  recording_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<UserEvents>({ count: 0, events: [] });
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check authentication and get user info
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { credentials: "include" });
        if (userResponse.status === 401) {
          router.push("/login");
          return;
        }
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Fetch user's events
          const eventsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData.id}/events`, { credentials: "include" });
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            setUserEvents(eventsData);
          }

          // Fetch upcoming events
          const upcomingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, { credentials: "include" });
          if (upcomingResponse.ok) {
            const allEvents = await upcomingResponse.json();
            const now = new Date();
            const upcoming = allEvents
              .filter((event: Event) => new Date(event.date) > now)
              .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            setUpcomingEvent(upcoming || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with greeting */}
      {user && (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">Hey, {user.name.split(' ')[0]}!</span>
            <span className="text-2xl">👋</span>
          </div>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Small Stats Cards */}
        <div className="space-y-4">
          {/* Member Number Card */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Member #</h3>
              <p className="text-2xl font-bold text-gray-900">#{user.id}</p>
            </div>
          )}

          {/* Events Attended Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Events Attended</h3>
            <p className="text-2xl font-bold text-gray-900">{userEvents.count}</p>
          </div>
        </div>

        {/* Middle Column - Upcoming Event */}
        <div>
          {upcomingEvent && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Event</h3>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{upcomingEvent.title}</h4>
                <p className="text-sm text-gray-600">{upcomingEvent.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>📅</span>
                  <span>{new Date(upcomingEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {upcomingEvent.room && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📍</span>
                    <span>{upcomingEvent.room}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Social Cards */}
        <div className="space-y-4">
          {/* Code for All Socials Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/assets/codeforall.svg" alt="Code for All" width={28} height={28} />
              <h3 className="text-base font-semibold text-gray-900">Code for All Socials</h3>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.codeforall.nyc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Image src="/assets/website.svg" alt="Website" width={20} height={20} />
              </a>
              <a 
                href="https://www.linkedin.com/company/code-for-all-qc/posts/?feedView=all" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Image src="/assets/linkedin.svg" alt="LinkedIn" width={20} height={20} />
              </a>
              <a 
                href="https://www.instagram.com/codeforall_qc/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Hack Knight QC Socials Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-xl">⚔️</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Hack Knight QC Socials</h3>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://hackknight.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Image src="/assets/website.svg" alt="Website" width={20} height={20} />
              </a>
              <a 
                href="https://www.instagram.com/hack.qc/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
