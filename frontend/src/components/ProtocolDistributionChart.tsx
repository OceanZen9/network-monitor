// frontend/src/components/ProtocolDistributionChart.tsx
import { Pie } from '@ant-design/charts';
import { useSocketStore } from '../store/socketStore';
import { useEffect, useState } from 'react';
import { Card } from 'antd';

interface ProtocolData {
  type: string;
  value: number;
}

const ProtocolDistributionChart = () => {
  const [data, setData] = useState<ProtocolData[]>([]);
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    const handleProtocolCounts = (protocolInfo: { 
      counts: Record<string, number>,
      percentages: Record<string, number> 
    }) => {
      if (!protocolInfo || !protocolInfo.counts) {
        setData([]);
        return;
      }
      const protocolData = Object.entries(protocolInfo.counts).map(([key, value]) => ({
        type: key,
        value: value,
      }));
      setData(protocolData);
    };

    socket.on('protocol_counts', handleProtocolCounts);

    return () => {
      socket.off('protocol_counts', handleProtocolCounts);
    };
  }, [socket]);

  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    interactions: [{ type: 'element-active' }],
    // Add a tooltip
    tooltip: {
      formatter: (datum: ProtocolData) => {
        return { name: datum.type, value: `${datum.value} 数据包` };
      },
    },
  };

  return (
    <Card title="协议分布">
      {data.length > 0 ? <Pie {...config} /> : '暂无数据显示'}
    </Card>
  );
};

export default ProtocolDistributionChart;
