import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import ScanReceipt from './components/ScanReceipt';
import ComparisonDashboard from './components/ComparisonDashboard';
import CartManager from './components/CartManager';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? (
    <>
      <Navbar />
      <div className="animate-in fade-in duration-500">{children}</div>
    </>
  ) : <Navigate to="/login" />;
};

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* מסך 1: סל קניות והשוואה (דף הבית) */}
          <Route path="/" element={
            <PrivateRoute>
              <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <CartManager onCartUpdate={handleUpdate} />
                </div>
                <div className="lg:col-span-8">
                  <ComparisonDashboard key={refreshKey} />
                </div>
              </div>
            </PrivateRoute>
          } />

          {/* מסך 2: סריקת קבלות */}
          <Route path="/scan" element={
            <PrivateRoute>
              <div className="container mx-auto px-4 py-8">
                <ScanReceipt onConfirm={handleUpdate} />
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;