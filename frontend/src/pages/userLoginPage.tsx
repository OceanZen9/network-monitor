import { Card } from "antd";
import { LoginForm } from "@/components/loginForm";

const layoutStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f0f2f5",
};

const cardStyle: React.CSSProperties = {
  width: 350,
};

function LoginPage() {
  return (
    <div style={layoutStyle}>
      <Card title="网络监测工具登录" style={cardStyle}>
        <LoginForm />
      </Card>
    </div>
  );
}
export default LoginPage;
