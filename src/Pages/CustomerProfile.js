import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  CircularProgress, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Container,
  Grid
} from "@mui/material";
import { format } from 'date-fns';

const CustomerProfile = () => {
  const { id } = useParams(); // This is the Firebase document ID
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer using the document ID directly
        const customerDocRef = doc(db, "customers", id);
        const customerDoc = await getDoc(customerDocRef);
        
        if (!customerDoc.exists()) {
          throw new Error("Customer not found");
        }
        
        const customerData = {
          firebaseId: customerDoc.id, // Storing the document ID explicitly
          ...customerDoc.data()
        };
        setCustomer(customerData);
        
        // Fetch sales using document reference
        const salesQuery = query(
          collection(db, "sales"),
          where("customerRef", "==", customerDocRef)
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSales(salesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id]);

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
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button 
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Customers
      </Button>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom>
              {customer.name}'s Profile
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Firebase Document ID" 
                  secondary={customer.firebaseId} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Phone" secondary={customer.phone} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Address" secondary={customer.address} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Route" secondary={customer.route || 'N/A'} />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, backgroundColor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Account Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Current Balance" 
                    secondary={
                      <Chip 
                        label={`₹${customer.currentBalance?.toLocaleString('en-IN') || '0'}`}
                        color={customer.currentBalance > 0 ? 'error' : 'success'}
                        size="medium"
                      />
                    } 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Gas On Hand" 
                    secondary={
                      <Chip 
                        label={customer.currentGasOnHand || '0'}
                        color="primary"
                        size="medium"
                      />
                    } 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button 
            variant="contained"
            onClick={() => navigate(`/customers/edit/${customer.firebaseId}`)}
          >
            Edit Profile
          </Button>
          <Button 
            variant="contained"
            color="success"
            onClick={() => navigate(`/sales/new?customerId=${customer.firebaseId}`)}
          >
            New Sale
          </Button>
          <Button 
            variant="contained"
            color="secondary"
            onClick={() => navigate(`/payments/new?customerId=${customer.firebaseId}`)}
          >
            Record Payment
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Transaction History
      </Typography>
      
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="sales history">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Type</TableCell>
              <TableCell sx={{ color: 'white' }}>Details</TableCell>
              <TableCell sx={{ color: 'white' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white' }}>Amount</TableCell>
              <TableCell sx={{ color: 'white' }}>Received</TableCell>
              <TableCell sx={{ color: 'white' }}>Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.length > 0 ? (
              sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'dd MMM yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>Sale</TableCell>
                  <TableCell>{sale.productName || 'Gas Cylinder'}</TableCell>
                  <TableCell>{sale.salesQuantity}</TableCell>
                  <TableCell>₹{sale.todayCredit?.toLocaleString('en-IN') || '0'}</TableCell>
                  <TableCell>₹{sale.totalAmountReceived?.toLocaleString('en-IN') || '0'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`₹${sale.totalBalance?.toLocaleString('en-IN') || '0'}`}
                      color={sale.totalBalance > 0 ? 'error' : 'success'}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default CustomerProfile;