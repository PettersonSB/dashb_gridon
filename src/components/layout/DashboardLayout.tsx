import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const DashboardLayout = () => {
    const [isSidebarPinned, setIsSidebarPinned] = useState(true);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar isPinned={isSidebarPinned} onTogglePin={() => setIsSidebarPinned(!isSidebarPinned)} />
            <div className={`transition-all duration-300 ease-in-out ${isSidebarPinned ? 'ml-64' : 'ml-[72px]'}`}>
                <TopBar />
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
