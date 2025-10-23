"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/logout", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                router.push("/login");
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <aside className="left-0 h-screen w-[250px] flex-col items-start gap-4 overflow-auto border-r border-r-gray-200 p-6 md:flex hidden text-xl">
            <div className="p-2 flex items-center gap-2">
                <Image src="/assets/codeforall.svg" alt="Code for All logo" width={24} height={24} className="flex-shrink-0" style={{ width: '24px', height: '24px' }}/>
                <span className="text-base font-semibold">Code for All</span>
            </div>
            <nav className="w-full p-2 mt-5">
                <ul className="flex flex-col gap-1">
                    <li><Link aria-current={ pathname.endsWith("/profile") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
                              href="/dashboard/home">
                        <Image src="/assets/profile.svg"
                               alt="Profile icon"
                               width={20}
                               height={20}
                               className="flex-shrink-0"
                               style={{ width: '20px', height: '20px' }}/>Home
                    </Link></li>
                    <li><Link aria-current={ pathname.endsWith("/directory") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
                              href="/dashboard/directory">
                        <Image src="/assets/directory.svg"
                               alt="Directory icon"
                               width={20}
                               height={20} /> Directory
                    </Link></li>
                    <li><Link aria-current={ pathname.endsWith("/events") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
                              href="/dashboard/events">
                        <Image src="/assets/events.svg"
                               alt="Events icon"
                               width={20} height={20}/>Events
                    </Link></li>
                    <li><Link aria-current={ pathname.endsWith("/offers") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
                              href="/dashboard/offers">
                        <Image src="/assets/money-check.svg"
                               alt="Offers icon"
                               width={20}
                               height={20} /> Offers
                    </Link></li>
                    <li><Link aria-current={ pathname.endsWith("/leetcodeleaderboard") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
                              href="/dashboard/leetcodeleaderboard">
                        <Image src="/assets/leetcode.svg"
                               alt="LeetCode icon"
                               width={20}
                               height={20} />Leaderboard
                    </Link></li>
                    <li><Link aria-current={ pathname.endsWith("/profile") ? "page" : undefined}
                              className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="/dashboard/profile">
                        <Image src="/assets/profile.svg"
                               alt="Profile icon"
                               width={20}
                               height={20}
                               className="flex-shrink-0"
                               style={{ width: '20px', height: '20px' }}/>Profile
                    </Link></li>
                </ul>
            </nav>
            <div className="p-2 w-full mt-auto">
                <button 
                    onClick={handleLogout}
                    className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10" 
                    type="button"
                >
                    <Image src="/assets/logout.svg" alt="Logout icon" width={20} height={20} style={{ width: 'auto', height: 'auto' }}/>
                    Log Out
                </button>
            </div>
        </aside>
    );
}