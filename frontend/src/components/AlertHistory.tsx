// frontend/src/components/AlertHistory.tsx
import { useState, useEffect } from 'react';
import { List, Button, message, Space, Card, Tag, Popconfirm } from 'antd';
import { getAlerts, markAlertAsRead, markAllAlertsAsRead } from '../services/api';
import type { Alert } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircleOutlined, BellOutlined, CloseCircleOutlined } from '@ant-design/icons';

const AlertHistory = () => {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: number) => markAlertAsRead(alertId),
    onSuccess: () => {
      message.success('Alert marked as read');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err) => {
      message.error(`Failed to mark alert as read: ${err.message}`);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAlertsAsRead,
    onSuccess: () => {
      message.success('All alerts marked as read');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err) => {
      message.error(`Failed to mark all alerts as read: ${err.message}`);
    },
  });

  if (isLoading) return <Card title="Alert History">Loading alerts...</Card>;
  if (error) return <Card title="Alert History">Error: {error.message}</Card>;

  return (
    <Card
      title={
        <Space>
          <BellOutlined /> Alert History
        </Space>
      }
      extra={
        <Popconfirm
          title="Mark all alerts as read?"
          onConfirm={() => markAllReadMutation.mutate()}
          okText="Yes"
          cancelText="No"
          disabled={!alerts || alerts.filter(a => !a.is_read).length === 0}
        >
          <Button
            type="primary"
            disabled={!alerts || alerts.filter(a => !a.is_read).length === 0}
            icon={<CheckCircleOutlined />}
          >
            Mark All Read
          </Button>
        </Popconfirm>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={alerts}
        renderItem={(alert) => (
          <List.Item
            actions={[
              !alert.is_read ? (
                <Button
                  key="mark-read"
                  type="link"
                  onClick={() => markReadMutation.mutate(alert.id)}
                  loading={markReadMutation.isPending && markReadMutation.variables === alert.id}
                  icon={<CheckCircleOutlined />}
                >
                  Mark Read
                </Button>
              ) : (
                <Button key="read" type="link" disabled icon={<CheckCircleOutlined />}>
                  Read
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={alert.is_read ? <CheckCircleOutlined style={{ color: 'green' }} /> : <BellOutlined style={{ color: 'red' }} />}
              title={
                <Space>
                  {alert.message}
                  <Tag color={alert.is_read ? 'green' : 'red'}>
                    {alert.is_read ? 'Read' : 'Unread'}
                  </Tag>
                </Space>
              }
              description={alert.created_at}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AlertHistory;
