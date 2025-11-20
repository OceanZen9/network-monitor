import { useEffect } from 'react';
import { notification } from 'antd';
import { useSocketStore } from '../store/socketStore';

const AlertManager: React.FC = () => {
  const { alert, clearAlert } = useSocketStore((state) => ({
    alert: state.alert,
    clearAlert: state.clearAlert,
  }));

  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (alert) {
      api[alert.level || 'info']({
        message: 'System Alert',
        description: alert.message,
        placement: 'topRight',
        duration: 5, // show for 5 seconds
      });

      // Reset the alert in the store so it doesn't pop up again on re-render
      clearAlert();
    }
  }, [alert, api, clearAlert]);

  // contextHolder is needed for antd to inject the notification styles and container
  return contextHolder;
};

export default AlertManager;
