import { Card, Tag, Row, Col, Typography, Space } from "antd";
import { LaptopOutlined, IeOutlined, PoweroffOutlined } from "@ant-design/icons";
import { useSocketStore } from "@/store/socketStore";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface HostStatus {
  client_id: string;
  client_name: string;
  type: "System Start" | "System Shut Down" | "IE Start" | "IE Close";
  timestamp: number;
}

interface Client {
  id: string;
  name: string;
  ip: string;
  description: string;
}

const HostStatusPanel = () => {
  const [statuses, setStatuses] = useState<{ [key: string]: HostStatus }>({});
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch configured clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch clients", error);
      }
    };
    fetchClients();
  }, []);

  // Listen for real-time status updates
  useEffect(() => {
    // We need to access the socket instance.
    // Assuming useSocketStore exposes something or we can listen globally.
    // Ideally useSocketStore should have a way to subscribe.
    // If not, we might need to modify store or just rely on 'alert' event but for specific status we added 'host_status'
    
    // For now, let's assume we can attach listener if we had access to socket.
    // Since useSocketStore usually manages connection, we might be able to get socket from it if exposed,
    // or we just define a listener here if the store setup allows.
    
    // BUT the store code seen in App.tsx: const connect = useSocketStore((state) => state.connect);
    // It doesn't show exposing `socket`.
    // However, usually these stores keep a socket instance.
    
    // Let's assume standard socket.io-client usage if store doesn't expose it easily,
    // OR better, we can listen to "alert" and parse it, but we emitted 'host_status'.
    
    // Let's try to get socket from store via a selector if possible, or just hack it:
    // import { socket } from "@/store/socketStore" if it exports instance.
    
    // Actually, let's look at `socketStore` implementation if I could, but I can't see it now.
    // I will write a component that attempts to listen to window event or assumes the store sets up listeners.
    
    // Wait, the backend emits 'host_status'. I need to listen to it.
    // If I can't access socket easily, I might use the window.
    
    // Let's rely on the fact that `App.tsx` calls `connect()`.
    // I can try `import { useSocketStore } from "@/store/socketStore";` and see if it returns `socket`.
    // The previous App.tsx code: `const connect = useSocketStore((state) => state.connect);`
    
    // Alternative: Just poll clients status? No, requirements say "Real-time key".
    
    // Let's add a `socket` getter to the store or assume `useSocketStore.getState().socket` works.
    
    const socket = useSocketStore.getState().socket; 
    if (socket) {
        socket.on("host_status", (data: HostStatus) => {
            setStatuses(prev => ({
                ...prev,
                [data.client_id]: data
            }));
        });
        
        return () => {
            socket.off("host_status");
        };
    }
  }, []);

  const getStatusIcon = (status?: HostStatus) => {
      if (!status) return <PoweroffOutlined style={{ fontSize: 24, color: '#ccc' }} />;
      if (status.type === "System Shut Down") return <PoweroffOutlined style={{ fontSize: 24, color: 'red' }} />;
      if (status.type.includes("System Start")) return <LaptopOutlined style={{ fontSize: 24, color: 'green' }} />;
      return <LaptopOutlined style={{ fontSize: 24, color: 'green' }} />;
  };

  const getIeStatus = (status?: HostStatus) => {
      if (!status) return <Tag>Unknown</Tag>;
      if (status.type === "IE Start") return <Tag color="blue" icon={<IeOutlined />}>IE Running</Tag>;
      if (status.type === "IE Close") return <Tag color="default" icon={<IeOutlined />}>IE Closed</Tag>;
      if (status.type === "System Start") return <Tag color="default">System On</Tag>;
      if (status.type === "System Shut Down") return <Tag color="red">Offline</Tag>;
      return <Tag>{status.type}</Tag>;
  };

  return (
    <Card title="Distributed Hosts Status" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        {clients.map(client => {
            const status = statuses[client.id];
            return (
                <Col key={client.id} span={6}>
                    <Card size="small" hoverable>
                        <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}>
                            {getStatusIcon(status)}
                            <Text strong>{client.name}</Text>
                            <Text type="secondary">{client.ip}</Text>
                            {getIeStatus(status)}
                        </Space>
                    </Card>
                </Col>
            );
        })}
        {clients.length === 0 && <Col span={24}><Text type="secondary">No clients configured.</Text></Col>}
      </Row>
    </Card>
  );
};

export default HostStatusPanel;
