import { Tabs, Card } from "antd";
import { useState } from "react";
import { LoginForm } from "@/components/loginForm";
import { RegisterForm } from "@/components/RegisterForm";

const layoutStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f0f2f5",
};

const cardStyle: React.CSSProperties = {
  width: 400,
};

function UserLoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  const items = [
    {
      key: "login",
      label: "登录",
      children: <LoginForm />,
    },
    {
      key: "register",
      label: "注册",
      children: <RegisterForm onSuccess={() => setActiveTab("login")} />,
    },
  ];
  return (
    <div style={layoutStyle}>
      <Card style={cardStyle} className="login-card">
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          Network Monitor
        </h2>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={items}
        />
      </Card>
    </div>
  );
}
export default UserLoginPage;
