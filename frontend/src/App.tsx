import DashBoardLayout from "@/layouts/DashboardLayout";
import DashBoard from "@/pages/dashBoardPage";
import UserLoginPage from "@/pages/userLoginPage";
import { useSocketStore } from "@/store/socketStore";

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

function App() {
  const isLoginedIn = Boolean(localStorage.getItem("token"));
  useEffect(() => {
    if (isLoginedIn) {
      useSocketStore.getState().disconnect();
      setTimeout(() => {
        useSocketStore.getState().connect();
      }, 100);
    } else {
      useSocketStore.getState().disconnect();
    }
  }, [isLoginedIn]);
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
