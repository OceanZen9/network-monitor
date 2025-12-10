import unittest
from unittest.mock import MagicMock, patch
import sys
import os
from collections import deque

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.traffic_monitor import check_and_notify_thresholds, _rate_history
from services.alert_manager import AlertManager

class TestAlertLogic(unittest.TestCase):
    def setUp(self):
        # Reset history
        _rate_history.clear()
        
    @patch('services.traffic_monitor.Threshold')
    @patch('services.traffic_monitor.ext')
    @patch('services.traffic_monitor.AlertManager')
    def test_sliding_window_alert(self, MockAlertManager, MockExt, MockThreshold):
        # Setup Threshold
        mock_threshold = MagicMock()
        mock_threshold.metric = 'bytes_sent_sec'
        mock_threshold.value = 1000 # 1KB/s
        mock_threshold.user_id = 'user1'
        mock_threshold.id = 1
        mock_threshold.is_enabled = True
        
        MockThreshold.query.filter_by.return_value.all.return_value = [mock_threshold]
        
        # Mock Cooldowns
        MockExt._alert_cooldowns = {}
        
        # 1. Send data slightly below threshold
        rates = [{'interface': 'eth0', 'bytes_sent_sec': 900, 'bytes_recv_sec': 0}]
        check_and_notify_thresholds(rates)
        
        # Should not alert yet
        MockAlertManager.send_alert.assert_not_called()
        
        # 2. Send data consistently above threshold
        # We need to fill the window or just enough to pull the average up.
        # Current avg after 1st: 900.
        # If we send 2000, avg becomes (900+2000)/2 = 1450 > 1000.
        
        rates = [{'interface': 'eth0', 'bytes_sent_sec': 2000, 'bytes_recv_sec': 0}]
        check_and_notify_thresholds(rates)
        
        # Verify Alert
        MockAlertManager.send_alert.assert_called_once()
        args = MockAlertManager.send_alert.call_args
        print(f"Alert Triggered: {args}")

if __name__ == '__main__':
    unittest.main()
