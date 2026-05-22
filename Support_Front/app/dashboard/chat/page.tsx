"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import ChatWindow from "@/components/ChatWindow";

type ThreadStatus = "all" | "active" | "closed" | "unassigned";

interface Thread {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  status: string;
  unreadCount: {
    support: number;
    user: number;
  };
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  createdAt: string;
  lastActivityAt: string;
}

interface ThreadStats {
  total: number;
  active: number;
  closed: number;
  unassigned: number;
  open: number;
}

export default function LiveChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [stats, setStats] = useState<ThreadStats | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ThreadStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThreads();
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const response = await apiService.getThreadStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error("Error loading stats:", err);
    }
  };

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (activeTab !== "all") {
        params.status = activeTab;
      }

      const response = await apiService.getThreads(params);

      if (response.success) {
        setThreads(response.data);
      } else {
        setError("Failed to load threads");
      }
    } catch (err: any) {
      console.error("Error loading threads:", err);
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThread(threadId);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unassigned":
        return "bg-red-100 text-red-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "open":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs: { key: ThreadStatus; label: string; count?: number }[] = [
    { key: "all", label: "All", count: stats?.total },
    { key: "active", label: "Active", count: stats?.active },
    { key: "unassigned", label: "Unassigned", count: stats?.unassigned },
    { key: "closed", label: "Closed", count: stats?.closed },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Thread List Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Live Chat</h2>
            <button
              onClick={loadThreads}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-xs">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={loadThreads}
                className="text-blue-600 hover:underline text-sm"
              >
                Try Again
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No conversations found</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread._id}
                onClick={() => handleThreadClick(thread._id)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedThread === thread._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {thread.user.firstName[0]}
                    {thread.user.lastName[0]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {thread.user.firstName} {thread.user.lastName}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(thread.lastActivityAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-2">
                      {thread.subject}
                    </p>

                    {thread.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {thread.lastMessage.text}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          thread.status
                        )}`}
                      >
                        {thread.status}
                      </span>
                      {thread.unreadCount.support > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {thread.unreadCount.support} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex items-center justify-center">
        {selectedThread ? (
          <ChatWindow />
        ) : (
          <div className="text-center text-gray-500">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
            <p className="text-sm">
              Choose a thread from the list to view messages and reply
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
