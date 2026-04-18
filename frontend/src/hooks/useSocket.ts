import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Alert, Trend, NewsItem, SystemStatus } from "../services/api";

/** Socket 事件回调类型 */
interface SocketCallbacks {
  onAlert?: (alert: Alert) => void;
  onTrendUpdate?: (trends: Trend[]) => void;
  onNewsStream?: (news: NewsItem) => void;
  onSystemStatus?: (status: SystemStatus) => void;
}

/**
 * Socket.IO 连接 Hook
 * 自动连接同源地址（通过 Vite proxy 转发），监听实时事件
 */
export function useSocket(callbacks: SocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    console.log("[Socket] 开始连接...");
    const socket = io({
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[Socket] 已连接:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[Socket] 已断开:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] 连接错误:", error);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[Socket] 重连尝试:", attemptNumber);
    });

    socket.on("reconnect_error", (error) => {
      console.error("[Socket] 重连错误:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("[Socket] 重连失败");
    });

    socket.on("alert:new", (data: { alert: Alert }) => {
      callbacksRef.current.onAlert?.(data.alert);
    });

    socket.on("trend:update", (data: { trends: Trend[] }) => {
      callbacksRef.current.onTrendUpdate?.(data.trends);
    });

    socket.on("news:stream", (data: { news: NewsItem }) => {
      callbacksRef.current.onNewsStream?.(data.news);
    });

    socket.on("system:status", (data: { status: string }) => {
      callbacksRef.current.onSystemStatus?.(data as unknown as SystemStatus);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, emit };
}
