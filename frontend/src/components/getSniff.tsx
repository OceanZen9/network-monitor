import { useEffect, useState } from "react";
import { Empty, List, Typography, Alert } from "antd";
import { useSocketStore } from "@/store/socketStore";

const { Title } = Typography;

const MAX_PACKETS = 50;

export default function GetSniff() {
  const [packetSummaries, setPacketSummaries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocketStore();

  useEffect(() => {
    console.log("🔍 嗅探: socket 状态改变, isConnected:", isConnected);

    if (!socket) {
      console.warn("⚠️ 嗅探: 无可用 Socket");
      return;
    }

    console.log("👂 嗅探: 正在设置 new_packet 监听器");

    const handleNewPacket = (message: { summary: string }) => {
      console.log("📦 嗅探: 收到新数据包:", message.summary);

      setPacketSummaries((prev_summaries) => {
        const newPacketSummaries = [message.summary, ...prev_summaries];
        return newPacketSummaries.slice(0, MAX_PACKETS);
      });
    };

    const handleSnifferError = (message: { error: string }) => {
        console.error("❌ 嗅探错误:", message.error);
        setError(message.error);
    };

    socket.off("new_packet");
    socket.off("sniffer_error");

    socket.on("new_packet", handleNewPacket);
    socket.on("sniffer_error", handleSnifferError);

    return () => {
      console.log("🧹 嗅探: 清理监听器");
      socket.off("new_packet", handleNewPacket);
      socket.off("sniffer_error", handleSnifferError);
    };
  }, [socket, isConnected]); // 添加 isConnected 依赖

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginTop: "24px" }}>
        实时数据包嗅探{" "}
        {isConnected ? "(已连接)" : "(已断开)"}
      </Title>

      {error && (
        <Alert
            message="嗅探器错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
        />
      )}

      <List
        header={<div>实时数据包摘要 (最新在前):</div>}
        bordered
        dataSource={packetSummaries}
        renderItem={(item, index) => <List.Item key={index}>{item}</List.Item>}
        style={{ marginTop: "16px", maxHeight: "60vh", overflowY: "auto" }}
        locale={{
          emptyText: <Empty description="等待数据包..." />,
        }}
      />
    </div>
  );
}
