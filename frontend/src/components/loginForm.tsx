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
  const onFinish = async (values: LoginRequest) => {
    setLoding(true);
    try {
      const response = await login(values.username, values.password);
      message.success("Login successful!");
      localStorage.setItem("token", response.token);
      window.location.href = "/";
    } catch (error) {
      message.error("Login failed. Please check your credentials.");
    } finally {
      setLoding(false);
    }
  };
  return (
    <Form name="login" onFinish={onFinish}>
      <Form.Item
        name="username"
        rules={[{ required: true, message: "请输入用户名!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名 (admin)" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "请输入密码!" }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码 (123456)" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登 录
        </Button>
      </Form.Item>
    </Form>
  );
};
