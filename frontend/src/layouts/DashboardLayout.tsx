import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Typography, Button, Badge, Modal, Space } from "antd";
import { BellOutlined } from '@ant-design/icons';
import { useState } from "react";
import AlertHistory from "../components/AlertHistory";
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../services/api';
import type { Alert } from '../services/api';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function DashBoardLayout() {
  const navigate = useNavigate();
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 30000, // Refetch alerts every 30 seconds
  });

  const unreadAlertCount = alerts?.filter(alert => !alert.is_read).length || 0;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const showAlertModal = () => {
    setIsAlertModalVisible(true);
  };

  const handleAlertModalCancel = () => {
    setIsAlertModalVisible(false);
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
        <Space>
          <Button type="text" onClick={showAlertModal}>
            <Badge count={unreadAlertCount} size="small" offset={[2, 0]}>
              <BellOutlined style={{ color: 'white', fontSize: '20px' }} />
            </Badge>
          </Button>
          <Button type="primary" onClick={handleLogout}>
            Logout
          </Button>
        </Space>
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

      <Modal
        title="Alerts"
        open={isAlertModalVisible}
        onCancel={handleAlertModalCancel}
        footer={null}
        width={800}
      >
        <AlertHistory />
      </Modal>
    </Layout>
  );
}

export default DashBoardLayout;
