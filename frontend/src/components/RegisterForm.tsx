import { useState } from "react";
import { Form, Button, Input, message } from "antd";
import { register } from "@/services/api";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [loading, setLoding] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (value: any) => {
    setLoding(true);

    try {
      await register(value.username, value.password);
      message.success("Registration successful! Please log in.");
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error("Registration failed. Try a different username.");
    } finally {
      setLoding(false);
    }
  };

  return (
    <Form name="register" onFinish={onFinish} layout="vertical" form={form}>
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
      <Form.Item
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Please confirm your Password!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("The two passwords do not match!")
              );
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirm Password"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};
