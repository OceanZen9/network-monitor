import { Layout, Menu, Typography } from "antd";
import React from "react";

import GetDevices from "@/components/getDevices";
import GetSniff from "@/components/getSniff";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#001529",
        }}
      >
        <Title style={{ color: "white", margin: 0 }} level={3}>
          网络性能检测工具
        </Title>
      </Header>

      <Content style={{ padding: "0 48px" }}>
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280,
            marginTop: "24px",
          }}
        >
          <GetDevices />
          <GetSniff />
        </div>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        网络系统实践 ©{new Date().getFullYear()} Created by OceanZen
      </Footer>
    </Layout>
  );
}

export default App;
