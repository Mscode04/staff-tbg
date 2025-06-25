import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
// import "./SalesForm.css"; // Make sure to create this CSS file

const SalesForm = () => {
  // Get routeName from localStorage
  const routeName = localStorage.getItem("routeName");
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState({
    initial: true,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
    customerId: "",
    customerData: null,
    productId: "",
    productData: null,
    salesQuantity: 1,
    emptyQuantity: 0,
    todayCredit: 0,
    totalAmountReceived: 0,
    totalBalance: 0,
    previousBalance: 0,
    date: new Date().toISOString().split('T')[0],
    route: routeName
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!routeName) {
          throw new Error("Route information not found. Please login again.");
        }

        setLoading(prev => ({ ...prev, initial: true }));
        setError(null);
        
        // Fetch customers for this route only
        const customersQuery = query(
          collection(db, "customers"),
          // where("route", "==", routeName)
        );
        const customersSnapshot = await getDocs(customersQuery);
        
        const customersData = customersSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        setCustomers(customersData);
        
        // Fetch all products
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsData);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };
    
    fetchData();
  }, [routeName]);

  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerData: customer,
          previousBalance: customer.currentBalance || 0,
          totalBalance: (customer.currentBalance || 0) + prev.todayCredit - prev.totalAmountReceived
        }));
      }
    }
  }, [formData.customerId, customers]);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === formData.productId);
      if (product) {
        setSelectedProduct(product);
        setFormData(prev => ({
          ...prev,
          productData: product,
          todayCredit: product.price * prev.salesQuantity,
          totalBalance: (prev.previousBalance || 0) + (product.price * prev.salesQuantity) - prev.totalAmountReceived
        }));
      }
    }
  }, [formData.productId, products, formData.salesQuantity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "salesQuantity" || name === "emptyQuantity" || name === "totalAmountReceived" 
        ? Math.max(0, parseInt(value) || 0)
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!routeName) {
        throw new Error("Route information not found. Please login again.");
      }
      if (!formData.customerId) {
        throw new Error("Please select a customer");
      }
      if (!formData.productId) {
        throw new Error("Please select a product");
      }
      if (formData.salesQuantity < 1) {
        throw new Error("Sales quantity must be at least 1");
      }
      if (selectedCustomer && formData.emptyQuantity > selectedCustomer.currentGasOnHand) {
        throw new Error(`Cannot take back more cylinders (${formData.emptyQuantity}) than customer has (${selectedCustomer.currentGasOnHand})`);
      }

      // Prepare sale document
      const saleData = {
        ...formData,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        routeName: routeName,
        timestamp: new Date(),
        status: "completed"
      };

      // Add sale record
      await addDoc(collection(db, "sales"), saleData);
      
      // Update customer document
      const customerQuery = query(
        collection(db, "customers"),
        where("id", "==", formData.customerId)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerDocRef = customerSnapshot.docs[0].ref;
        await updateDoc(customerDocRef, {
          currentBalance: formData.totalBalance,
          currentGasOnHand: (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity,
          lastPurchaseDate: new Date()
        });
      }

      // Reset form
      setFormData({
        id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
        customerId: "",
        customerData: null,
        productId: "",
        productData: null,
        salesQuantity: 1,
        emptyQuantity: 0,
        todayCredit: 0,
        totalAmountReceived: 0,
        totalBalance: 0,
        previousBalance: 0,
        date: new Date().toISOString().split('T')[0],
        route: routeName
      });
      setSelectedProduct(null);
      setSelectedCustomer(null);
      
      setSuccess("Sale recorded successfully!");
    } catch (err) {
      console.error("Error processing sale:", err);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  if (!routeName) {
    return (
      <div className="error-container">
        <h2>Route Information Missing</h2>
        <p>Please login again to access the sales form.</p>
      </div>
    );
  }

  if (loading.initial) {
    return (
      <div className="loading-container">
        <p>Loading form data...</p>
      </div>
    );
  }

  if (error && !loading.initial) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="sales-form-container">
      <h2>New Sale - {routeName} Route</h2>
      
      {success && (
        <div className="success-message">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="sales-form">
        <div className="form-group">
          <label>Sale ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Route:</label>
          <input
            type="text"
            value={routeName}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Customer:</label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            disabled={loading.submitting}
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone}) - 
                Balance: ₹{customer.currentBalance || 0} - 
                Cylinders: {customer.currentGasOnHand || 0}
              </option>
            ))}
          </select>
        </div>
        
        {selectedCustomer && (
          <div className="customer-details">
            <p><strong>Current Balance:</strong> ₹{selectedCustomer.currentBalance || 0}</p>
            <p><strong>Cylinders On Hand:</strong> {selectedCustomer.currentGasOnHand || 0}</p>
            <p><strong>Address:</strong> {selectedCustomer.address}</p>
          </div>
        )}
        
        <div className="form-group">
          <label>Product:</label>
          <select
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            required
            disabled={loading.submitting}
          >
            <option value="">Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (₹{product.price})
              </option>
            ))}
          </select>
        </div>
        
        {selectedProduct && (
          <>
            <div className="form-group">
              <label>Product Price:</label>
              <input
                type="number"
                value={selectedProduct.price}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Sales Quantity:</label>
              <input
                type="number"
                name="salesQuantity"
                value={formData.salesQuantity}
                onChange={handleChange}
                required
                min="1"
                disabled={loading.submitting}
              />
            </div>
            
            <div className="form-group">
              <label>Empty Cylinders Returned:</label>
              <input
                type="number"
                name="emptyQuantity"
                value={formData.emptyQuantity}
                onChange={handleChange}
                required
                min="0"
                max={selectedCustomer?.currentGasOnHand || 0}
                disabled={loading.submitting}
              />
              <small>Max: {selectedCustomer?.currentGasOnHand || 0}</small>
            </div>
            
            <div className="form-group">
              <label>Today's Credit:</label>
              <input
                type="number"
                value={formData.todayCredit}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Previous Balance:</label>
              <input
                type="number"
                value={formData.previousBalance}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Amount Received (₹):</label>
              <input
                type="number"
                name="totalAmountReceived"
                value={formData.totalAmountReceived}
                onChange={handleChange}
                required
                min="0"
                disabled={loading.submitting}
              />
            </div>
            
            <div className="form-group">
              <label>New Balance:</label>
              <input
                type="number"
                value={formData.totalBalance}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>New Cylinder Count:</label>
              <input
                type="number"
                value={
                  selectedCustomer 
                    ? (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity
                    : 0
                }
                readOnly
              />
            </div>
          </>
        )}
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading.submitting}
        >
          {loading.submitting ? "Processing..." : "Record Sale"}
        </button>
      </form>
    </div>
  );
};

export default SalesForm;