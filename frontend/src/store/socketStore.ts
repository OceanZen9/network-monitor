import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface AlertMessage {
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: number;
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  alert: AlertMessage | null;
  connect: () => void;
  disconnect: () => void;
  clearAlert: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  alert: null,
  connect: () => {
    if (get().socket?.connected) {
      console.log("⚠️ Socket 已连接。");
      return;
    }

    console.log("📡 正在尝试连接 socket...");

    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("🔴 未找到认证令牌，Socket 连接中止。");
        return;
    }

    const socket = io("http://127.0.0.1:5001", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // 传递认证令牌供后端验证
      auth: {
        token: token
      }
    });

    // 在附加新的监听器之前清除现有的监听器
    socket.removeAllListeners();

    socket.on("connect", () => {
      console.log("✅ Socket 已连接:", socket.id);
      set({ socket, isConnected: true });
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket 已断开:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket 连接错误:", error.message);
      set({ isConnected: false });
    });

    // 监听来自后端的自定义 'alert' 事件
    socket.on('alert', (data: { message: string, level: 'info' | 'warning' | 'error' }) => {
        console.log(`🚨 收到告警: ${data.message}`);
        set({ alert: { ...data, timestamp: Date.now() } });
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log("🔌 正在断开 Socket...");
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, isConnected: false });
  },
  clearAlert: () => {
      set({ alert: null });
  }
}));
