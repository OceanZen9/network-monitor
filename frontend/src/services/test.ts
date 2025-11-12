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

export { getTestData };
