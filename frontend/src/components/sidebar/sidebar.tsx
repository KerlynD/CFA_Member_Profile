"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            const isSmallScreen = screenWidth < 1024; // Collapse on smaller screens

            setIsSmallScreen(isSmallScreen);

            // Auto-collapse on small screens, but allow manual control on larger screens
            if (isSmallScreen) {
                setIsCollapsed(true);
            }
        };

        // Run on mount and resize
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Update CSS custom property for sidebar width
    useEffect(() => {
        const sidebarWidth = isCollapsed || isSmallScreen ? '0px' : '250px';
        document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    }, [isCollapsed, isSmallScreen]);

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

    const navigationItems = [
        { href: "/dashboard/directory", label: "Directory", icon: "/assets/directory.svg", alt: "Directory icon" },
        { href: "/dashboard/events", label: "Events", icon: "/assets/events.svg", alt: "Events icon" },
        { href: "/dashboard/offers", label: "Offers", icon: "/assets/money-check.svg", alt: "Offers icon" },
        { href: "/dashboard/leetcodeleaderboard", label: "Leaderboard", icon: "/assets/leetcode.svg", alt: "LeetCode icon" },
        { href: "/dashboard/profile", label: "Profile", icon: "/assets/profile.svg", alt: "Profile icon" },
    ];

    const NavLink = ({ href, label, icon, alt }: { href: string; label: string; icon: string; alt: string }) => (
        <Link
            aria-current={pathname.endsWith(href.split('/').pop() || '') ? "page" : undefined}
            className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100 active:bg-gray-200 aria-[current='page']:bg-gradient-to-r aria-[current='page']:from-gray-900 aria-[current='page']:to-gray-700 aria-[current='page']:text-white aria-[current='page']:hover:text-white"
            href={href}
            onClick={() => setIsMobileMenuOpen(false)}
        >
            <Image src={icon} alt={alt} width={20} height={20} className="flex-shrink-0" style={{ width: '20px', height: '20px' }} />
            {label}
        </Link>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-40 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src="/assets/codeforall.svg" alt="Code for All logo" width={24} height={24} className="flex-shrink-0" style={{ width: '24px', height: '24px' }} />
                    <span className="text-lg font-semibold">Code for All</span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu */}
            <aside className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-6 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <Image src="/assets/codeforall.svg" alt="Code for All logo" width={24} height={24} className="flex-shrink-0" style={{ width: '24px', height: '24px' }} />
                            <span className="text-lg font-semibold">Code for All</span>
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1">
                        <ul className="flex flex-col gap-1">
                            {navigationItems.map((item) => (
                                <li key={item.href}>
                                    <NavLink {...item} />
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="mt-auto">
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                            }}
                            className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100 active:bg-gray-200"
                            type="button"
                        >
                            <Image src="/assets/logout.svg" alt="Logout icon" width={20} height={20} style={{ width: 'auto', height: 'auto' }} />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex fixed top-0 left-0 h-screen flex-col items-start gap-4 overflow-y-auto overflow-x-hidden border-r border-r-gray-200 text-xl bg-white transition-all duration-300 ease-in-out z-30 ${
                isCollapsed ? 'w-0 p-0 border-r-0' : 'w-[250px] p-6'
            }`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`fixed top-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition ${
                        isCollapsed ? 'left-4' : 'left-[226px]'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isCollapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        )}
                    </svg>
                </button>
                <div className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <Image src="/assets/codeforall.svg" alt="Code for All logo" width={24} height={24} className="flex-shrink-0" style={{ width: '24px', height: '24px' }} />
                    <Link href="/dashboard" className="text-lg font-semibold">
                        Code for All
                    </Link>
                </div>
                <nav className={`w-full p-2 mt-5 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <ul className="flex flex-col gap-1">
                        {navigationItems.map((item) => (
                            <li key={item.href}>
                                <NavLink {...item} />
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className={`p-2 w-full mt-auto ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <button
                        onClick={handleLogout}
                        className="box-border flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100 active:bg-gray-200"
                        type="button"
                    >
                        <Image src="/assets/logout.svg" alt="Logout icon" width={20} height={20} style={{ width: 'auto', height: 'auto' }} />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}