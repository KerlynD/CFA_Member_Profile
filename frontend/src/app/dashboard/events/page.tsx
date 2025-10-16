"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date: string;
  room: string;
  external_link: string;
  attendees: number;
  recording_url: string;
  is_registered: boolean;
}

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    room: "",
    externalLink: "",
    recordingUrl: "",
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/me", {
        credentials: "include",
      });

      if (res.ok) {
        const user = await res.json();
        setIsAdmin(user.is_admin || false);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/events", {
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/events/${eventId}/register`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        await fetchEvents(); // Refresh the events list
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Registration failed"}`);
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register for event");
    }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/events/${eventId}/register`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchEvents(); // Refresh the events list
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Unregistration failed"}`);
      }
    } catch (error) {
      console.error("Error unregistering from event:", error);
      alert("Failed to unregister from event");
    }
  };

  const handleAddEvent = async () => {
    if (!formData.title || !formData.description || !formData.date || !formData.endDate) {
      alert("Please fill in all required fields");
      return;
    }

    setSavingEvent(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/events", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: new Date(formData.date).toISOString(),
          end_date: new Date(formData.endDate).toISOString(),
          room: formData.room,
          external_link: formData.externalLink,
          recording_url: formData.recordingUrl,
        }),
      });

      if (res.ok) {
        setFormData({
          title: "",
          description: "",
          date: "",
          endDate: "",
          room: "",
          externalLink: "",
          recordingUrl: "",
        });
        setShowAddModal(false);
        await fetchEvents();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to add event"}`);
      }
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    // Convert ISO date strings to datetime-local format
    const startDate = new Date(event.date);
    const endDate = new Date(event.end_date);
    
    setFormData({
      title: event.title,
      description: event.description,
      date: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16),
      room: event.room || "",
      externalLink: event.external_link || "",
      recordingUrl: event.recording_url || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !formData.title || !formData.description || !formData.date || !formData.endDate) {
      alert("Please fill in all required fields");
      return;
    }

    setSavingEvent(true);
    try {
      const res = await fetch(`http://localhost:8080/api/admin/events/${selectedEvent.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: new Date(formData.date).toISOString(),
          end_date: new Date(formData.endDate).toISOString(),
          room: formData.room,
          external_link: formData.externalLink,
          recording_url: formData.recordingUrl,
        }),
      });

      if (res.ok) {
        setFormData({
          title: "",
          description: "",
          date: "",
          endDate: "",
          room: "",
          externalLink: "",
          recordingUrl: "",
        });
        setShowEditModal(false);
        setSelectedEvent(null);
        await fetchEvents();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to update event"}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/admin/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to delete event"}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    
    return `${dateStr}, ${startTime} - ${endTime}`;
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.date));
  const pastEvents = events.filter(event => !isUpcoming(event.date));

  const EventCard = ({ event, isPast }: { event: Event; isPast: boolean }) => (
    <div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition relative cursor-pointer"
      onClick={() => handleViewDetails(event)}
    >
      {/* Admin Actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditEvent(event);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit event"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteEvent(event.id);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Delete event"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Event Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3 pr-16">
        {event.title}
      </h3>

      {/* Date & Time */}
      <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{formatDateRange(event.date, event.end_date)}</span>
      </div>

      {/* Room (if provided) */}
      {event.room && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.room}</span>
        </div>
      )}

      {/* Registration Status */}
      {!isPast && (
        <div className="flex items-center gap-2 mb-4">
          {event.is_registered ? (
            <div className="flex items-center gap-1 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Going</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium">Not Going</span>
            </div>
          )}
        </div>
      )}

      {/* Attendees */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-2">
          {/* Placeholder profile images - in production, fetch actual attendee images */}
          {[...Array(Math.min(event.attendees, 3))].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
          ))}
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {event.attendees} {event.attendees === 1 ? 'person' : 'people'} {isPast ? 'attended' : 'going'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isPast ? (
          event.is_registered ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnregister(event.id);
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Unregister
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRegister(event.id);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Register
            </button>
          )
        ) : (
          event.recording_url && (
            <a
              href={event.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              View Recording
            </a>
          )
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Events 📅</h1>
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events 📅</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Event
          </button>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming ({upcomingEvents.length})
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No upcoming events
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} isPast={false} />
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Past ({pastEvents.length})
        </h2>
        {pastEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No past events
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} isPast={true} />
            ))}
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
                  {selectedEvent.is_registered && (
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">You're going!</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                </div>

                {/* Date & Time */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">When</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDateRange(selectedEvent.date, selectedEvent.end_date)}</span>
                  </div>
                </div>

                {/* Location/Room */}
                {selectedEvent.room && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</h3>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedEvent.room}</span>
                    </div>
                  </div>
                )}

                {/* Attendees */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Attendees</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(selectedEvent.attendees, 5))].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                      ))}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {selectedEvent.attendees} {selectedEvent.attendees === 1 ? 'person' : 'people'} {isUpcoming(selectedEvent.date) ? 'going' : 'attended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                {selectedEvent.external_link && (
                  <a
                    href={selectedEvent.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    External Link
                  </a>
                )}
                
                {isUpcoming(selectedEvent.date) ? (
                  selectedEvent.is_registered ? (
                    <button
                      onClick={() => {
                        handleUnregister(selectedEvent.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleRegister(selectedEvent.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Register for Event
                    </button>
                  )
                ) : (
                  selectedEvent.recording_url && (
                    <a
                      href={selectedEvent.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      View Recording
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Event</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="October Fam Friday | Tech & Treats"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Join us for an evening of tech talks and networking..."
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                    Room/Location (Optional)
                  </label>
                  <input
                    type="text"
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Room 203 or Zoom Link"
                  />
                </div>

                {/* External Link */}
                <div>
                  <label htmlFor="externalLink" className="block text-sm font-medium text-gray-700 mb-2">
                    External Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="externalLink"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Link for "See Details" button</p>
                </div>

                {/* Recording URL */}
                <div>
                  <label htmlFor="recordingUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Recording URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="recordingUrl"
                    value={formData.recordingUrl}
                    onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Add later for past events</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={savingEvent || !formData.title || !formData.description || !formData.date || !formData.endDate}
                  className="flex-1 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEvent ? "Adding..." : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal (Admin Only) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="October Fam Friday | Tech & Treats"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Join us for an evening of tech talks and networking..."
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="edit-date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="edit-endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label htmlFor="edit-room" className="block text-sm font-medium text-gray-700 mb-2">
                    Room/Location (Optional)
                  </label>
                  <input
                    type="text"
                    id="edit-room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Room 203 or Zoom Link"
                  />
                </div>

                {/* External Link */}
                <div>
                  <label htmlFor="edit-externalLink" className="block text-sm font-medium text-gray-700 mb-2">
                    External Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="edit-externalLink"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="https://..."
                  />
                </div>

                {/* Recording URL */}
                <div>
                  <label htmlFor="edit-recordingUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Recording URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="edit-recordingUrl"
                    value={formData.recordingUrl}
                    onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEvent}
                  disabled={savingEvent || !formData.title || !formData.description || !formData.date || !formData.endDate}
                  className="flex-1 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEvent ? "Updating..." : "Update Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
