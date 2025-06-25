import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import { useNavigate } from "react-router-dom";
// import "./SalesReports.css";

const SalesReports = () => {
  const routeName = localStorage.getItem("routeName");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        if (!routeName) {
          throw new Error("Route information not found. Please login again.");
        }

        setLoading(true);
        setError(null);
        setIsIndexBuilding(false);

        // Get today's date
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];
        const startDate = new Date(todayDateString);
        const endDate = new Date(todayDateString);
        endDate.setDate(endDate.getDate() + 1);

        // Query sales - try with timestamp first
        let salesQuery;
        try {
          salesQuery = query(
            collection(db, "sales"),
            where("routeName", "==", routeName),
            where("timestamp", ">=", startDate),
            where("timestamp", "<", endDate)
          );
          
          const querySnapshot = await getDocs(salesQuery);
          const salesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          }));

          // Sort sales by timestamp (newest first)
          salesData.sort((a, b) => b.timestamp - a.timestamp);
          setSales(salesData);
        } catch (err) {
          if (err.code === 'failed-precondition') {
            // Index might not be ready yet, fallback to simpler query
            setIsIndexBuilding(true);
            const fallbackQuery = query(
              collection(db, "sales"),
              where("routeName", "==", routeName)
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackData = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date()
            }));

            // Filter by date manually
            const filteredData = fallbackData.filter(sale => {
              return sale.timestamp >= startDate && sale.timestamp < endDate;
            });

            filteredData.sort((a, b) => b.timestamp - a.timestamp);
            setSales(filteredData);
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [routeName]);

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderField = (label, value) => {
    return (
      <div className="detail-field">
        <span className="detail-label">{label}:</span>
        <span className="detail-value">{value || 'N/A'}</span>
      </div>
    );
  };

  const renderObjectFields = (obj, prefix = '') => {
    if (!obj) return null;
    
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={prefix + key} className="nested-section">
            <h4>{key}</h4>
            {renderObjectFields(value, `${prefix}${key}.`)}
          </div>
        );
      }
      
      const formattedValue = value instanceof Date ? formatDate(value) : value;
      return renderField(key, formattedValue);
    });
  };

  if (!routeName) {
    return (
      <div className="error-container">
        <h2>Route Information Missing</h2>
        <p>Please login again to access sales reports.</p>
        <button 
          className="retry-button"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading sales data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p className="error-message">{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="sales-reports-container">
      <div className="header">
        <h2>Today's Sales Report</h2>
        <p className="route-name">Route: {routeName}</p>
        {isIndexBuilding && (
          <div className="index-notice">
            <p>⏳ Database is optimizing. Full filtering will be available soon.</p>
          </div>
        )}
      </div>
      
      {sales.length > 0 ? (
        <>
          <div className="summary-card">
            <div className="summary-item">
              <span className="summary-label">Total Sales</span>
              <span className="summary-value">
                {formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmountReceived || 0), 0))}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Transactions</span>
              <span className="summary-value">{sales.length}</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{sale.customerData?.name || 'Unknown'}</td>
                    <td>{sale.productData?.name || 'N/A'}</td>
                    <td>{sale.salesQuantity}</td>
                    <td>{formatCurrency(sale.totalAmountReceived)}</td>
                    <td>
                      <span className={`status-badge ${sale.status?.toLowerCase() || 'completed'}`}>
                        {sale.status || 'Completed'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="details-button"
                        onClick={() => handleRowClick(sale)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="no-data">
          <img src="/images/no-data.svg" alt="No sales" className="no-data-image" />
          <p className="no-data-message">No sales recorded for today.</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="modal-overlay">
          <div className="details-modal">
            <div className="modal-header">
              <h3>Sale Details - {selectedSale.id}</h3>
              <button 
                className="close-button"
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <div className="details-section">
                <h4>Basic Information</h4>
                {renderField('Sale ID', selectedSale.id)}
                {renderField('Date', formatDate(selectedSale.timestamp))}
                {renderField('Status', selectedSale.status)}
                {renderField('Route', selectedSale.routeName)}
              </div>

              <div className="details-section">
                <h4>Transaction Details</h4>
                {renderField('Quantity', selectedSale.salesQuantity)}
                {renderField('Empty Quantity', selectedSale.emptyQuantity)}
                {renderField('Total Amount Received', formatCurrency(selectedSale.totalAmountReceived))}
                {renderField('Today Credit', formatCurrency(selectedSale.todayCredit))}
              </div>

              <div className="details-section">
                <h4>Customer Information</h4>
                {renderObjectFields(selectedSale.customerData)}
                {renderField('Address', selectedSale.customerAddress)}
              </div>

              <div className="details-section">
                <h4>Product Information</h4>
                {renderObjectFields(selectedSale.productData)}
              </div>

              <div className="details-section">
                <h4>Balance Information</h4>
                {renderField('Previous Balance', formatCurrency(selectedSale.previousBalance))}
                {renderField('Current Balance', formatCurrency(selectedSale.customerData?.currentBalance))}
                {renderField('Total Balance', formatCurrency(selectedSale.totalBalance))}
                {renderField('Current Gas On Hand', selectedSale.customerData?.currentGasOnHand)}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-button"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReports;