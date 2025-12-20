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
    const [status, setStatus] = useState<'正常' | '高负载' | '过载'>('正常');
    const [lastAlert, setLastAlert] = useState<{message: string, level: string, time: number} | null>(null);

    // Auto-clear alert status after 30 seconds
    useEffect(() => {
        if (lastAlert) {
            const timer = setTimeout(() => {
                const now = Date.now();
                if (now - lastAlert.time > 30000) {
                    setLastAlert(null);
                    setStatus('正常'); 
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
                    setStatus('过载');
                } else if (totalTraffic > 5 * 1024 * 1024) {
                    setStatus('高负载');
                } else {
                    setStatus('正常');
                }
            }
        };

        const handleAlert = (message: { message: string, level: string }) => {
            setLastAlert({
                message: message.message,
                level: message.level,
                time: Date.now()
            });
            setStatus('过载'); // Assuming alerts mean bottleneck/error
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
        <Card title="系统健康与负载状态" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
                <Col span={6}>
                    <Statistic 
                        title="系统状态" 
                        value={status} 
                        valueStyle={{ 
                            color: status === '正常' ? '#3f8600' : (status === '高负载' ? '#faad14' : '#cf1322'),
                            fontWeight: 'bold'
                        }}
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="总发送速率" 
                        value={totalSent / 1024} 
                        precision={2} 
                        suffix="KB/s" 
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="总接收速率" 
                        value={totalRecv / 1024} 
                        precision={2} 
                        suffix="KB/s" 
                    />
                </Col>
                <Col span={6}>
                     {lastAlert && (
                        <AntAlert
                            message="活动告警"
                            description={lastAlert.message}
                            type={lastAlert.level === 'error' ? 'error' : 'warning'}
                            showIcon
                        />
                     )}
                     {!lastAlert && (
                         <div style={{ color: '#8c8c8c', marginTop: 10 }}>无活动告警</div>
                     )}
                </Col>
            </Row>
        </Card>
    );
};

export default SystemHealthPanel;
