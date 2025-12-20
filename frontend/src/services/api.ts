import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // 在请求发送前添加认证令牌
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("无可用刷新令牌");
        }

        // 请求新的访问令牌
        const { data } = await apiClient.post("/api/auth/refresh", null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        localStorage.setItem("access_token", data.access_token);

        // 重新发送原始请求
        if (originalRequest.headers) {
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${data.access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("会话已过期，正在重定向到登录页面...", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    username: string;
  };
}

export const getDevice = async () => {
  const response = await apiClient.get("/api/devices");
  return response.data;
};

export const login = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const response = await apiClient.post("/api/auth/login", {
    username,
    password,
  });
  return response.data;
};

export const register = async (username: string, password: string) => {
  try {
    await apiClient.post("/api/auth/register", { username, password });
  } catch (error) {
    console.error("注册失败:", error);
    throw error;
  }
};

// --- 阈值 API 函数 ---

export interface Threshold {
  id: number;
  metric: string;
  value: number;
  is_enabled: boolean;
}

export interface CreateThresholdPayload {
  metric: string;
  value: number;
}

export interface UpdateThresholdPayload {
  value?: number;
  is_enabled?: boolean;
}

export const getThresholds = async (): Promise<Threshold[]> => {
  const response = await apiClient.get("/api/thresholds");
  return response.data;
};

export const createThreshold = async (
  payload: CreateThresholdPayload
): Promise<{ msg: string; id: number }> => {
  const response = await apiClient.post("/api/thresholds", payload);
  return response.data;
};

export const updateThreshold = async (
  id: number,
  payload: UpdateThresholdPayload
): Promise<{ msg: string }> => {
  const response = await apiClient.put(`/api/thresholds/${id}`, payload);
  return response.data;
};

export const deleteThreshold = async (id: number): Promise<{ msg: string }> => {
  const response = await apiClient.delete(`/api/thresholds/${id}`);
  return response.data;
};

// --- 告警 API 函数 ---

export interface Alert {
  id: number;
  user_id: number;
  message: string;
  level: string;
  is_read: boolean;
  created_at: string;
}

export const getAlerts = async (): Promise<Alert[]> => {
  const response = await apiClient.get("/api/alerts");
  return response.data;
};

export const markAlertAsRead = async (alertId: number): Promise<Alert> => {
  const response = await apiClient.post(`/api/alerts/${alertId}/mark-read`);
  return response.data;
};

export const markAllAlertsAsRead = async (): Promise<{ msg: string }> => {
  const response = await apiClient.post("/api/alerts/mark-all-read");
  return response.data;
};

export default apiClient;

