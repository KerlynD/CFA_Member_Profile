import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh bg-neutral-50 text-black">
            <Sidebar />
            <main className="p-4 md:p-6 pt-16 min-w-0 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
                {children}
            </main>
        </div>
    );
}