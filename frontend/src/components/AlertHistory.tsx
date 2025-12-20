// frontend/src/components/AlertHistory.tsx
import { List, Button, message, Space, Card, Tag, Popconfirm } from 'antd';
import { getAlerts, markAlertAsRead, markAllAlertsAsRead } from '../services/api';
import type { Alert } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircleOutlined, BellOutlined } from '@ant-design/icons';

const AlertHistory = () => {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: number) => markAlertAsRead(alertId),
    onSuccess: () => {
      message.success('告警已标记为已读');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err) => {
      message.error(`标记告警为已读失败: ${err.message}`);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAlertsAsRead,
    onSuccess: () => {
      message.success('所有告警已标记为已读');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err) => {
      message.error(`标记所有告警为已读失败: ${err.message}`);
    },
  });

  if (isLoading) return <Card title="告警历史">正在加载告警...</Card>;
  if (error) return <Card title="告警历史">错误: {error.message}</Card>;

  return (
    <Card
      title={
        <Space>
          <BellOutlined /> 告警历史
        </Space>
      }
      extra={
        <Popconfirm
          title="标记所有告警为已读?"
          onConfirm={() => markAllReadMutation.mutate()}
          okText="是"
          cancelText="否"
          disabled={!alerts || alerts.filter(a => !a.is_read).length === 0}
        >
          <Button
            type="primary"
            disabled={!alerts || alerts.filter(a => !a.is_read).length === 0}
            icon={<CheckCircleOutlined />}
          >
            全部标为已读
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
                  标为已读
                </Button>
              ) : (
                <Button key="read" type="link" disabled icon={<CheckCircleOutlined />}>
                  已读
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
                    {alert.is_read ? '已读' : '未读'}
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
