import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  Chip,
  Alert
} from "@mui/material";

const AllCustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customersData = querySnapshot.docs.map(doc => ({
          firebaseId: doc.id, // Using Firebase document ID as the primary identifier
          ...doc.data()
        }));
        setCustomers(customersData);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h4" component="h1">
          All Customers
        </Typography>
        <Button 
          variant="contained"
          onClick={() => navigate("/customers/new")}
          sx={{ ml: 2 }}
        >
          Add New Customer
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="customers table">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Route</TableCell>
              <TableCell sx={{ color: 'white' }}>Phone</TableCell>
              <TableCell sx={{ color: 'white' }}>Balance</TableCell>
              <TableCell sx={{ color: 'white' }}>Gas On Hand</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.firebaseId}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.route || '-'}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Chip 
                    label={`₹${customer.currentBalance?.toLocaleString('en-IN') || '0'}`}
                    color={customer.currentBalance > 0 ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell>{customer.currentGasOnHand || '0'}</TableCell>
                <TableCell>
                  <Button 
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/customer/${customer.firebaseId}`)} // Using Firebase document ID
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AllCustomersList;