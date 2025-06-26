import React, { useState, useEffect } from "react";
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
  TableCell
} from "@mui/material";
import { format } from 'date-fns';

const Dashboard = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        // Get routeName from localStorage
        const storedRouteName = localStorage.getItem("routeName");
        if (!storedRouteName) {
          throw new Error("Route name not found in localStorage");
        }
        setRouteName(storedRouteName);

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayDateString = format(today, 'yyyy-MM-dd');
        
        const salesRef = collection(db, "sales");
        const q = query(
          salesRef,
          where("routeName", "==", storedRouteName),
          where("date", "==", todayDateString) // Changed from timestamp to date
        );
        
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerName: data.customerName || "",
            customerPhone: data.customerPhone || "",
            productName: data.productName || "",
            productPrice: data.productPrice || 0,
            salesQuantity: data.salesQuantity || 0,
            emptyQuantity: data.emptyQuantity || 0,
            todayCredit: data.todayCredit || 0,
            totalAmountReceived: data.totalAmountReceived || 0,
            totalBalance: data.totalBalance || 0,
            status: data.status || "completed",
            date: data.date || todayDateString,
            // If you still need timestamp for display, fallback to current time
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
        
        setTodaySales(salesData);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError(err.message || "Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodaySales();
  }, []);

  // Calculate various totals (unchanged)
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
        Today's Sales 
      </Typography>
      
      {/* Summary Cards (unchanged) */}
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
        </Box>
      </Box>
      
      {/* Detailed Sales Table (unchanged) */}
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
              <TableCell sx={{ color: 'white' }}>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {todaySales.map((sale) => (
              <TableRow key={sale.id} hover>
                <TableCell>{sale.id.substring(0, 6)}...</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{sale.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {sale.customerPhone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography>{sale.productName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      ₹{sale.productPrice}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{sale.salesQuantity}</TableCell>
                <TableCell>{sale.emptyQuantity}</TableCell>
                <TableCell>₹{sale.todayCredit?.toLocaleString()}</TableCell>
                <TableCell>₹{sale.totalAmountReceived?.toLocaleString()}</TableCell>
                <TableCell>{format(sale.timestamp, 'hh:mm a')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Dashboard;