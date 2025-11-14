import DashBoardLayout from "@/layouts/DashboardLayout";
import DashBoard from "@/pages/dashBoardPage";
import UserLoginPage from "@/pages/userLoginPage";

import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const isLoginedIn = Boolean(localStorage.getItem("token"));
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
