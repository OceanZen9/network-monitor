import DashBoardLayout from "@/layouts/DashboardLayout";
import DashBoard from "@/pages/dashBoardPage";
import UserLoginPage from "@/pages/userLoginPage";
import { useSocketStore } from "@/store/socketStore";

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

function App() {
  const isLoginedIn = Boolean(localStorage.getItem("access_token"));
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (isLoginedIn) {
      connect();
    } else {
      disconnect();
    }
  }, [isLoginedIn, connect, disconnect]);

  return (
    <Routes>
      <Route path="/login" element={<UserLoginPage />} />
      <Route
        path="/"
        element={isLoginedIn ? <DashBoard /> : <Navigate to="/login" />}
      >
        <Route index element={<DashBoardLayout />} />
      </Route>
    </Routes>
  );
}
export default App;
