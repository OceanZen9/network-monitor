import { useEffect, useState } from "react";
import { Empty, List, Typography } from "antd";
import { useSocketStore } from "@/store/socketStore";

const { Title } = Typography;

const MAX_PACKETS = 50;

export default function GetSniff() {
  const [packetSummaries, setPacketSummaries] = useState<string[]>([]);
  const { socket, isConnected } = useSocketStore();

  useEffect(() => {
    console.log("🔍 Sniff: socket changed, isConnected:", isConnected);

    if (!socket) {
      console.warn("⚠️ Sniff: No socket available");
      return;
    }

    console.log("👂 Sniff: Setting up new_packet listener");

    const handleNewPacket = (message: { summary: string }) => {
      console.log("📦 Sniff: Received new packet:", message.summary);

      setPacketSummaries((prev_summaries) => {
        const newPacketSummaries = [message.summary, ...prev_summaries];
        return newPacketSummaries.slice(0, MAX_PACKETS);
      });
    };

    socket.off("new_packet");
    socket.on("new_packet", handleNewPacket);

    return () => {
      console.log("🧹 Sniff: Cleaning up new_packet listener");
      socket.off("new_packet", handleNewPacket);
    };
  }, [socket]);
  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginTop: "24px" }}>
        Real-time Packet Sniffer{" "}
        {isConnected ? "(Connected)" : "(Disconnected)"}
      </Title>

      <List
        header={<div>Live Packet Summary (Newest First):</div>}
        bordered
        dataSource={packetSummaries}
        renderItem={(item, index) => <List.Item key={index}>{item}</List.Item>}
        style={{ marginTop: "16px", maxHeight: "60vh", overflowY: "auto" }}
        locale={{
          emptyText: <Empty description="waiting for packets..." />,
        }}
      />
    </div>
  );
}
