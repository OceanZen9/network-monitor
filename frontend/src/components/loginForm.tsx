import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { login } from "@/services/api";
import { AxiosError } from "axios";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

interface LoginRequest {
  username: string;
  password: string;
}

export const LoginForm = () => {
  const [loading, setLoding] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (value: LoginRequest) => {
    setLoding(true);
    try {
      const response = await login(value.username, value.password);
      messageApi.success(response.message);

      // 保存令牌到本地存储
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);

      // 重定向到主页
      setTimeout(() => {
         window.location.href = "/";
      }, 500); // Give user a moment to see the success message
    } catch (err) {
      console.error("Login Error Caught:", err);
      const error = err as AxiosError<{ error: string }>;
      const errorMsg = error.response?.data?.error || "登录失败。请检查您的凭据。";
      console.log("Login Error Message to show:", errorMsg);
      messageApi.error(errorMsg);
    } finally {
      setLoding(false);
    }
  };

  return (
    <Form name="login" onFinish={onFinish} layout="vertical">
      {contextHolder}
      <Form.Item
        name="username"
        rules={[{ required: true, message: "请输入您的用户名！" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "请输入您的密码！" }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};
