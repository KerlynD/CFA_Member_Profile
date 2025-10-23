import Image from "next/image";

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <section className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="text-sm text-neutral-500">{label}</div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">{value}</div>
        </section>
    );
}

export default function HomePage() {
    return (
        <div>
            <div className="min-h-dvh bg-neutral-50 p-6">
                <div className="flex flex-row w-full items-center">
                    <h1 className="text-2xl mr-3" >Home </h1>
                    <Image className="" src="/nextjs/shop-svgrepo-com.svg" alt="" width={35} height={35} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {/* Active Status */}
                    <section className="md:col-span-2 bg-white rounded-2xl border shadow-sm p-5">
                        <header className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Active Status</h2>
                            <span className="inline-flex items-center gap-2 text-emerald-700">
<span className="size-2.5 rounded-full bg-emerald-600" /> Active
</span>
                        </header>
                        <p className="text-sm text-neutral-600 mb-4">
                            You are considered active in a week if you have either sent a Slack message or reacted to a Slack message, in that week.
                        </p>


                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-neutral-500 mb-2">This Week (10/19 - 10/25)</div>
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <span className="size-2.5 rounded-full bg-emerald-600" />
                                    <span className="font-medium">Active</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-neutral-500 mb-2">Last 16 Weeks</div>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={
                                                "size-4 rounded-sm " +
                                                (i === 4
                                                    ? "bg-red-500"
                                                    : i % 2 === 0
                                                        ? "bg-emerald-600"
                                                        : "bg-emerald-500")
                                            }
                                            aria-hidden
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Member # */}
                    <StatCard label="Member #" value="7289" />


                    {/* Total Members */}
                    <StatCard label="Total Members" value="14,388" />


                    {/* Events Attended */}
                    <StatCard label="Events Attended" value="3" />






                </div>
            </div>

        </div>
    );
}