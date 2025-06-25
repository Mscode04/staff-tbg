import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  Table, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider
} from "@mui/material";
import { format } from 'date-fns';

const Dashboard = () => {
  const { routeName } = useParams();
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const salesRef = collection(db, "sales");
        const q = query(
          salesRef,
          where("routeName", "==", routeName),
          where("timestamp", ">=", today)
        );
        
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            customerData: data.customerData || {},
            productData: data.productData || {},
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
        
        setTodaySales(salesData);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError("Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodaySales();
  }, [routeName]);

  // Calculate various totals
  const totalSalesQty = todaySales.reduce((sum, sale) => sum + (sale.salesQuantity || 0), 0);
  const totalEmptyQty = todaySales.reduce((sum, sale) => sum + (sale.emptyQuantity || 0), 0);
  const totalCreditAmount = todaySales.reduce((sum, sale) => sum + (sale.todayCredit || 0), 0);
  const totalAmountReceived = todaySales.reduce((sum, sale) => sum + (sale.totalAmountReceived || 0), 0);
  const totalBalance = todaySales.reduce((sum, sale) => sum + (sale.totalBalance || 0), 0);
  const reportCount = todaySales.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'error.light', color: 'white' }}>
        {error}
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Today's Sales Report for {routeName}
      </Typography>
      
      {/* Summary Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Sales Count</Typography>
            <Typography variant="h4">{reportCount}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Sales Quantity</Typography>
            <Typography variant="h4">{totalSalesQty}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Empty Quantity</Typography>
            <Typography variant="h4">{totalEmptyQty}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Credit Amount</Typography>
            <Typography variant="h4">₹{totalCreditAmount.toLocaleString()}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Amount Received</Typography>
            <Typography variant="h4">₹{totalAmountReceived.toLocaleString()}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">Total Balance</Typography>
            <Typography variant="h4">₹{totalBalance.toLocaleString()}</Typography>
          </Paper>
        </Box>
      </Box>
      
      {/* Detailed Sales Table */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Detailed Transactions</Typography>
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>Sale ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Customer</TableCell>
              <TableCell sx={{ color: 'white' }}>Product</TableCell>
              <TableCell sx={{ color: 'white' }}>Qty</TableCell>
              <TableCell sx={{ color: 'white' }}>Empty Qty</TableCell>
              <TableCell sx={{ color: 'white' }}>Credit</TableCell>
              <TableCell sx={{ color: 'white' }}>Received</TableCell>
              <TableCell sx={{ color: 'white' }}>Balance</TableCell>
              <TableCell sx={{ color: 'white' }}>Time</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {todaySales.map((sale) => (
              <TableRow key={sale.id} hover>
                <TableCell>{sale.id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{sale.customerData?.name || sale.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {sale.customerData?.phone || sale.customerPhone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography>{sale.productData?.name || sale.productName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      ₹{sale.productData?.price || sale.productPrice}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{sale.salesQuantity}</TableCell>
                <TableCell>{sale.emptyQuantity}</TableCell>
                <TableCell>₹{sale.todayCredit?.toLocaleString()}</TableCell>
                <TableCell>₹{sale.totalAmountReceived?.toLocaleString()}</TableCell>
                <TableCell>₹{sale.totalBalance?.toLocaleString()}</TableCell>
                <TableCell>{format(sale.timestamp, 'hh:mm a')}</TableCell>
                <TableCell>
                  <Box 
                    sx={{
                      backgroundColor: sale.status === 'completed' ? 'success.light' : 'warning.light',
                      color: sale.status === 'completed' ? 'success.dark' : 'warning.dark',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {sale.status || 'completed'}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Customer and Product Summary */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Customer Summary</Typography>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography>
            <strong>Total Customers Today:</strong> {new Set(todaySales.map(sale => sale.customerId)).size}
          </Typography>
          <Typography>
            <strong>Average Gas On Hand:</strong> {(
              todaySales.reduce((sum, sale) => sum + (sale.customerData?.currentGasOnHand || 0), 0) / 
              todaySales.filter(sale => sale.customerData?.currentGasOnHand).length || 0
            ).toFixed(1)}
          </Typography>
        </Paper>

        <Typography variant="h6" gutterBottom>Product Summary</Typography>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography>
            <strong>Total Products Sold:</strong> {new Set(todaySales.map(sale => sale.productId)).size}
          </Typography>
          <Typography>
            <strong>Average Price:</strong> ₹{(
              todaySales.reduce((sum, sale) => sum + (parseInt(sale.productData?.price || sale.productPrice || 0)), 0) / 
              todaySales.length || 0
            ).toFixed(2)}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;