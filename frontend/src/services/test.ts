import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000/",
  headers: {
    "Content-Type": "application/json",
  },
});

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

export { getTestData, getDevice, getSniff };
