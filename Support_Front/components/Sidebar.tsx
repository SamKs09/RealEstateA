"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiBarChart2,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

type UserData = {
  name?: string;
  email?: string;
  role?: string;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  /* ---------------- LOAD STATE ---------------- */
  useEffect(() => {
    const user = localStorage.getItem("supportUser");
    if (user) setUserData(JSON.parse(user));

    const saved = localStorage.getItem("sidebarExpanded");
    if (saved) setIsExpanded(saved === "true");
  }, []);

  const toggleSidebar = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("sidebarExpanded", String(next));
  };

  const handleLogout = () => {
    localStorage.removeItem("supportToken");
    localStorage.removeItem("supportUser");
    router.push("/login");
  };

  const getInitials = () => {
    if (userData?.name) {
      const parts = userData.name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts.at(-1)?.[0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    if (userData?.email) return userData.email.slice(0, 2).toUpperCase();
    return "SU";
  };

  const navItems = [
    {
      id: "messages",
      label: "Messages",
      icon: FiMessageSquare,
      route: "/dashboard",
    },
    {
      id: "customers",
      label: "Customers",
      icon: FiUsers,
      route: "/dashboard/customers",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: FiBarChart2,
      route: "/dashboard/analytics",
    },
    {
      id: "help",
      label: "Help Center",
      icon: FiHelpCircle,
      route: "/dashboard/help",
    },
  ];

  const isActive = (route: string) =>
    route === "/dashboard" ? pathname === route : pathname?.startsWith(route);

  /* ---------------- JSX ---------------- */
  return (
    <aside
      className={`${
        isExpanded ? "w-64" : "w-20"
      } bg-slate-900 border-r border-slate-700 h-screen transition-all duration-300 flex flex-col relative overflow-hidden`}
    >
      {/* Toggle */}
      <div className="p-2 flex justify-end">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-all"
        >
          {isExpanded ? (
            <FiChevronLeft className="w-5 h-5" />
          ) : (
            <FiChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pt-2 space-y-2 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 transition ${
                active
                  ? "bg-orange-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              } ${!isExpanded && "justify-center px-0"}`}
            >
              <item.icon className="w-5 h-5" />
              {isExpanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}

        {/* Settings */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 transition text-slate-400 hover:bg-slate-800 hover:text-white ${
            !isExpanded && "justify-center px-0"
          } ${
            pathname?.startsWith("/dashboard/settings") &&
            "bg-orange-600 text-white"
          }`}
        >
          <FiSettings className="w-5 h-5" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 transition text-red-400 hover:bg-red-500/10 ${
            !isExpanded && "justify-center px-0"
          }`}
        >
          <FiLogOut className="w-5 h-5" />
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </nav>

      {/* User Profile */}
      <div className="px-2 py-3 border-t border-slate-700 flex-shrink-0 bg-slate-900">
        <div
          onClick={() => router.push("/dashboard/profile")}
          className={`flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition ${
            !isExpanded && "justify-center px-0"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {getInitials()}
          </div>

          {isExpanded && (
            <div className="overflow-hidden">
              <div className="text-white text-sm truncate font-medium">
                {userData?.name || "Support User"}
              </div>
              <div className="text-slate-400 text-xs truncate">
                {userData?.role || "Support Agent"}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
