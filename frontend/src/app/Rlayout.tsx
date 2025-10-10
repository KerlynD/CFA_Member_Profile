export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className="flex">
                <Sidebar />          {/* always visible */}
                <main className="flex-1 p-6">{children}</main>
            </body>
        </html>
    )
}