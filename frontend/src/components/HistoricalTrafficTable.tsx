import React, { useEffect, useState } from 'react';
import { Table, Pagination, Spin, Alert, Card, Typography } from 'antd';
import api from '../services/api'; // Assuming api.ts is already configured for axios

const { Title } = Typography;

interface TrafficData {
  id: number;
  interface: string;
  bytes_sent: number;
  bytes_recv: number;
  created_at: string;
}

interface PaginationData {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

const HistoricalTrafficTable: React.FC = () => {
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // Default page size

  useEffect(() => {
    const fetchHistoricalTraffic = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/history/traffic', {
          params: {
            page: currentPage,
            per_page: pageSize,
            // Add start_time and end_time filtering here if needed
          },
        });
        setTraffic(response.data.traffic);
        setPagination({
          total_items: response.data.total_items,
          total_pages: response.data.total_pages,
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          has_next: response.data.has_next,
          has_prev: response.data.has_prev,
        });
      } catch (err) {
        setError('Failed to fetch historical traffic data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalTraffic();
  }, [currentPage, pageSize]); // Re-fetch when page or pageSize changes

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Interface',
      dataIndex: 'interface',
      key: 'interface',
    },
    {
      title: 'Bytes Sent (per sec)',
      dataIndex: 'bytes_sent',
      key: 'bytes_sent',
      render: (text: number) => `${text} B/s`,
    },
    {
      title: 'Bytes Received (per sec)',
      dataIndex: 'bytes_recv',
      key: 'bytes_recv',
      render: (text: number) => `${text} B/s`,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
  };

  if (loading) {
    return <Spin tip="Loading historical data..." size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <Card style={{ margin: '20px 0' }}>
      <Title level={4}>Historical Traffic Data</Title>
      <Table
        columns={columns}
        dataSource={traffic}
        rowKey="id"
        pagination={false} // Custom pagination below
        bordered
      />
      {pagination && (
        <Pagination
          current={pagination.current_page}
          pageSize={pagination.per_page}
          total={pagination.total_items}
          showSizeChanger
          onShowSizeChange={handlePageChange}
          onChange={handlePageChange}
          style={{ marginTop: 20, textAlign: 'right' }}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      )}
    </Card>
  );
};

export default HistoricalTrafficTable;
