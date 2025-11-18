import GetDevices from "@/components/getDevices";
import GetSniff from "@/components/getSniff";
import RealtimeTrafficChart from "@/components/RealtimeTrafficChart";
import { Tabs } from "antd";

function DashBoard() {
  const items = [
    {
      key: "1",
      label: "Real-time Traffic",
      children: <RealtimeTrafficChart />,
    },
    {
      key: "2",
      label: "Device List",
      children: <GetDevices />,
    },
    {
      key: "3",
      label: "Sniff Packets",
      children: <GetSniff />,
    },
  ];
  return (
    <div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}

export default DashBoard;
