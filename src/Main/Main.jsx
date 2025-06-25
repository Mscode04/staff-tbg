import React from "react";
import { Outlet, Navigate, Link, useParams, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";

const Main = ({ isAuthenticated, setIsAuthenticated }) => {
  const { routeName } = useParams();
  const navigate = useNavigate();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    // Perform logout actions (clear tokens, etc.)
    navigate("/logout");
    setIsAuthenticated(false);
  };

  return (
    <div className="main-layout">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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