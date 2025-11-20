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
      console.log("⚠️ Socket already connected.");
      return;
    }

    console.log("📡 Attempting to connect socket...");
    
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("🔴 No auth token found, socket connection aborted.");
        return;
    }

    const socket = io("http://127.0.0.1:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // Pass auth token for backend verification
      auth: {
        token: token
      }
    });

    // Clear existing listeners before attaching new ones
    socket.removeAllListeners();

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

    // Listen for custom 'alert' events from the backend
    socket.on('alert', (data: { message: string, level: 'info' | 'warning' | 'error' }) => {
        console.log(`🚨 ALERT RECEIVED: ${data.message}`);
        set({ alert: { ...data, timestamp: Date.now() } });
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log("🔌 Disconnecting socket...");
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, isConnected: false });
  },
  clearAlert: () => {
      set({ alert: null });
  }
}));
