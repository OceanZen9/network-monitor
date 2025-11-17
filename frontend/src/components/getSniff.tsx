import { useEffect, useState } from "react";
import { Empty, List, Typography } from "antd";
import { io } from "socket.io-client";

const { Title } = Typography;

const MAX_PACKETS = 10;

export default function GetSniff() {
  const [packetSummaries, setPacketSummaries] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");

    socket.on("connect", () => {
      console.log("Connected to backend server");
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from backend server");
      setIsConnected(false);
    });

    socket.on("new_packet", (message: { summary: string }) => {
      setPacketSummaries((prev_summaries) => {
        const newPacketSummaries = [message.summary, ...prev_summaries];
        return newPacketSummaries.slice(0, MAX_PACKETS);
      });
    });
    return () => {
      socket.disconnect();
    };
  });
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
