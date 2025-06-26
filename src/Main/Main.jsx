import React from "react";
import { Outlet, Navigate, Link, useParams, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const Main = ({ isAuthenticated, setIsAuthenticated }) => {
  const { routeName } = useParams();
  const navigate = useNavigate();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = async () => {
    try {
      const routeId = localStorage.getItem("routeId");
      
      if (routeId) {
        // Find the most recent session without a logout time
        const sessionsRef = collection(db, "sessions");
        const q = query(
          sessionsRef,
          where("routeId", "==", routeId),
          where("logoutTime", "==", null),
          where("routeName", "==", routeName)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Update the most recent session with logout time
          const sessionDoc = querySnapshot.docs[0];
          await updateDoc(sessionDoc.ref, {
            logoutTime: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error recording logout:", error);
    } finally {
      // Clear local storage and authentication state
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("routeName");
      localStorage.removeItem("routeId");
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="main-layout">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Date: {today}
          </Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Route: {routeName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" component={Link} to={`/dashboard/${routeName}`}>Home</Button>
            <Button color="inherit" component={Link} to={`/sales/new/${routeName}`}>New Sale</Button>
            <Button color="inherit" component={Link} to={`/sales/today/${routeName}`}>Today's Sales</Button>
            <Button color="inherit" component={Link} to={`/customers/${routeName}`}>Customers</Button>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
      
      <footer style={{ padding: '10px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
        <p>© {new Date().getFullYear()} Route Management System</p>
      </footer>
    </div>
  );
};

export default Main;