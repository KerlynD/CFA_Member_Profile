"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Submission = {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  id: string;
};

type Problems = {
  count: number;
  submission: Submission[];
};

type Card = {
  available: boolean;
  message?: string;
  discord_username?: string;
  leetcode_username?: string;
  points?: number;
  wins?: number;
  local_ranking?: number;
  avatar?: string;
  problems?: Problems;
};

type Top10Row = {
  discord_username: string;
  username: string;
  points: number;
};

type AllTimeRow = {
  discord_username: string;
  leetcode_username?: string;
  username?: string;
  total_wins: number;
  total_points: number;
};

const getLangIcon = (lang: string) => {
  const langLower = lang.toLowerCase();
  
  if (langLower.includes("python")) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" fill="#5A9FD4"/>
      </svg>
    );
  }
  if (langLower.includes("javascript") || langLower === "js") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#F7DF1E"/>
        <path d="M7.5 18c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5zm4.5-6.75c0-1.24 1.01-2.25 2.25-2.25h1.5c.41 0 .75.34.75.75s-.34.75-.75.75h-1.5c-.41 0-.75.34-.75.75v1.5c0 .41.34.75.75.75h.75c1.24 0 2.25 1.01 2.25 2.25v.75c0 1.24-1.01 2.25-2.25 2.25h-1.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h1.5c.41 0 .75-.34.75-.75v-.75c0-.41-.34-.75-.75-.75h-.75c-1.24 0-2.25-1.01-2.25-2.25v-1.5z" fill="#000"/>
      </svg>
    );
  }
  if (langLower.includes("java") && !langLower.includes("javascript")) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218" fill="#5382A1"/>
        <path d="M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573" fill="#E76F00"/>
      </svg>
    );
  }
  if (langLower.includes("cpp") || langLower.includes("c++")) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l10 5.5v11L12 24 2 18.5v-11L12 2zm4.5 12h-1v1h-1v-1h-1v-1h1v-1h1v1h1v1zm3 0h-1v1h-1v-1h-1v-1h1v-1h1v1h1v1zM8.5 9.5C7.12 9.5 6 10.62 6 12s1.12 2.5 2.5 2.5c.74 0 1.41-.34 1.86-.87l-1.36-.98c-.1.14-.26.23-.45.23-.33 0-.6-.27-.6-.6s.27-.6.6-.6c.19 0 .35.09.45.23l1.36-.98c-.45-.53-1.12-.87-1.86-.87z" fill="#00599C"/>
      </svg>
    );
  }
  if (langLower.includes("rust")) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#CE412B">
        <path d="M23.834 11.1l-.866-.5.3-.85-.846-.33-.184.995-.843-.48c-.23-.94-.577-1.8-1.025-2.56l.772-.732-.597-.77-.81.597c-.574-.623-1.237-1.163-1.98-1.598l.345-.948-.846-.344-.47.886C15.33 3.95 13.695 3.617 12 3.617c-1.695 0-3.33.333-4.784.95l-.47-.886-.846.344.345.948c-.743.435-1.406.975-1.98 1.598l-.81-.597-.597.77.772.732c-.448.76-.795 1.62-1.025 2.56l-.843.48-.184-.995-.846.33.3.85-.866.5.3.85-.3.85.866.5-.3.85.846.33.184-.995.843.48c.23.94.577 1.8 1.025 2.56l-.772.732.597.77.81-.597c.574.623 1.237 1.163 1.98 1.598l-.345.948.846.344.47-.886c1.454.617 3.09.95 4.784.95 1.695 0 3.33-.333 4.784-.95l.47.886.846-.344-.345-.948c.743-.435 1.406-.975 1.98-1.598l.81.597.597-.77-.772-.732c.448-.76.795-1.62 1.025-2.56l.843-.48.184.995.846-.33-.3-.85.866-.5-.3-.85.3-.85zM12 17.5c-3.037 0-5.5-2.463-5.5-5.5s2.463-5.5 5.5-5.5 5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5z"/>
      </svg>
    );
  }
  
  // Default code icon
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.7 15.9L4.8 12l3.9-3.9c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0l-4.59 4.59c-.39.39-.39 1.02 0 1.41l4.59 4.6c.39.39 1.01.39 1.4 0 .39-.39.39-1.01 0-1.41zm6.6 0l3.9-3.9-3.9-3.9c-.39-.39-.39-1.01 0-1.4.39-.39 1.01-.39 1.4 0l4.59 4.59c.39.39.39 1.02 0 1.41l-4.59 4.6c-.39.39-1.01.39-1.4 0-.39-.39-.39-1.01 0-1.41z"/>
    </svg>
  );
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function LeetcodeLeaderboard() {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [top10, setTop10] = useState<Top10Row[]>([]);
  const [alltime, setAlltime] = useState<AllTimeRow[]>([]);
  const [loadingRight, setLoadingRight] = useState(true);

  useEffect(() => {
    const CACHE_KEY = "leetcode_card_cache";
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    const fetchCard = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const age = Date.now() - timestamp;
          
          // If cache is still fresh, use it
          if (age < CACHE_DURATION) {
            setCard(data);
            setLoading(false);
            return;
          }
        }

        // Cache miss or expired - fetch fresh data
        const res = await fetch("http://localhost:8080/api/leetcode/lookup", {
          credentials: "include",
        });
        const data = await res.json();
        setCard(data);
        
        // Cache the response
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {
        setCard({ available: false, message: "Lookup currently down" });
      } finally {
        setLoading(false);
      }
    };
    fetchCard();

    const fetchBoards = async () => {
      try {
        const [top10Res, alltimeRes] = await Promise.all([
          fetch("https://server.rakibshahid.com/leaderboard"),
          fetch("https://server.rakibshahid.com/leaderboard/leaderboard_history"),
        ]);

        if (top10Res.ok) {
          const data = await top10Res.json();
          setTop10(Array.isArray(data) ? data.slice(0, 10) : []);
        }

        if (alltimeRes.ok) {
          const data = await alltimeRes.json();
          setAlltime(Array.isArray(data) ? data.slice(0, 10) : []);
        }
      } catch (e) {
        console.error("Error fetching leaderboards:", e);
        setTop10([]);
        setAlltime([]);
      } finally {
        setLoadingRight(false);
      }
    };
    fetchBoards();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : !card ? (
              <div className="p-8 text-center text-gray-500">Lookup currently down</div>
            ) : !card.available ? (
              <div className="p-8 text-center text-gray-600">
                {card.message || "Lookup currently down"}
              </div>
            ) : (
              <div>
                {/* Square Avatar at top */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-indigo-100 to-purple-100">
                  {card.avatar ? (
                    <Image
                      src={card.avatar}
                      alt={card.leetcode_username || "avatar"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-24 h-24" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Usernames */}
                  <div className="text-center border-b border-gray-100 pb-4">
                    <div className="text-xl font-bold text-gray-900">
                      {card.discord_username || "Unknown"}
                    </div>
                    {card.leetcode_username && (
                      <a
                        href={`https://leetcode.com/u/${card.leetcode_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        @{card.leetcode_username}
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{card.wins ?? 0}</div>
                      <div className="text-xs text-gray-500">Wins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{card.points?.toFixed(0) ?? 0}</div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">#{card.local_ranking ?? 0}</div>
                      <div className="text-xs text-gray-500">Rank</div>
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  {card.problems && card.problems.submission && card.problems.submission.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Submissions</h3>
                      <div className="space-y-2">
                        {card.problems.submission.slice(0, 5).map((sub, idx) => (
                          <a
                            key={sub.id}
                            href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                                  {sub.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getLangIcon(sub.lang)}
                                  <span className="text-xs text-gray-500">{sub.lang}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{formatTimestamp(sub.timestamp)}</span>
                                </div>
                              </div>
                              <span className="text-xs text-green-600 font-medium">✓</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Leaderboards */}
        <div className="lg:col-span-2 space-y-5">
          {/* Top 10 Current */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Top 10 Current</h2>
                <span className="text-xs text-gray-300">Weekly</span>
              </div>
            </div>
            <div className="p-4">
              {loadingRight ? (
                <div className="text-gray-500 text-center py-6 text-sm">Loading...</div>
              ) : top10.length === 0 ? (
                <div className="text-gray-500 text-center py-6 text-sm">No data available</div>
              ) : (
                <div className="space-y-1.5">
                  {top10.map((user, idx) => (
                    <div
                      key={`${user.username}-${idx}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 font-semibold text-xs text-gray-700">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{user.discord_username}</div>
                        <a
                          href={`https://leetcode.com/u/${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                        >
                          @{user.username}
                        </a>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-gray-900">{user.points.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Time Top 10 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">All Time Champions</h2>
                <span className="text-xs text-gray-300">History</span>
              </div>
            </div>
            <div className="p-4">
              {loadingRight ? (
                <div className="text-gray-500 text-center py-6 text-sm">Loading...</div>
              ) : alltime.length === 0 ? (
                <div className="text-gray-500 text-center py-6 text-sm">No data available</div>
              ) : (
                <div className="space-y-1.5">
                  {alltime.map((user, idx) => {
                    const lcUsername = user.leetcode_username || user.username || "unknown";
                    return (
                      <div
                        key={`${lcUsername}-${idx}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                      >
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 font-semibold text-xs text-gray-700">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{user.discord_username}</div>
                          <a
                            href={`https://leetcode.com/u/${lcUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                          >
                            @{lcUsername}
                          </a>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <div className="text-base font-semibold text-gray-900">{user.total_wins}</div>
                            <div className="text-xs text-gray-500">wins</div>
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">{user.total_points}</div>
                            <div className="text-xs text-gray-500">pts</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
