"use client";

import Image from "next/image";
import { useEffect, useMemo, useState} from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";

const customStyles = {
    control: (base: any) => ({
        ...base,
        borderRadius: "12px",
        borderColor: "#ccc",
        boxShadow: "none",
        "&:hover": { borderColor: "#999" },
        paddingLeft: "8px",
    }),
    option: (base:any, state:any) => ({
        ...base,
        backgroundColor: state.isFocused ? '#10b98120' : 'white',
        color: '#333',
    }),
    placeholder: (base: any) => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    }),
};

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
}

/*----------------Reusable helpers----------*/
const toOptions = (values: (string | null | undefined)[]) =>
        Array.from(new Set(values.filter((v): v is string => Boolean(v))))
            .sort()
            .map((v) => ({ value: v, label: v }));

/*----------------Custom Components----------*/
const SchoolPlaceholder = () => (
    <div className="flex items-center gap-2">
        <Image src="/assets/school.svg" alt="School" width={16} height={16} />
        <span>School</span>
    </div>
);

const LocationPlaceholder = () => (
    <div className="flex items-center gap-2">
        <Image src="/assets/location.svg" alt="Location" width={16} height={16} />
        <span>Location</span>
    </div>
);

const CompanyPlaceholder = () => (
    <div className="flex items-center gap-2">
        <Image src="/assets/company.svg" alt="Company" width={16} height={16} />
        <span>Company</span>
    </div>
);

const ProfileImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [imageError, setImageError] = useState(false);
    
    if (imageError || !src) {
        return (
            <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                <Image 
                    src="/assets/profile.svg" 
                    alt="Default profile" 
                    width={24} 
                    height={24} 
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
const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};
export default function Directory() {
    const router = useRouter();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(20);

    // Filter states
    const [school, setSchool] = useState<{value:string; label:string} | null>(null);
    const [location, setLocation] = useState<{value:string; label:string} | null>(null);
    const [company, setCompany] = useState<{value:string; label:string} | null>(null);

    /*Load users from API */
    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            console.log('Starting to load users...');
            const users = await fetchUsers();
            console.log('Loaded users:', users);
            setAllUsers(users);
            setLoading(false);
        };
        loadUsers();
    }, []);

    /*Build dropdown options from the current dataset */
    const schoolOptions = useMemo(() => {
        // Extract all individual schools from comma-separated lists
        const allSchools = allUsers.flatMap(u => 
            u.school ? u.school.split(',').map(s => s.trim()) : []
        );
        return toOptions(allSchools);
    }, [allUsers]);
    
    const companyOptions = useMemo(() => {
        // Extract all individual companies from comma-separated lists
        const allCompanies = allUsers.flatMap(u => 
            u.companies ? u.companies.split(',').map(c => c.trim()) : []
        );
        return toOptions(allCompanies);
    }, [allUsers]);
    
    const locationOptions = useMemo(()=> toOptions(allUsers.map(u => u.location)), [allUsers]);

    /*Apply filters client-side*/
    const filtered = useMemo(()=>{
        const q = query.trim().toLowerCase();
        return allUsers.filter((u) => {
            const matchesQuery =
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q);

            const matchSchool = !school || (u.school && u.school.toLowerCase().includes(school.value.toLowerCase()));
            const matchCompany = !company || (u.companies && u.companies.toLowerCase().includes(company.value.toLowerCase()));
            const matchLocation = !location || (u.location && u.location === location.value);

            return matchesQuery && matchSchool && matchCompany && matchLocation;
        });
    }, [allUsers, query, location, school, company]);

    /*Pagination logic*/
    const totalPages = Math.ceil(filtered.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentUsers = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, school, company, location]);

    if (loading) {
        return (
            <div className="flex flex-col w-full">
                <div className="flex flex-row w-full items-center">
                    <h1 className="text-2xl mr-3">Directory</h1>
                    <Image src="/assets/directory.svg" alt="" width={35} height={35} />
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-500">Loading members...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-row w-full items-center">
                <h1 className="text-2xl mr-3">Directory</h1>
                <Image src="/assets/directory.svg" alt="" width={35} height={35} />
            </div>
            <main className="mt-5">
                {/* Top bar: search and filters side by side */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                    {/* Search bar */}
                    <div className="flex-1 max-w-md">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or email"
                            className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 outline-none focus:border-emerald-700"
                        />
                    </div>

                    {/* Dropdowns next to search bar */}
                    <div className="flex flex-row flex-wrap gap-3">
                        <Select 
                            className="w-48" 
                            placeholder={<SchoolPlaceholder />}
                            styles={customStyles} 
                            options={schoolOptions} 
                            onChange={(e) => setSchool(e)} 
                            isClearable 
                        />
                        <Select 
                            className="w-48" 
                            placeholder={<CompanyPlaceholder />}
                            styles={customStyles} 
                            options={companyOptions} 
                            onChange={(e) => setCompany(e)} 
                            isClearable 
                        />
                        <Select 
                            className="w-48" 
                            placeholder={<LocationPlaceholder />}
                            styles={customStyles} 
                            options={locationOptions} 
                            onChange={(e) => setLocation(e)} 
                            isClearable 
                        />
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {currentUsers.length} of {filtered.length} members
                </div>

                {/* User grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentUsers.map((u) => (
                        <div 
                            key={u.id} 
                            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/dashboard/profile/${u.id}`)}
                        >
                            <ProfileImage
                                src={u.picture || ""}
                                alt={u.name}
                                className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate mb-1">{u.name}</p>
                                <p className="text-xs text-gray-600 line-clamp-2">{u.headline || "No headline provided"}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        currentPage === page
                                            ? 'bg-emerald-600 text-white'
                                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {filtered.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Image src="/nextjs/cry-svgrepo-com.svg" alt="No results" width={64} height={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg text-gray-500 mb-2">No members found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                )}
            </main>
        </div>
    );
}