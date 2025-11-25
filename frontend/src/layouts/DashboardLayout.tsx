import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Typography, Button } from "antd";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function DashBoardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

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
        <Button type="primary" onClick={handleLogout}>
          Logout
        </Button>
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
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        网络系统实践 ©{new Date().getFullYear()} Created by OceanZen
      </Footer>
    </Layout>
  );
}

export default DashBoardLayout;
