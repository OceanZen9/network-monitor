import React, { useState, useEffect, useCallback } from "react";
import {
  getThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
  type Threshold,
} from "../services/api";

const ThresholdSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [newMetric, setNewMetric] = useState("bytes_sent_sec");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    try {
      setError(null);
      const fetchedThresholds = await getThresholds();
      setThresholds(fetchedThresholds);
    } catch (err) {
      console.error("Failed to fetch thresholds:", err);
      setError("加载阈值失败，请重试。");
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
        setError("无效的数值格式。");
        return;
      }
      const newThresholdData = await createThreshold({
        metric: newMetric,
        value,
      });
      // Add the new threshold to the state using the data returned from the API
      setThresholds([
        ...thresholds,
        {
          id: newThresholdData.id,
          metric: newMetric,
          value: value,
          is_enabled: true, // Default state from backend
        },
      ]);
      setNewValue("");
    } catch (err) {
      console.error("Failed to add threshold:", err);
      setError("添加阈值失败。");
    }
  };

  const handleToggleEnable = async (id: number, currentStatus: boolean) => {
    setError(null);
    try {
      await updateThreshold(id, { is_enabled: !currentStatus });
      setThresholds(
        thresholds.map((t) =>
          t.id === id ? { ...t, is_enabled: !t.is_enabled } : t
        )
      );
    } catch (err) {
      console.error("Failed to update threshold:", err);
      setError("更新阈值状态失败。");
    }
  };

  const handleDeleteThreshold = async (id: number) => {
    setError(null);
    try {
      await deleteThreshold(id);
      setThresholds(thresholds.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete threshold:", err);
      setError("删除阈值失败。");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>阈值设置</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleAddThreshold} style={{ marginBottom: "20px" }}>
        <select
          value={newMetric}
          onChange={(e) => setNewMetric(e.target.value)}
        >
          <option value="bytes_sent_sec">上传速度 (Bytes/s)</option>
          <option value="bytes_recv_sec">下载速度 (Bytes/s)</option>
        </select>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="值 (例如: 1048576 代表 1 MB/s)"
          required
          style={{ marginLeft: "10px" }}
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          添加阈值
        </button>
      </form>

      <div>
        {thresholds.map((threshold) => (
          <div
            key={threshold.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
            }}
          >
            <p>
              <strong>指标:</strong> {threshold.metric === 'bytes_sent_sec' ? '上传速度' : '下载速度'}
            </p>
            <p>
              <strong>阈值:</strong> {threshold.value.toLocaleString()} Bytes/s
            </p>
            <p>
              <strong>状态:</strong>{" "}
              {threshold.is_enabled ? "已启用" : "已禁用"}
            </p>
            <button
              onClick={() =>
                handleToggleEnable(threshold.id, threshold.is_enabled)
              }
            >
              {threshold.is_enabled ? "禁用" : "启用"}
            </button>
            <button
              onClick={() => handleDeleteThreshold(threshold.id)}
              style={{ marginLeft: "10px", color: "red" }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThresholdSettings;
