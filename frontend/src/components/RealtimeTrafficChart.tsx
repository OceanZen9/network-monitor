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
    console.log("🔍 图表: Socket 状态以改变, isConnected:", isConnected);

    if (!socket) {
      console.warn("⚠️ 图表:无可用 Socket");
      return;
    }

    console.log("👂 Chart: 正在设置 traffic_data 监听器");

    const handleTrafficData = (message: { rates: TrafficRate[] }) => {
      // console.log("📊 Chart: Received traffic data:", message);

      const time = new Date().toLocaleTimeString();
      const detailedDataPoints: ChartsDataPoint[] = [];

      const activeRates = message.rates.filter(
        (rate) => rate.bytes_sent_sec > 100 || rate.bytes_recv_sec > 100
      );

      activeRates.forEach((rate) => {
        detailedDataPoints.push({
          time: time,
          value: rate.bytes_sent_sec,
          category: `${rate.interface} - 发送`,
        });
        detailedDataPoints.push({
          time: time,
          value: rate.bytes_recv_sec,
          category: `${rate.interface} - 接收`,
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
        { time, value: totalSent, category: "总发送" },
        { time, value: totalRecv, category: "总接收" },
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
      console.log("🧹 图表: 清理 traffic_data 监听器");
      socket.off("traffic_data", handleTrafficData);
    };
  }, [socket, isConnected]); // 添加 isConnected 依赖

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
          text: "字节/秒",
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
          text: "总字节/秒",
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
        <Spin tip="正在连接到实时服务器..." size="large" />
      </div>
    );
  }
  if (isConnected && aggregatedTrafficData.length === 0) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Empty description="尚未收到流量数据。" />
      </div>
    );
  }
  return (
    <div>
      <Title level={2}>实时流量监控</Title>

      {/* 聚合流量图表 */}
      <Card title="总网络流量" style={{ marginBottom: 24 }}>
        <Line {...aggregatedConfig} />
      </Card>

      {/* 详细流量图表 */}
      <Card title="详细接口流量 (仅显示活动接口)">
        {detailedTrafficData.length > 0 ? (
          <Line {...detailedConfig} />
        ) : (
          <Empty
            description="无活动接口"
            style={{ padding: "40px 0" }}
          />
        )}
      </Card>
    </div>
  );
}
