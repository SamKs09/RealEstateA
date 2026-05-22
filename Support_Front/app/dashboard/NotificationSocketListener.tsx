import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useNotification } from "@/context/NotificationContext";

export default function NotificationSocketListener() {
  const { socket } = useSocket();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      addNotification({
        id: data.id || Date.now().toString(),
        type: data.type || "message",
        title: data.title || "New Notification",
        body: data.body || "You have a new notification.",
        threadId: data.threadId,
        createdAt: data.createdAt || new Date().toISOString(),
        read: false,
      });
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, addNotification]);

  return null;
}
