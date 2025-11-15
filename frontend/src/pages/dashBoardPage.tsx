import GetDevices from "@/components/getDevices";
import GetSniff from "@/components/getSniff";
import RealtimeTrafficChart from "@/components/RealtimeTrafficChart";
import { Divider, Tabs } from "antd";

const { TabPane } = Tabs;

function DashBoard() {
  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Real-time Traffic" key="1">
          <RealtimeTrafficChart />
        </TabPane>
        <TabPane tab="Device List" key="2">
          <GetDevices />
        </TabPane>
        <TabPane tab="Sniff Packets (Demo)" key="3">
          <GetSniff />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default DashBoard;
