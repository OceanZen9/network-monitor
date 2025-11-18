import { Spin, Typography, Empty } from "antd";
import { useState, useEffect } from "react";
import { Line } from "@ant-design/charts";
import { useSocketStore } from "@/store/socketStore";

const { Title } = Typography;

interface TrafficRate {
  interface: string;
  bytes_sent_sec: number;
  bytes_recv_sec: number;
}

interface ChartsDataPoint {
  time: string;
  value: number;
  category: string;
}

const Max_Data_Points = 60;

export default function RealtimeTrafficChart() {
  const { socket, isConnected } = useSocketStore();
  const [trafficData, setTrafficData] = useState<ChartsDataPoint[]>([]);

  useEffect(() => {
    console.log("🔍 Chart: socket changed, isConnected:", isConnected);

    if (!socket) {
      console.warn("⚠️ Chart: No socket available");
      return;
    }

    console.log("👂 Chart: Setting up traffic_data listener");

    const handleTrafficData = (message: { rates: TrafficRate[] }) => {
      console.log("📊 Chart: Received traffic data:", message);

      const time = new Date().toLocaleTimeString();
      const newDataPoints: ChartsDataPoint[] = [];

      message.rates.forEach((rate) => {
        newDataPoints.push({
          time: time,
          value: rate.bytes_sent_sec,
          category: `${rate.interface} - Sent`,
        });
        newDataPoints.push({
          time: time,
          value: rate.bytes_recv_sec,
          category: `${rate.interface} - Received`,
        });
      });

      setTrafficData((prev_data) => {
        const combinedData = [...prev_data, ...newDataPoints];
        const slicedData = combinedData.slice(
          -Max_Data_Points * message.rates.length * 2
        );
        return slicedData;
      });
    };

    socket.off("traffic_data");
    socket.on("traffic_data", handleTrafficData);

    return () => {
      console.log("🧹 Chart: Cleaning up traffic_data listener");
      socket.off("traffic_data", handleTrafficData);
    };
  }, [socket]);

  const config = {
    data: trafficData,
    xField: "time",
    yField: "value",
    seriesField: "category",
    scale: { color: { range: ["#30BF78", "#F4664A", "#FAAD14"] } },
    axis: {
      y: {
        title: {
          text: "Bytes per Second",
        },
        labelFormatter: (v: number) => `${(v / 1024).toFixed(1)} KB/s`,
      },
    },
    animate: false,
  };
  if (!isConnected) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Spin tip="Connecting to real-time server..." size="large" />
      </div>
    );
  }
  if (isConnected && trafficData.length === 0) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Empty description="No traffic data received yet." />
      </div>
    );
  }
  return (
    <div>
      <Title level={2}>Real-time Traffic Monitor</Title>
      <Line {...config} />
    </div>
  );
}
