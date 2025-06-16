import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiLayout, FiShoppingBag, FiBarChart2, FiCalendar, FiFileText, FiBell, FiMessageCircle, FiSettings, FiUser } from 'react-icons/fi'

function Dashboardmenu() {
  const location = useLocation();

  // Sidebar menu items with icons
  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FiLayout /> },
    { to: "/IceOrderForm", label: "Ice Order Form", icon: <FiShoppingBag /> },
    { to: "/addbanner", label: "Add Banner", icon: <FiBarChart2 /> },
    { to: "/stock", label: "Stock", icon: <FiCalendar /> },
    { to: "/image", label: "Image", icon: <FiFileText /> }
  ];

  // Account items
  const accountItems = [
    { to: "/notification", label: "Notification", icon: <FiBell /> },
    { to: "/chat", label: "Chat", icon: <FiMessageCircle /> },
    { to: "/settings", label: "Settings", icon: <FiSettings /> }
  ];

  return (
    <nav
      className="sidebar-clean"
      style={{
        width: '260px',
        background: '#fff',
        borderRight: '1px solid #eee',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        padding: '32px 0 16px 0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* Logo and company name */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <img
            src="path/to/logo.png"
            alt="Company Logo"
            style={{ width: '48px', height: '48px', marginBottom: '8px', borderRadius: '50%' }}
          />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#222', letterSpacing: 1 }}>
            Company Name
          </span>
        </div>
        {/* Main menu */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map(item => (
            <li
              key={item.to}
              className={location.pathname === item.to ? "sidebar-item active" : "sidebar-item"}
              style={{
                marginBottom: '8px'
              }}
            >
              <Link
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  color: location.pathname === item.to ? '#fff' : '#222',
                  background: location.pathname === item.to ? '#ff5c1a' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: location.pathname === item.to ? 600 : 500,
                  fontSize: '1rem',
                  transition: 'background 0.2s, color 0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Account section */}
        <div style={{ margin: '32px 0 0 0', padding: '0 28px', color: '#aaa', fontSize: '0.9rem', fontWeight: 500 }}>
          Account
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {accountItems.map(item => (
            <li key={item.to} style={{ marginBottom: '8px' }}>
              <Link
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  color: '#222',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '1rem',
                  transition: 'background 0.2s, color 0.2s'
                }}
              >
                <span style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* User profile at the bottom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 28px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <img
          src="path/to/avatar.jpg"
          alt="User"
          style={{ width: '38px', height: '38px', borderRadius: '50%' }}
        />
        <span style={{ fontWeight: 500, color: '#222' }}>
          © Sokchan &amp; Thaingoun
        </span>
        <span style={{ marginLeft: 'auto', color: '#bbb', fontSize: '1.5rem' }}>...</span>
      </div>
    </nav>
  )
}

export default Dashboardmenu;

