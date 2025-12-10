import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Alert as AntAlert } from 'antd';
import { useSocketStore } from "@/store/socketStore";

interface TrafficRate {
  interface: string;
  bytes_sent_sec: number;
  bytes_recv_sec: number;
}

const SystemHealthPanel: React.FC = () => {
    const { socket, isConnected } = useSocketStore();
    const [totalSent, setTotalSent] = useState(0);
    const [totalRecv, setTotalRecv] = useState(0);
    const [status, setStatus] = useState<'Normal' | 'High Load' | 'Overload'>('Normal');
    const [lastAlert, setLastAlert] = useState<{message: string, level: string, time: number} | null>(null);

    // Auto-clear alert status after 30 seconds
    useEffect(() => {
        if (lastAlert) {
            const timer = setTimeout(() => {
                const now = Date.now();
                if (now - lastAlert.time > 30000) {
                    setLastAlert(null);
                    setStatus('Normal'); 
                }
            }, 5000); // Check every 5s
            return () => clearTimeout(timer);
        }
    }, [lastAlert]);

    useEffect(() => {
        if (!socket) return;

        const handleTrafficData = (message: { rates: TrafficRate[] }) => {
            const sent = message.rates.reduce((sum, r) => sum + r.bytes_sent_sec, 0);
            const recv = message.rates.reduce((sum, r) => sum + r.bytes_recv_sec, 0);
            
            setTotalSent(sent);
            setTotalRecv(recv);

            // Simple load heuristic if no alert
            if (!lastAlert) {
                // Example threshold: 10MB/s = 10 * 1024 * 1024
                const totalTraffic = sent + recv;
                if (totalTraffic > 10 * 1024 * 1024) {
                    setStatus('Overload');
                } else if (totalTraffic > 5 * 1024 * 1024) {
                    setStatus('High Load');
                } else {
                    setStatus('Normal');
                }
            }
        };

        const handleAlert = (message: { message: string, level: string }) => {
            setLastAlert({
                message: message.message,
                level: message.level,
                time: Date.now()
            });
            setStatus('Overload'); // Assuming alerts mean bottleneck/error
        };

        socket.on('traffic_data', handleTrafficData);
        socket.on('alert', handleAlert);

        return () => {
            socket.off('traffic_data', handleTrafficData);
            socket.off('alert', handleAlert);
        };
    }, [socket, lastAlert]);

    if (!isConnected) {
        return <Card loading size="small" style={{ marginBottom: 16 }} />;
    }

    return (
        <Card title="System Health & Load Status" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
                <Col span={6}>
                    <Statistic 
                        title="System Status" 
                        value={status} 
                        valueStyle={{ 
                            color: status === 'Normal' ? '#3f8600' : (status === 'High Load' ? '#faad14' : '#cf1322'),
                            fontWeight: 'bold'
                        }}
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="Total Outgoing" 
                        value={totalSent / 1024} 
                        precision={2} 
                        suffix="KB/s" 
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="Total Incoming" 
                        value={totalRecv / 1024} 
                        precision={2} 
                        suffix="KB/s" 
                    />
                </Col>
                <Col span={6}>
                     {lastAlert && (
                        <AntAlert
                            message="Alert Active"
                            description={lastAlert.message}
                            type={lastAlert.level === 'error' ? 'error' : 'warning'}
                            showIcon
                        />
                     )}
                     {!lastAlert && (
                         <div style={{ color: '#8c8c8c', marginTop: 10 }}>No active alerts</div>
                     )}
                </Col>
            </Row>
        </Card>
    );
};

export default SystemHealthPanel;
