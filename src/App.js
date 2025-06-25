import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Main/LoginPage";
import Main from './Main/Main'
import Dashboard from "./Pages/Dashboard";
import SalesForm from "./Pages/SalesForm";
import CustomersList from "./Pages/CustomersList";
import CustomerProfile from "./Pages/CustomerProfile";
import TodaySales from "./Pages/TodaySales";
import Logout from "./Main/Logout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("routeName");
  };

  return (
   
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? 
            <LoginPage setIsAuthenticated={setIsAuthenticated} /> : 
            <Navigate to={`/dashboard/${localStorage.getItem("routeName")}`} />
        } />
        <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
        
        {/* Protected routes */}
        <Route path="/" element={<Main isAuthenticated={isAuthenticated} />}>
          <Route path="dashboard/:routeName" element={<Dashboard />} />
          <Route path="sales/new/:routeName" element={<SalesForm />} />
          <Route path="sales/today/:routeName" element={<TodaySales />} />
          <Route path="customers/:routeName" element={<CustomersList />} />
          <Route path="customer/:id" element={<CustomerProfile />} />
          {/* Add more protected routes as needed */}
        </Route>

        {/* Redirect to login or dashboard */}
        <Route path="*" element={
          isAuthenticated ? 
            <Navigate to={`/dashboard/${localStorage.getItem("routeName")}`} /> : 
            <Navigate to="/login" />
        } />
      </Routes>
    
  );
}

export default App;