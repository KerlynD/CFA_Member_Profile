"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="left-0 h-screen w-[270px] flex-col items-start gap-4 overflow-auto border-r border-r-gray-200 p-6 md:flex hidden text-xl">
            <p className="p-2">
                Code for All
            </p>
            <nav className="w-full p-2 mt-5">
                <ul className="flex flex-col gap-1">
                    <li><Link aria-current={ pathname.endsWith("/directory") ? "page" : undefined} className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="directory"> <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/> Directory</Link></li>
                    <li><Link aria-current={ pathname.endsWith("/offers") ? "page" : undefined} className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="offers"> <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/> Offers</Link></li>
                    <li><Link aria-current={ pathname.endsWith("/resources") ? "page" : undefined} className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="resources">  <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/> Resources</Link></li>
                    <li><Link aria-current={ pathname.endsWith("/leetcodeleaderboard") ? "page" : undefined} className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="leetcodeleaderboard"> <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/>LC Leaderboard</Link></li>
                    <li><Link aria-current={ pathname.endsWith("/profile") ? "page" : undefined} className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10 active:bg-emerald-900/20 aria-[current='page']:bg-emerald-900/75 aria-[current='page']:text-white aria-[current='page']:hover:text-white" href="profile">  <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/>Profile</Link></li>
                </ul>
            </nav>
            <form className="p-2 w-full mt-auto" method="post" action="/logout">
                <button className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-emerald-900/10 hover:bg-opacity-10" type="submit">
                    <Image src="/cry-svgrepo-com.svg" alt="Cry svgrepo com" width={20} height={20}/>
                    Log Out
                </button>
            </form>
        </aside>
    );
}