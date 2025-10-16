"use client";

import Image from "next/image";
import { useEffect, useMemo, useState} from "react";
import Select from "react-select";


const customStyles = {
    control: (base: any) => ({
        ...base,
        borderRadius: "12px",   // ← rounded corners
        borderColor: "#ccc",
        boxShadow: "none",
        "&:hover": { borderColor: "#999" },
    }),
    option: (base:any, state:any) => ({
        ...base,
        backgroundColor: state.isFocused ? '#10b98120' : 'white',
        color: '#333',
    }),
};

/*-------------------Types------------------*/
type User = {
    id: number;
    name: string;
    email: string;
    headline: string;
    picture: string;
    company?: string;
    location?: string;
    school?: string;
}
/*----------------Reuseable helpers----------*/
const toOptions = (values: (string| undefined)[]) =>
        Array.from(new Set(values.filter(Boolean) as string[]))
            .sort()
            .map((v) => ({ value: v, label: v }));

/*------------Nock Data(replace with fetch later----------*/
const MOCK_USERS: User[] = [
    { id: 1, name: "Diego Martinez", email: "diego@ex.com", headline: "Web Dev | CS @ UTEP", school: "UTEP", company: "GDG on Campus", location: "TX", picture: "https://i.pravatar.cc/100?img=11" },
    { id: 2, name: "Adam Romero", email: "adam@ex.com", headline: "CS @ USC | Prev @ Meta", school: "USC", company: "Meta", location: "CA", picture: "https://i.pravatar.cc/100?img=12" },
    // ...
];
export default function Directory() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [query, setQuery] = useState("");

    //the filter we are using
    const [school, setSchool] = useState<{value:string; label:string} | null>(null);
    const [companies, setCompanies] = useState<{value:string; label:string} | null>(null);
    const [location,setLocation] = useState<{value:string; label:string} | null>(null);


    /*Load users (replace with real fetch) */
    useEffect(() => {



        setAllUsers(MOCK_USERS);
    }, []);

    /*Build dropdown options from the current dataset */
    const schoolOptions = useMemo(()=> toOptions(allUsers.map(u => u.school)), [allUsers]);
    const companyOptions = useMemo(()=> toOptions(allUsers.map(u => u.company)), [allUsers]);
    const locationOptions = useMemo(()=> toOptions(allUsers.map(u => u.location)), [allUsers]);

    /*Apply filters client-side*/
    const filtered = useMemo(()=>{
        const q = query.trim().toLowerCase();
        return allUsers.filter((u) => {
            const matchesQuery =
                !q ||
                u.name.toLowerCase().includes(q) ||
                u.name.toLowerCase().includes(q);

            const matchSchool  = !school || u.school === school.value;
            const matchCompany = !companies || u.company === companies.value;
            const matchLocation   = !location || u.location === location.value;

            return (
                matchesQuery &&
                    matchSchool &&
                    matchCompany &&
                    matchLocation
            );
        });
    }, [allUsers, query, location, school, companies]);

    return (
        <div className="flex flex-col p-2 w-full">
            <div className="flex flex-row w-full items-center">
                <h1 className="text-2xl mr-3" >Directory</h1>
                <Image className="" src="/nextjs/folder-svgrepo-com.svg" alt="" width={35} height={35} />
            </div>
            <main className="mt-5">
                {/* Top bar: search + filters */}
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or email"
                                className="w-80 rounded-full border border-gray-300 bg-white px-4 py-2 outline-none focus:border-emerald-700"
                            />
                        </div>

                        <div className="flex flex-row flex-wrap gap-2">
                            <Select className="w-52 " placeholder="School" styles={customStyles} options={schoolOptions} onChange={(e) => setSchool(e)} isClearable />
                            <Select className="w-52" placeholder="Company" styles={customStyles} options={companyOptions} onChange={(e) => setCompanies(e)} isClearable />
                            <Select className="w-52" placeholder="Location" styles={customStyles} options={locationOptions} onChange={(e) => setLocation(e)} isClearable />
                        </div>
                    </div>
            </main>
        </div>
    );
}