import { Spin, Typography, Empty, Card } from "antd";
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
  const [detailedTrafficData, setDetailedTrafficData] = useState<
    ChartsDataPoint[]
  >([]);
  const [aggregatedTrafficData, setAggregatedTrafficData] = useState<
    ChartsDataPoint[]
  >([]);

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
      const detailedDataPoints: ChartsDataPoint[] = [];

      const activeRates = message.rates.filter(
        (rate) => rate.bytes_sent_sec > 100 || rate.bytes_recv_sec > 100
      );

      activeRates.forEach((rate) => {
        detailedDataPoints.push({
          time: time,
          value: rate.bytes_sent_sec,
          category: `${rate.interface} - Sent`,
        });
        detailedDataPoints.push({
          time: time,
          value: rate.bytes_recv_sec,
          category: `${rate.interface} - Received`,
        });
      });

      const totalSent = message.rates.reduce(
        (sum, rate) => sum + rate.bytes_sent_sec,
        0
      );
      const totalRecv = message.rates.reduce(
        (sum, rate) => sum + rate.bytes_recv_sec,
        0
      );

      const aggregatedDataPoints: ChartsDataPoint[] = [
        { time, value: totalSent, category: "Total Sent" },
        { time, value: totalRecv, category: "Total Received" },
      ];

      // 更新详细流量数据
      setDetailedTrafficData((prev_data) => {
        const combinedData = [...prev_data, ...detailedDataPoints];
        const slicedData = combinedData.slice(
          -Max_Data_Points * activeRates.length * 2
        );
        return slicedData;
      });
      // 更新聚合流量数据
      setAggregatedTrafficData((prev_data) => {
        const combinedData = [...prev_data, ...aggregatedDataPoints];
        const slicedData = combinedData.slice(-Max_Data_Points * 2);
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

  // 详细流量图表配置
  const detailedConfig = {
    data: detailedTrafficData,
    xField: "time",
    yField: "value",
    colorField: "category", // 改用 colorField
    scale: {
      color: {
        range: [
          "#30BF78",
          "#F4664A",
          "#FAAD14",
          "#6C5CE7",
          "#A29BFE",
          "#74B9FF",
        ],
      },
    },
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

  // 聚合流量图表配置
  const aggregatedConfig = {
    data: aggregatedTrafficData,
    xField: "time",
    yField: "value",
    seriesField: "category",
    scale: {
      color: {
        range: ["#30BF78", "#F4664A"], // 只需要两种颜色
      },
    },
    axis: {
      y: {
        title: {
          text: "Total Bytes per Second",
        },
        labelFormatter: (v: number) => `${(v / 1024).toFixed(1)} KB/s`,
      },
    },
    animate: false,
    smooth: true, // 聚合流量图可以更平滑
    legend: {
      position: "top",
    },
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Spin tip="Connecting to real-time server..." size="large" />
      </div>
    );
  }
  if (isConnected && aggregatedTrafficData.length === 0) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Empty description="No traffic data received yet." />
      </div>
    );
  }
  return (
    <div>
      <Title level={2}>Real-time Traffic Monitor</Title>

      {/* 聚合流量图表 */}
      <Card title="Total Network Traffic" style={{ marginBottom: 24 }}>
        <Line {...aggregatedConfig} />
      </Card>

      {/* 详细流量图表 */}
      <Card title="Detailed Interface Traffic (Active Interfaces Only)">
        {detailedTrafficData.length > 0 ? (
          <Line {...detailedConfig} />
        ) : (
          <Empty
            description="No active interfaces"
            style={{ padding: "40px 0" }}
          />
        )}
      </Card>
    </div>
  );
}
