"use client";

import Image from "next/image";
import { useEffect, useMemo, useState} from "react";
import Select from "react-select";

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
    { id: 1, name: "Diego Martinez", email: "diego@ex.com", headline: "Web Dev | CS @ UTEP", school: "UTEP", company: "GDG on Campus", location: "TX", avatarUrl: "https://i.pravatar.cc/100?img=11" },
    { id: 2, name: "Adam Romero", email: "adam@ex.com", headline: "CS @ USC | Prev @ Meta", school: "USC", company: "Meta", location: "CA", avatarUrl: "https://i.pravatar.cc/100?img=12" },
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
            <div className="flex flex-row w-full">
                <h1 className="text-2xl mr-3" >Directory</h1>
                <Image className="" src="/nextjs/folder-svgrepo-com.svg" alt="" width={40} height={40} />
            </div>
            <div>

            </div>
        </div>
    );
}