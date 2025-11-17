import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  connect: () => {
    set((state) => {
      if (state.socket && state.isConnected) {
        console.log("⚠️ Socket already exists");
        return state;
      }
      if (state.socket) {
        console.log("🧹 Cleaning up old socket");
        state.socket.disconnect();
      }
      const socket = io("http://127.0.0.1:5000");
      console.log("📡 Creating new socket connection");
      socket.on("connect", () => {
        console.log("Connected to backend server");
        set({ isConnected: true });
      });
      socket.on("disconnect", () => {
        console.log("Disconnected from backend server");
        set({ isConnected: false });
      });
      return { socket };
    });
  },
  disconnect: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null, isConnected: false };
    });
  },
}));
