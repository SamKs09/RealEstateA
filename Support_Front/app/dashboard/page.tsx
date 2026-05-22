"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore } from "@/store/chatStore";
import NotificationSocketListener from "./NotificationSocketListener";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { selectedThread } = useChatStore();

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    const token = localStorage.getItem("supportToken");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Show chat on mobile when thread is selected
  useEffect(() => {
    if (selectedThread) {
      setShowMobileChat(true);
    }
  }, [selectedThread]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <NotificationSocketListener />
      <div className="h-screen flex bg-gray-900 overflow-hidden">
        {/* Sidebar - Icon navigation */}
        <Sidebar />
        {/* Conversations List */}
        <div
          className={`w-80 flex-shrink-0 ${
            showMobileChat ? "hidden md:flex" : "flex"
          } flex-col bg-gray-800 border-r border-gray-700`}
        >
          <ConversationList />
        </div>
        {/* Chat Area */}
        <div
          className={`flex-1 ${
            !showMobileChat && !selectedThread ? "hidden md:flex" : "flex"
          } flex-col bg-gray-900`}
        >
          {selectedThread ? (
            <ChatArea onBack={() => setShowMobileChat(false)} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Your Messages
                </h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Select a conversation from the list to start chatting with
                  customers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
