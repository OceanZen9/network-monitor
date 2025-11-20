import GetDevices from "@/components/getDevices";
import GetSniff from "@/components/getSniff";
import RealtimeTrafficChart from "@/components/RealtimeTrafficChart";
import HistoricalTrafficTable from "@/components/HistoricalTrafficTable"; // Import the new component
import ThresholdSettings from "@/components/ThresholdSettings"; // Import the threshold component
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
    {
      key: "4", // Add a new key for the historical data tab
      label: "Historical Traffic",
      children: <HistoricalTrafficTable />, // Render the new component here
    },
    {
      key: "5", // Add a new key for the threshold settings tab
      label: "Threshold Settings",
      children: <ThresholdSettings />, // Render the new component here
    },
  ];
  return (
    <div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
}

export default DashBoard;
