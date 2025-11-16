import { Spin, Typography, Empty } from "antd";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Line } from "@ant-design/charts";

const { Title } = Typography;

interface TrafficRate {
  if_name: string;
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
  const [isConneted, setIsConneted] = useState<boolean>(false);
  const [trafficData, setTrafficData] = useState<ChartsDataPoint[]>([]);
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to backend server");
      setIsConneted(true);
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from backend server");
      setIsConneted(false);
    });

    socket.on("traffic_data", (message: { rates: TrafficRate[] }) => {
      const time = new Date().toLocaleTimeString();
      const newDataPoints: ChartsDataPoint[] = [];
      message.rates.forEach((rate) => {
        newDataPoints.push({
          time: time,
          value: rate.bytes_sent_sec,
          category: `${rate.if_name} - Sent`,
        });
        newDataPoints.push({
          time: time,
          value: rate.bytes_recv_sec,
          category: `${rate.if_name} - Received`,
        });
      });

      setTrafficData((prev_data) => {
        const combinedData = [...prev_data, ...newDataPoints];
        const slicedData = combinedData.slice(
          -Max_Data_Points * message.rates.length * 2
        );
        return slicedData;
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const config = {
    data: trafficData,
    xFilled: "time",
    yFilled: "value",
    seriesFilled: "category",
    yAxis: {
      title: {
        text: "Bytes per Second",
      },
      label: {
        formatter: (v: number) => `${(v / 1024).toFixed(1)} KB/s`,
      },
    },
    legend: {
      position: "top",
    },
    smooth: true,
    animation: {
      appear: {
        animation: false,
      },
      update: {
        animation: false,
      },
    },
  };
  if (!isConneted) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Spin tip="Connecting to real-time server..." size="large" />
      </div>
    );
  }
  if (isConneted && trafficData.length === 0) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Empty description="No traffic data received yet." />
      </div>
    );
  }
  return (
    <div>
      <Title level={2}>Real-time Traffic Monito</Title>
      <Line {...config} />
    </div>
  );
}
