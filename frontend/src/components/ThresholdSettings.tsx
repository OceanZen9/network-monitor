import React, { useState, useEffect, useCallback } from 'react';
import { getThresholds, createThreshold, updateThreshold, deleteThreshold, type Threshold } from '../services/api';

const ThresholdSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [newMetric, setNewMetric] = useState('bytes_sent_sec');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    try {
      setError(null);
      const fetchedThresholds = await getThresholds();
      setThresholds(fetchedThresholds);
    } catch (err) {
      console.error("Failed to fetch thresholds:", err);
      setError("Failed to load thresholds. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleAddThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const value = parseFloat(newValue);
      if (isNaN(value)) {
        setError("Invalid number format for value.");
        return;
      }
      const newThresholdData = await createThreshold({ metric: newMetric, value });
      // Add the new threshold to the state using the data returned from the API
      setThresholds([...thresholds, { 
        id: newThresholdData.id,
        metric: newMetric, 
        value: value, 
        is_enabled: true // Default state from backend
      }]);
      setNewValue('');
    } catch (err) {
      console.error("Failed to add threshold:", err);
      setError("Failed to add threshold.");
    }
  };

  const handleToggleEnable = async (id: number, currentStatus: boolean) => {
    setError(null);
    try {
      await updateThreshold(id, { is_enabled: !currentStatus });
      setThresholds(thresholds.map(t => 
        t.id === id ? { ...t, is_enabled: !t.is_enabled } : t
      ));
    } catch (err) {
      console.error("Failed to update threshold:", err);
      setError("Failed to update threshold status.");
    }
  };
  
  const handleDeleteThreshold = async (id: number) => {
    setError(null);
    try {
      await deleteThreshold(id);
      setThresholds(thresholds.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete threshold:", err);
      setError("Failed to delete threshold.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Threshold Settings</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAddThreshold} style={{ marginBottom: '20px' }}>
        <select value={newMetric} onChange={(e) => setNewMetric(e.target.value)}>
          <option value="bytes_sent_sec">Upload Speed (Bytes/s)</option>
          <option value="bytes_recv_sec">Download Speed (Bytes/s)</option>
        </select>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value (e.g., 1048576 for 1 MB/s)"
          required
          style={{ marginLeft: '10px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Add Threshold</button>
      </form>

      <div>
        {thresholds.map((threshold) => (
          <div key={threshold.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <p><strong>Metric:</strong> {threshold.metric}</p>
            <p><strong>Value:</strong> {threshold.value.toLocaleString()} Bytes/s</p>
            <p><strong>Status:</strong> {threshold.is_enabled ? 'Enabled' : 'Disabled'}</p>
            <button onClick={() => handleToggleEnable(threshold.id, threshold.is_enabled)}>
              {threshold.is_enabled ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => handleDeleteThreshold(threshold.id)} style={{ marginLeft: '10px', color: 'red' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThresholdSettings;
