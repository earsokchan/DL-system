import React from 'react'
import { Link, useLocation } from 'react-router-dom';

function Dashboardmenu({ to, icon, label }) {
    const location = useLocation(); // Get the current route
    const activeTab = location.pathname === to; // Check if the current route matches the `to` prop
  
  return (
    
  <div className="sidebar">
    
    <div className="sidebar-wrapper">
      <div className="logo">
        
      </div>
      <ul className="nav">
          <li className={activeTab === "./hook/Performance.jsx" ? "active active4" : ""}>
            <Link to="/dashboard">Dasboard</Link>
            
          </li>
          {/* <li className={activeTab === "./hook/Performance.jsx" ? "active active4" : ""}>
            <Link to="/dashboard">Produc</Link>
            
          </li> */}
          
          <li className={activeTab === "./hook/userDriver.jsx" ? "active active4" : ""}>
            <Link to="/IceOrderForm">IceOrderForm</Link>
            
          </li>
          <li className={activeTab === "./Order/addbanner.jsx" ? "active active4" : ""}>
            <Link to="/addbanner">Add Banner</Link>
            
          </li>
          <li className={activeTab === "./stock/stock.jsx" ? "active active4" : ""}>
            <Link to="/stock">Stock</Link>
            
          </li>
          
          <li className={activeTab === "./Image/image.jsx" ? "active active4" : ""}>
            <Link to="/image">Image</Link>
            
          </li>
      </ul>
    </div>
  </div>


  )
}

export default Dashboardmenu;