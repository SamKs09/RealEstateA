"use client";
import { useNotification } from "@/context/NotificationContext";

export default function NotificationBell() {
  const { notifications, markAllRead } = useNotification();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button className="relative">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unread}
          </span>
        )}
      </button>
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
        <div className="p-2 border-b flex justify-between items-center">
          <span className="font-semibold">Notifications</span>
          <button onClick={markAllRead} className="text-xs text-orange-500">
            Mark all as read
          </button>
        </div>
        <ul>
          {notifications.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">No notifications</li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`p-3 border-b ${
                  n.read ? "bg-gray-50" : "bg-blue-50"
                }`}
              >
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-gray-600">{n.body}</div>
                <div className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
