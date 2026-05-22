"use client";

import { useState, useEffect, useRef } from "react";
import { apiService } from "@/services/api";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { formatDistanceToNow } from "date-fns";
import { FiSend, FiCheckCircle } from "react-icons/fi";

export default function ChatWindow() {
  const { selectedThread, messages, setMessages, addMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { joinThread, leaveThread } = useSocket();

  // Join/leave thread room when selected thread changes
  useEffect(() => {
    if (selectedThread?._id) {
      console.log("Joining thread room:", selectedThread._id);
      joinThread(selectedThread._id);

      return () => {
        console.log("Leaving thread room:", selectedThread._id);
        leaveThread(selectedThread._id);
      };
    }
  }, [selectedThread?._id, joinThread, leaveThread]);

  // Scroll to bottom when messages change (real-time updates handled by useSocket hook)
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedThread?._id) {
      console.log("Selected thread ID:", selectedThread._id);
      loadMessages();
    } else {
      console.log("No thread ID available, selectedThread:", selectedThread);
    }
  }, [selectedThread?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!selectedThread?._id) {
      console.error("Cannot load messages: No thread ID");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading messages for thread:", selectedThread._id);
      const response = await apiService.getThreadById(selectedThread._id);

      console.log("Thread response:", response);

      if (response.success) {
        setMessages(response.data.messages || []);
      } else {
        console.error("Failed to load messages:", response);
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending || !selectedThread?._id) return;

    try {
      setSending(true);

      console.log("Sending message to thread:", selectedThread._id);
      const response = await apiService.sendMessage(selectedThread._id, {
        type: "text",
        content: { text: newMessage.trim() },
      });

      console.log("Send message response:", response);

      if (response.success) {
        addMessage(response.data);
        setNewMessage("");
      } else {
        alert(
          "Failed to send message: " + (response.message || "Unknown error")
        );
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(
        "Failed to send message: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSending(false);
    }
  };

  const handleCloseThread = async () => {
    if (!selectedThread?._id) return;
    if (!confirm("Are you sure you want to close this conversation?")) return;

    try {
      await apiService.updateThreadStatus(selectedThread._id, "closed");
      loadMessages();
    } catch (err) {
      console.error("Error closing thread:", err);
      alert("Failed to close conversation");
    }
  };

  const getUser = () => {
    if (!selectedThread) return null;
    const userParticipant = selectedThread.participants?.find(
      (p: any) => p.role === "user"
    );
    const userData: any =
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

  if (!selectedThread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-sm">
            Choose a thread from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  const user = getUser();
  console.log("ChatWindow user:", user);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold">
            {user?.firstName?.charAt(0) || user?.fullName?.charAt(0) || "?"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user?.firstName || user?.lastName
                ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                : user?.fullName || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500">{user?.email || ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedThread.status !== "closed" && (
            <button
              onClick={handleCloseThread}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              Close Thread
            </button>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              selectedThread.status === "active"
                ? "bg-green-100 text-green-800"
                : selectedThread.status === "closed"
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {selectedThread.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((message: any) => {
            // Determine if message is from support/admin based on sender's role
            // Support dashboard: Support messages on RIGHT, Customer messages on LEFT
            const senderRole = message.sender?.role;

            // Check if sender is support or admin by role
            const isFromSupport =
              senderRole === "support" || senderRole === "admin";

            // If role is "user", it's definitely from customer (LEFT side)
            // If role is "support" or "admin", it's from support (RIGHT side)
            // This is the support dashboard, so support = right, customer = left
            const alignRight = isFromSupport;

            const senderName =
              typeof message.sender?.userId === "object"
                ? `${message.sender.userId.firstName || ""} ${
                    message.sender.userId.lastName || ""
                  }`.trim()
                : senderRole === "user"
                ? user?.fullName || "Customer"
                : "Support";

            return (
              <div
                key={message._id}
                className={`flex ${
                  alignRight ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    alignRight ? "order-2" : "order-1"
                  }`}
                >
                  {!alignRight && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">
                      {senderName}
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      alignRight
                        ? "bg-primary text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    {message.type === "text" && message.content && (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content.text || message.content}
                      </p>
                    )}
                    {message.type === "image" && message.content?.mediaUrl && (
                      <img
                        src={message.content.mediaUrl}
                        alt="Attachment"
                        className="max-w-full rounded"
                      />
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                      alignRight ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {alignRight && message.status && (
                      <span className="capitalize"> {message.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {selectedThread.status !== "closed" ? (
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiSend className="w-4 h-4" />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-center text-gray-500 text-sm">
            This conversation is closed
          </p>
        </div>
      )}
    </div>
  );
}
