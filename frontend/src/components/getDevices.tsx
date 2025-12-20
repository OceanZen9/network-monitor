import { getDevice } from "@/services/api";
import { useEffect, useState } from "react";
import { Table, Spin, Typography } from "antd";

const { Title } = Typography;

const deviceColumns = [
  {
    title: "ID",
    dataIndex: "id", // 对应你 JSON 里的 "id"
    key: "id",
  },
  {
    title: "名称",
    dataIndex: "name", // 对应 "name"
    key: "name",
  },
  {
    title: "IP 地址",
    dataIndex: "ip", // 对应 "ip"
    key: "ip",
  },
];

export default function GetDevices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDevice();
        setData(response);
      } catch (error) {
        console.error("Error fetching device data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  if (loading) {
    return <Spin tip="正在加载数据..." size="large" fullscreen />;
  }
  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>设备数据:</Title>
      {/* 这就是 antd 的 Table！
        它会自动把你的 'devices' 数组渲染成一个专业表格
      */}
      <Table
        columns={deviceColumns}
        dataSource={data}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
}
