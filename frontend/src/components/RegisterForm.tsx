import { useState } from "react";
import { Form, Button, Input, message } from "antd";
import { register } from "@/services/api";
import { AxiosError } from "axios";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [loading, setLoding] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (value: any) => {
    setLoding(true);

    try {
      await register(value.username, value.password);
      messageApi.success("注册成功！请登录。");
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error("Register Error Caught:", err);
      const error = err as AxiosError<{ error: string }>;
      const errorMsg = error.response?.data?.error || "注册失败。请尝试其他用户名。";
      console.log("Error Message to show:", errorMsg);
      messageApi.error(errorMsg);
      form.resetFields(); // Clear form on failure as requested
    } finally {
      setLoding(false);
    }
  };

  return (
    <Form name="register" onFinish={onFinish} layout="vertical" form={form}>
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
      <Form.Item
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请确认您的密码！" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("两次输入的密码不一致！")
              );
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};
