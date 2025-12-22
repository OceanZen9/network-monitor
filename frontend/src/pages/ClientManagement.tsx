import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Card, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";

interface Client {
  id: string;
  name: string;
  ip: string;
  description: string;
}

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5001/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      message.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingClient) {
        // Update
        const response = await fetch(`http://127.0.0.1:5001/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (response.ok) {
           message.success("Client updated successfully");
        }
      } else {
        // Create
        const response = await fetch("http://127.0.0.1:5001/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (response.ok) {
            message.success("Client created successfully");
        }
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingClient(null);
      fetchClients();
    } catch (error) {
       message.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        message.success("Client deleted successfully");
        fetchClients();
      }
    } catch (error) {
       message.error("Delete failed");
    }
  };

  const openEdit = (client: Client) => {
      setEditingClient(client);
      form.setFieldsValue(client);
      setIsModalOpen(true);
  }

  const openAdd = () => {
      setEditingClient(null);
      form.resetFields();
      setIsModalOpen(true);
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'IP Address', dataIndex: 'ip', key: 'ip' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: Client) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
              <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Client Hosts</h2>
        <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchClients} loading={loading} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
                Add Client
            </Button>
        </Space>
      </div>

      <Card title="Manage Clients">
        <Table columns={columns} dataSource={clients} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingClient ? "Edit Client" : "Add Client"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ip" label="IP Address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

