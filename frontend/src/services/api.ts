import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000/",
  headers: {
    "Content-Type": "application/json",
  },
});

interface LoginRequest {
  username: string;
  password: string;
}
interface LoginResponse {
  message: string;
  token: string;
}

const getTestData = async () => {
  const response = await apiClient.get("/api/test");
  return response.data;
};

const getDevice = async () => {
  const response = await apiClient.get("/api/devices");
  return response.data;
};

const getSniff = async () => {
  const response = await apiClient.get("/api/start-sniffing");
  return response.data;
};

const login = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const url = "/api/login";
  try {
    const payload: LoginRequest = { username, password };
    const response = await apiClient.post<LoginResponse>(url, payload);
    return response.data;
  } catch (error) {
    console.error("Login API failed:", error);
    throw error;
  }
};

export { getTestData, getDevice, getSniff, login };
