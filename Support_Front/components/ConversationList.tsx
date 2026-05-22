"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { apiService } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { FiSearch, FiFilter, FiMoreVertical, FiCircle } from "react-icons/fi";

export default function ConversationList() {
  const { threads, setThreads, selectedThread, setSelectedThread } =
    useChatStore();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadThreads = async () => {
    console.log("loadThreads called, filter:", filter);
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== "all") {
        params.status = filter;
      }

      console.log("Calling API with params:", params);
      const response = await apiService.getThreads(params);
      console.log("API Response:", response);
      if (response.success) {
        console.log("Threads loaded:", response.data?.length, response.data);
        setThreads(response.data || []);
      } else {
        console.log("API returned success=false:", response);
      }
    } catch (error) {
      console.error("Failed to load threads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [filter]);

  const getUser = (thread: any) => {
    const userParticipant = thread.participants?.find(
      (p: any) => p.role === "user"
    );
    const userData =
      typeof userParticipant?.userId === "object"
        ? userParticipant.userId
        : null;

    // Build fullName if not present but firstName/lastName exist
    if (
      userData &&
      !userData.fullName &&
      (userData.firstName || userData.lastName)
    ) {
      userData.fullName = `${userData.firstName || ""} ${
        userData.lastName || ""
      }`.trim();
    }
    return userData;
  };

  // Get unique users - show only one conversation per user (most recent)
  const getUniqueUserThreads = (threadList: any[]) => {
    if (!threadList || threadList.length === 0) return [];

    const userThreadMap = new Map();

    // Sort by last message timestamp (most recent first)
    const sortedThreads = [...threadList].sort((a, b) => {
      const timeA = a.lastMessage?.timestamp
        ? new Date(a.lastMessage.timestamp).getTime()
        : new Date(a.createdAt || 0).getTime();
      const timeB = b.lastMessage?.timestamp
        ? new Date(b.lastMessage.timestamp).getTime()
        : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // Keep only the most recent thread per user
    sortedThreads.forEach((thread) => {
      const user = getUser(thread);
      // Use user id (could be _id or id), fallback to thread._id
      const oduserId = user?._id || user?.id || thread._id;

      console.log("Thread:", thread._id, "User:", user, "UserId:", oduserId);

      if (oduserId && !userThreadMap.has(oduserId)) {
        userThreadMap.set(oduserId, thread);
      }
    });

    return Array.from(userThreadMap.values());
  };

  const uniqueThreads = getUniqueUserThreads(threads);
  console.log(
    "Threads in store:",
    threads?.length,
    "Unique threads:",
    uniqueThreads?.length
  );

  const filteredThreads = uniqueThreads.filter((thread) => {
    if (!searchQuery) return true;

    const user = getUser(thread);
    const userName = user?.fullName || "";
    const lastMsg = thread.lastMessage?.content || "";

    return (
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "closed":
        return "text-gray-500";
      default:
        return "text-yellow-500";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-teal-500 to-emerald-500",
      "from-orange-500 to-amber-500",
      "from-red-500 to-pink-500",
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            <FiFilter className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-gray-700/50 border-0 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex space-x-2 mt-3">
            {["all", "active", "closed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading && threads.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
              <FiSearch className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">No conversations found</p>
          </div>
        ) : (
          <div className="px-2">
            {filteredThreads.map((thread) => {
              const user = getUser(thread);
              const isSelected = selectedThread?._id === thread._id;
              const userName = user?.fullName || "Unknown User";

              return (
                <div
                  key={thread._id}
                  onClick={() => setSelectedThread(thread)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                    isSelected
                      ? "bg-orange-500/20 border border-orange-500/30"
                      : "hover:bg-gray-700/50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                        userName
                      )} flex items-center justify-center text-white font-semibold text-sm`}
                    >
                      {getInitials(userName)}
                    </div>
                    {/* Online indicator */}
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        thread.status === "active"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-medium truncate ${
                          isSelected ? "text-white" : "text-gray-200"
                        }`}
                      >
                        {userName}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {thread.lastMessage?.timestamp
                          ? formatDistanceToNow(
                              new Date(thread.lastMessage.timestamp),
                              { addSuffix: false }
                            )
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-sm truncate ${
                          thread.unreadCount > 0
                            ? "text-gray-300 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {thread.lastMessage?.content || "No messages yet"}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
