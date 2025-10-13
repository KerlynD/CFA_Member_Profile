import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-dvh bg-neutral-50 text-black">
            <Sidebar />
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}