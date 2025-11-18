import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

let socketInstance: Socket | null = null;

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: () => {
    // ✅ 如果已有实例且已连接，直接返回
    if (socketInstance?.connected) {
      console.log("⚠️ Socket already connected, reusing instance");
      set({ socket: socketInstance, isConnected: true });
      return;
    }

    // ✅ 如果有旧实例但未连接，清理它
    if (socketInstance) {
      console.log("🧹 Cleaning up old disconnected socket");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance = null;
    }

    console.log("📡 Creating new socket connection to http://127.0.0.1:5000");

    const socket = io("http://127.0.0.1:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      set({ socket, isConnected: true });
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      set({ isConnected: false });
    });
    set({ socket, isConnected: false });
  },
  disconnect: () => {
    const currentState = get();

    if (currentState.socket) {
      console.log("🔌 Disconnecting socket...");
      currentState.socket.removeAllListeners();
      currentState.socket.disconnect();
    }

    set({ socket: null, isConnected: false });
  },
}));
