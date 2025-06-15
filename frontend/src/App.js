

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/Login';
import ProtectedRoute from './login/ProtectedRoute';
import Dashboardnavbar from './dashboard/dashboardnavbar.jsx';
import Dashboardmenu from './dashboard/dashboardmenu.jsx';
import Performance from './dashboard/hook/Performance.jsx';
import IceOrderForm from './dashboard/hook/userDriver.jsx';
import ProductList from './dashboard/dashbordproduct/ProductList.jsx';
import Stock from './dashboard/stock/stock.jsx';
import OrdersList from './dashboard/Order/addbanner.jsx';
import ImageSlider from './dashboard/Image/ImageSlider.jsx';
import Display from './dashboard/hook/display/userDriverdisplay.jsx';
import React, { useState } from 'react';

function IceOrderPage() {
  const [customers, setCustomers] = useState([]);
  
  const handleAddCustomer = (customerData) => {
    setCustomers([...customers, { id: customers.length + 1, ...customerData }]);
  };

  return (
    <>
      {/* <Dashboardnavbar /> */}
      <Dashboardmenu />
      <IceOrderForm onSubmit={handleAddCustomer} />
      <Display customers={customers} setCustomers={setCustomers} />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route - login page */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              <Performance />
            </>
          } />
          
          <Route path="/dashboard" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              <Performance />
            </>
          } />
          
          <Route path="/IceOrderForm" element={<IceOrderPage />} />
          
          <Route path="/addbanner" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              {/* <OrdersList /> */}
            </>
          } />
          
          <Route path="/stock" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              {/* <Stock /> */}
            </>
          } />
          
          <Route path="/image" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              {/* <ImageSlider /> */}
            </>
          } />
          
          <Route path="/addproduct" element={
            <>
              {/* <Dashboardnavbar /> */}
              <Dashboardmenu />
              {/* <ProductList /> */}
            </>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;