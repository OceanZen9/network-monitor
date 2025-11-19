import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { login } from "@/services/api";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

interface LoginRequest {
  username: string;
  password: string;
}

export const LoginForm = () => {
  const [loading, setLoding] = useState(false);

  const onFinish = async (value: LoginRequest) => {
    setLoding(true);
    try {
      const response = await login(value.username, value.password);
      message.success(response.message);

      // 保存令牌到本地存储
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);

      // 重定向到主页
      window.location.href = "/";
    } catch (error) {
      message.error("Login failed. Check your credentials.");
    } finally {
      setLoding(false);
    }
  };

  return (
    <Form name="login" onFinish={onFinish} layout="vertical">
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};
