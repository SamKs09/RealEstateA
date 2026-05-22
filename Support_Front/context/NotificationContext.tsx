"use client";
import React, { createContext, useContext, useState } from "react";

export type Notification = {
  id: string;
  type: "message" | "ticket";
  title: string;
  body: string;
  threadId?: string;
  createdAt: string;
  read?: boolean;
};

const NotificationContext = createContext<{
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAllRead: () => void;
}>({
  notifications: [],
  addNotification: () => {},
  markAllRead: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (n: Notification) =>
    setNotifications((prev) => [n, ...prev]);
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
