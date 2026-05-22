"use client";

import { useRouter } from "next/navigation";
import { FiLogOut, FiBarChart2, FiUser } from "react-icons/fi";
import { useState, useEffect } from "react";

interface HeaderProps {
  onShowStats: () => void;
}

export default function Header({ onShowStats }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("supportUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("supportToken");
    localStorage.removeItem("supportUser");
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🏠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Support Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Real Estate Messaging System
            </p>
          </div>
        </div>

        <nav className="flex space-x-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Live Chat
          </button>
          <button
            onClick={() => router.push("/dashboard/tickets")}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Tickets
          </button>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {/* Removed Statistics, User Profile, and Logout - now in Sidebar */}
      </div>
    </header>
  );
}
