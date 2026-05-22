"use client";

import { useState, useEffect, useRef } from "react";
import { apiService } from "@/services/api";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  FiSend,
  FiPaperclip,
  FiSmile,
  FiMoreVertical,
  FiPhone,
  FiVideo,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiImage,
  FiX,
} from "react-icons/fi";

interface ChatAreaProps {
  onBack?: () => void;
}

export default function ChatArea({ onBack }: ChatAreaProps) {
  const { selectedThread, messages, setMessages, addMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { joinThread, leaveThread } = useSocket();

  // Join/leave thread room when selected thread changes
  useEffect(() => {
    if (selectedThread?._id) {
      joinThread(selectedThread._id);
      return () => {
        leaveThread(selectedThread._id);
      };
    }
  }, [selectedThread?._id, joinThread, leaveThread]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when thread changes
  useEffect(() => {
    if (selectedThread?._id) {
      loadMessages();
    }
  }, [selectedThread?._id]);

  // Focus input when thread is selected
  useEffect(() => {
    if (selectedThread && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedThread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!selectedThread?._id) return;

    try {
      setLoading(true);
      const response = await apiService.getThreadById(selectedThread._id);
      if (response.success) {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedThread?._id) return;

    try {
      setSending(true);
      const text = newMessage.trim();
      setNewMessage("");

      const response = await apiService.sendMessage(selectedThread._id, {
        type: "text",
        content: { text },
      });

      if (response.success) {
        addMessage(response.data);
      }
    } catch (err) {
      console.error("Error sending message:", err);
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

  const user = getUser();

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
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, "HH:mm");
    } else if (isYesterday(d)) {
      return "Yesterday " + format(d, "HH:mm");
    }
    return format(d, "MMM d, HH:mm");
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};

    messages.forEach((msg) => {
      const date = new Date(msg.createdAt);
      let key = "";

      if (isToday(date)) {
        key = "Today";
      } else if (isYesterday(date)) {
        key = "Yesterday";
      } else {
        key = format(date, "MMMM d, yyyy");
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(msg);
    });

    return groups;
  };

  if (!selectedThread) return null;

  const userName = user?.fullName || "Unknown User";
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 mr-2 text-gray-400 hover:text-white"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
              userName
            )} flex items-center justify-center text-white font-semibold text-sm`}
          >
            {getInitials(userName)}
          </div>

          {/* User Info */}
          <div className="ml-3">
            <h2 className="font-semibold text-white">{userName}</h2>
            <div className="flex items-center text-xs">
              <span
                className={`flex items-center ${
                  selectedThread.status === "active"
                    ? "text-green-500"
                    : "text-gray-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-1 ${
                    selectedThread.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }`}
                ></span>
                {selectedThread.status === "active" ? "Active now" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          {selectedThread.status !== "closed" && (
            <button
              onClick={handleCloseThread}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Resolve</span>
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <FiPhone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <FiVideo className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getAvatarColor(
                  userName
                )} flex items-center justify-center text-white font-bold text-xl`}
              >
                {getInitials(userName)}
              </div>
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-500">
                  {date}
                </span>
              </div>

              {/* Messages for this date */}
              {msgs.map((message: any) => {
                const senderRole = message.sender?.role;
                const isFromSupport =
                  senderRole === "support" || senderRole === "admin";
                const alignRight = isFromSupport;

                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      alignRight ? "justify-end" : "justify-start"
                    } mb-3`}
                  >
                    {/* Avatar for customer messages */}
                    {!alignRight && (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                          userName
                        )} flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0 mt-1`}
                      >
                        {getInitials(userName)}
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] ${
                        alignRight ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          alignRight
                            ? "bg-orange-500 text-white rounded-br-md"
                            : "bg-gray-800 text-gray-100 rounded-bl-md"
                        }`}
                      >
                        {message.type === "text" && message.content && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content.text || message.content}
                          </p>
                        )}
                        {message.type === "image" &&
                          message.content?.mediaUrl && (
                            <img
                              src={message.content.mediaUrl}
                              alt="Attachment"
                              className="max-w-full rounded-lg"
                            />
                          )}
                      </div>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          alignRight ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-xs text-gray-600">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {alignRight && (
                          <FiCheck
                            className={`w-3 h-3 ${
                              message.status === "read"
                                ? "text-blue-400"
                                : "text-gray-600"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {selectedThread.status !== "closed" ? (
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiPaperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiImage className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-gray-800 border-0 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                disabled={sending}
              />
            </div>

            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiSmile className="w-5 h-5" />
            </button>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <FiCheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">This conversation has been resolved</span>
          </div>
        </div>
      )}
    </div>
  );
}
