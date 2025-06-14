import React from "react";
import "./style.css";

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p>Welcome back, User!</p>
        </div>
        <div className="header-profile">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="profile-image"
          />
          <span>User Name</span>
        </div>
      </div>

      <div className="kpi-section">
        <div className="kpi-card">
          <h3>Orders</h3>
          <p>120</p>
        </div>
        <div className="kpi-card">
          <h3>Revenue</h3>
          <p>$5,000</p>
        </div>
        <div className="kpi-card">
          <h3>Customers</h3>
          <p>350</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-controls">
          <button className="chart-control active">Day</button>
          <button className="chart-control">Week</button>
          <button className="chart-control">Month</button>
        </div>
        <div className="chart-container">
          {/* Chart would go here */}
          <p>Chart Placeholder</p>
        </div>
      </div>

      <div className="orders-section">
        <h3>Recent Orders</h3>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#001</td>
              <td>
                <span className="status delivered">Delivered</span>
              </td>
              <td>$120</td>
            </tr>
            <tr>
              <td>#002</td>
              <td>
                <span className="status pending">Pending</span>
              </td>
              <td>$80</td>
            </tr>
            <tr>
              <td>#003</td>
              <td>
                <span className="status shipped">Shipped</span>
              </td>
              <td>$200</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;