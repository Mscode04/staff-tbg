import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import { useParams, useNavigate } from "react-router-dom";
import "./SalesDetails.css";

const SalesDetails = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "sales", saleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSale({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: docSnap.data().timestamp?.toDate() || new Date()
          });
        } else {
          throw new Error("Sale record not found");
        }
      } catch (err) {
        console.error("Error fetching sale details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [saleId]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return <div className="loading">Loading sale details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={handleBackClick}>Go Back</button>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="error-container">
        <p>No sale data available</p>
        <button onClick={handleBackClick}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="sales-details-container">
      <button onClick={handleBackClick} className="back-button">
        &larr; Back to Reports
      </button>
      
      <h2>Sale Details</h2>
      
      <div className="details-card">
        <div className="details-section">
          <h3>Transaction Info</h3>
          <p><strong>Sale ID:</strong> {sale.id}</p>
          <p><strong>Date:</strong> {sale.timestamp.toLocaleDateString()}</p>
          <p><strong>Time:</strong> {sale.timestamp.toLocaleTimeString()}</p>
          <p><strong>Route:</strong> {sale.routeName}</p>
        </div>

        <div className="details-section">
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> {sale.customerData?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> {sale.customerData?.phone || 'N/A'}</p>
          <p><strong>Address:</strong> {sale.customerData?.address || 'N/A'}</p>
        </div>

        <div className="details-section">
          <h3>Product Details</h3>
          <p><strong>Product:</strong> {sale.productData?.name || 'N/A'}</p>
          <p><strong>Price:</strong> ₹{sale.productData?.price?.toFixed(2) || '0.00'}</p>
          <p><strong>Quantity:</strong> {sale.salesQuantity}</p>
          <p><strong>Empty Returned:</strong> {sale.emptyQuantity}</p>
        </div>

        <div className="details-section">
          <h3>Payment Details</h3>
          <p><strong>Amount Received:</strong> ₹{sale.totalAmountReceived?.toFixed(2)}</p>
          <p><strong>Today's Credit:</strong> ₹{sale.todayCredit?.toFixed(2)}</p>
          <p><strong>Previous Balance:</strong> ₹{sale.previousBalance?.toFixed(2)}</p>
          <p><strong>New Balance:</strong> ₹{sale.totalBalance?.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default SalesDetails;