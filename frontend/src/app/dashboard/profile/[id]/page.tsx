"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/*-------------------Types------------------*/
type User = {
    id: number;
    name: string;
    email: string;
    headline?: string | null;
    picture: string;
    location?: string | null;
    school?: string | null;
    companies?: string | null;
    is_admin?: boolean;
}

type EducationHistory = {
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

type WorkHistory = {
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

type GithubRepo = {
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

type GithubIntegration = {
    connected: boolean;
    username?: string;
    profile_url?: string;
    top_repos?: string[];
    detailed_repos?: GithubRepo[];
}

type LinkedInIntegration = {
    id: number;
    linkedin_id: string;
    profile_url: string;
    first_name: string;
    last_name: string;
    headline: string;
    avatar_url: string;
    connected_at: string;
}

type UserEvents = {
    count: number;
    events: any[];
}

/*----------------Components----------*/
const ProfileImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [imageError, setImageError] = useState(false);
    
    if (imageError || !src) {
        return (
            <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                <Image 
                    src="/nextjs/camera-svgrepo-com.svg" 
                    alt="Default profile" 
                    width={32} 
                    height={32} 
                    className="opacity-50"
                />
            </div>
        );
    }
    
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setImageError(true)}
        />
    );
};

/*----------------API Functions----------*/
const fetchUserProfile = async (id: string): Promise<User | null> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

const fetchUserEducation = async (id: string): Promise<EducationHistory[]> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/education`);
        if (!response.ok) {
            throw new Error('Failed to fetch education history');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching education history:', error);
        return [];
    }
};

const fetchUserWork = async (id: string): Promise<WorkHistory[]> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/work`);
        if (!response.ok) {
            throw new Error('Failed to fetch work history');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching work history:', error);
        return [];
    }
};

const fetchUserEvents = async (id: string): Promise<UserEvents> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/events`);
        if (!response.ok) {
            throw new Error('Failed to fetch user events');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user events:', error);
        return { count: 0, events: [] };
    }
};

const fetchUserGithub = async (id: string): Promise<GithubIntegration> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/github`);
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub integration');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub integration:', error);
        return { connected: false };
    }
};

const fetchUserLinkedIn = async (id: string): Promise<LinkedInIntegration | null> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/linkedin`);
        if (!response.ok) {
            return null; // LinkedIn not connected
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching LinkedIn integration:', error);
        return null;
    }
};

export default function UserProfile() {
    const params = useParams();
    const userId = params.id as string;
    
    const [user, setUser] = useState<User | null>(null);
    const [education, setEducation] = useState<EducationHistory[]>([]);
    const [work, setWork] = useState<WorkHistory[]>([]);
    const [userEvents, setUserEvents] = useState<UserEvents>({ count: 0, events: [] });
    const [github, setGithub] = useState<GithubIntegration>({ connected: false });
    const [linkedin, setLinkedin] = useState<LinkedInIntegration | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (!userId) return;
            
            setLoading(true);
            const [userProfile, educationHistory, workHistory, eventsData, githubData, linkedinData] = await Promise.all([
                fetchUserProfile(userId),
                fetchUserEducation(userId),
                fetchUserWork(userId),
                fetchUserEvents(userId),
                fetchUserGithub(userId),
                fetchUserLinkedIn(userId)
            ]);
            
            setUser(userProfile);
            setEducation(educationHistory);
            setWork(workHistory);
            setUserEvents(eventsData);
            setGithub(githubData);
            setLinkedin(linkedinData);
            setLoading(false);
        };

        loadUserData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-500">Loading profile...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-500">User not found</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-6">
                    <ProfileImage
                        src={user.picture || ""}
                        alt={user.name}
                        className="h-24 w-24 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <span className="text-gray-500">#{user.id}</span>
                            {user.is_admin && (
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                                    Club Verified
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 mb-4">{user.headline || "No headline provided"}</p>
                        
                        {/* Social Links */}
                        {((linkedin && !linkedin.profile_url.includes("profile-not-set")) || github.connected) && (
                            <div className="flex gap-2 mb-4">
                                {linkedin && !linkedin.profile_url.includes("profile-not-set") && (
                                    <a 
                                        href={linkedin.profile_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center hover:bg-blue-200 transition-colors"
                                        title={`${linkedin.first_name} ${linkedin.last_name} on LinkedIn`}
                                    >
                                        <Image src="/assets/linkedin.svg" alt="LinkedIn" width={16} height={16} />
                                    </a>
                                )}
                                {github.connected && (
                                    <a 
                                        href={github.profile_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center hover:bg-purple-200 transition-colors"
                                        title={`${github.username} on GitHub`}
                                    >
                                        <Image src="/assets/github.svg" alt="GitHub" width={16} height={16} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                    <h3 className="font-semibold text-gray-700 mb-1">Events Attended</h3>
                    <p className="text-3xl font-bold text-gray-900">{userEvents.count}</p>
                </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-lg">📅</span>
                        <span>Joined October 2025</span>
                    </div>
                    {education.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">🎓</span>
                            <span>Studies at {education[0].school_name}</span>
                        </div>
                    )}
                    {user.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">📍</span>
                            <span>From {user.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* GitHub Repos Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top GitHub Repositories</h2>
                {github.connected && github.detailed_repos && github.detailed_repos.length > 0 ? (
                    <div className="space-y-3">
                        {github.detailed_repos.map((repo, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                    <Image src="/assets/github.svg" alt="GitHub" width={16} height={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <a 
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                        >
                                            {repo.name}
                                        </a>
                                        {repo.language && (
                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>
                                    {repo.description && (
                                        <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            ⭐ {repo.stargazers_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            🍴 {repo.forks_count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : github.connected && github.top_repos && github.top_repos.length > 0 ? (
                    <div className="space-y-3">
                        {github.top_repos.map((repo, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                    <Image src="/assets/github.svg" alt="GitHub" width={16} height={16} />
                                </div>
                                <div className="flex-1">
                                    <a 
                                        href={`https://github.com/${repo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                        {repo}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-8">
                        {github.connected ? 'No repositories selected' : 'No GitHub repositories connected'}
                    </div>
                )}
            </div>

            {/* Education History */}
            {education.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
                    <div className="space-y-4">
                        {education.map((edu) => (
                            <div key={edu.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {edu.school_logo_url ? (
                                        <img 
                                            src={edu.school_logo_url} 
                                            alt={edu.school_name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <Image 
                                        src="/nextjs/notebook-svgrepo-com.svg" 
                                        alt="School" 
                                        width={24} 
                                        height={24} 
                                        className={edu.school_logo_url ? 'hidden' : ''}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{edu.school_name}</h3>
                                    <p className="text-gray-600">{edu.degree} in {edu.field_of_study}</p>
                                    <p className="text-sm text-gray-500">{edu.start_date} - {edu.end_date}</p>
                                    {edu.location && <p className="text-sm text-gray-500">{edu.location}</p>}
                                    {edu.description && <p className="text-sm text-gray-600 mt-2">{edu.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Work History */}
            {work.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
                    <div className="space-y-4">
                        {work.map((job) => (
                            <div key={job.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {job.company_logo_url ? (
                                        <img 
                                            src={job.company_logo_url} 
                                            alt={job.company}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <Image 
                                        src="/nextjs/shop-svgrepo-com.svg" 
                                        alt="Company" 
                                        width={24} 
                                        height={24} 
                                        className={job.company_logo_url ? 'hidden' : ''}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{job.company}</h3>
                                    <p className="text-gray-600">{job.title}</p>
                                    <p className="text-sm text-gray-500">{job.start_date} - {job.end_date}</p>
                                    {job.location && <p className="text-sm text-gray-500">{job.location}</p>}
                                    {job.description && <p className="text-sm text-gray-600 mt-2">{job.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
