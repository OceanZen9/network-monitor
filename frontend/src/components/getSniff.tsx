import { getSniff } from "@/services/test";
import { useEffect, useState } from "react";
import { List, Typography } from "antd";

const { Title, Text } = Typography;

interface SniffData {
  status: string;
  packets_found: number;
  summary: string[];
}

export default function GetSniff() {
  const [data, setData] = useState<SniffData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getSniff();
        setData(response);
      } catch (error) {
        console.error("Error fetching sniff data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginTop: "24px" }}>
        Sniff Data from Backend:
      </Title>{" "}
      {data && (
        <>
          <Text strong>Status:</Text>
          <Text>{data.status}</Text>
          <br />
          <Text strong>Packets Found: </Text>
          <Text>{data.packets_found}</Text>

          {/* 用 antd List 来显示那组 "summary" 数组 */}
          <List
            header={<div>Packet Summary:</div>}
            bordered
            dataSource={data.summary}
            renderItem={(item) => <List.Item>{item}</List.Item>}
            style={{ marginTop: "16px" }}
          />
        </>
      )}
    </div>
  );
}
