import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'tailwindcss/tailwind.css';
import './style/dashboardStyle.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PERIODS = ['Day', 'Week', 'Month', 'Year'];

const Dashboard = () => {
  const [totalsList, setTotalsList] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('Day');
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportDate, setSelectedReportDate] = useState(null);

  // Fetch all totals data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('https://dl-api-v-01.vercel.app/api/table-totals'),
      axios.get('https://dl-api-v-01.vercel.app/api/reports')
    ])
      .then(([totalsRes, reportsRes]) => {
        // Filter out reports with empty customersData
        const validReports = reportsRes.data.filter(r => r.customersData && r.customersData.length > 0);
        setTotalsList(totalsRes.data);
        setReportList(validReports);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to filter data by period
  const getFilteredTotals = () => {
    if (!totalsList.length) return null;
    const now = new Date();
    let filtered = [];
    if (chartPeriod === 'Day') {
      filtered = totalsList.filter(item => {
        const d = new Date(item.date);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      });
    } else if (chartPeriod === 'Week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      filtered = totalsList.filter(item => {
        const d = new Date(item.date);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } else if (chartPeriod === 'Month') {
      filtered = totalsList.filter(item => {
        const d = new Date(item.date);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      });
    } else if (chartPeriod === 'Year') {
      filtered = totalsList.filter(item => {
        const d = new Date(item.date);
        return d.getFullYear() === now.getFullYear();
      });
    }
    if (!filtered.length) return null;
    return filtered.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
  };

  const totals = getFilteredTotals();

  // Helper to format date
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' });
    }
    return dateStr;
  };

  // Helper to summarize ice orders
  const summarizeIceOrders = (iceOrders) => {
    if (!iceOrders) return '';
    const types = Object.keys(iceOrders);
    return types
      .map(type => {
        const totalQty = (iceOrders[type] || []).reduce((sum, o) => sum + (o.quantity || 0), 0);
        return totalQty > 0 ? `${type}: ${totalQty}` : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  // Bar Chart data
  let barChartData = null;
  let barChartOptions = null;

  const KPI_KEYS = [
    'totalQuantity',
    'totalPrevDebt',
    'totalNewDebt',
    'totalPayment',
    'totalTotalDebt',
    'totalNetIncome'
  ];

  const prettyLabels = {
    totalQuantity: 'Total Quantity',
    totalPrevDebt: 'Total Prev Debt',
    totalNewDebt: 'Total New Debt',
    totalPayment: 'Total Payment',
    totalTotalDebt: 'Total Total Debt',
    totalNetIncome: 'Total Net Income'
  };

  if (totalsList.length > 0) {
    if (chartPeriod === 'Day') {
      const sortedTotals = [...totalsList].sort((a, b) => new Date(a.date) - new Date(b.date));
      const labels = sortedTotals.map(item =>
        new Date(item.date).toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' })
      );
      const kpiData = KPI_KEYS.map(key =>
        sortedTotals.map(item => item[key] || 0)
      );
      barChartData = {
        labels,
        datasets: KPI_KEYS.map((key, idx) => ({
          label: prettyLabels[key],
          data: kpiData[idx],
          backgroundColor: [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#6366f1', '#f43f5e', '#22d3ee', '#a3e635'
          ][idx % 9],
          stack: 'Stack 0'
        })),
      };
      barChartOptions = {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: {
            display: true,
            text: 'KPIs (All Data)',
          },
        },
        scales: {
          y: { beginAtZero: true },
        },
      };
    } else if (['Week', 'Month', 'Year'].includes(chartPeriod)) {
      const now = new Date();
      let labels = [];
      let kpiData = KPI_KEYS.map(() => []);

      if (chartPeriod === 'Week') {
        let startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          return d;
        });
        labels = days.map(d => d.toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' }));
        days.forEach((day, idx) => {
          const entry = totalsList.find(item => {
            const d = new Date(item.date);
            return (
              d.getFullYear() === day.getFullYear() &&
              d.getMonth() === day.getMonth() &&
              d.getDate() === day.getDate()
            );
          });
          KPI_KEYS.forEach((key, kidx) => {
            kpiData[kidx][idx] = entry ? entry[key] || 0 : 0;
          });
        });
      } else if (chartPeriod === 'Month') {
        labels = Array.from({ length: 12 }).map((_, i) =>
          new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' })
        );
        labels.forEach((_, i) => {
          const monthEntries = totalsList.filter(item => {
            const d = new Date(item.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === i;
          });
          let latest = null;
          if (monthEntries.length) {
            latest = monthEntries.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
          }
          KPI_KEYS.forEach((key, kidx) => {
            kpiData[kidx][i] = latest ? latest[key] || 0 : 0;
          });
        });
      } else if (chartPeriod === 'Year') {
        const years = [...new Set(totalsList.map(item => new Date(item.date).getFullYear()))].sort((a, b) => a - b);
        labels = years.map(y => y.toString());
        years.forEach((year, i) => {
          const yearEntries = totalsList.filter(item => new Date(item.date).getFullYear() === year);
          let latest = null;
          if (yearEntries.length) {
            latest = yearEntries.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
          }
          KPI_KEYS.forEach((key, kidx) => {
            kpiData[kidx][i] = latest ? latest[key] || 0 : 0;
          });
        });
      }

      barChartData = {
        labels,
        datasets: KPI_KEYS.map((key, idx) => ({
          label: prettyLabels[key],
          data: kpiData[idx],
          backgroundColor: [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#6366f1', '#f43f5e', '#22d3ee', '#a3e635'
          ][idx % 9],
          stack: 'Stack 0'
        })),
      };
      barChartOptions = {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: {
            display: true,
            text:
              chartPeriod === 'Week'
                ? 'KPIs (This Week)'
                : chartPeriod === 'Month'
                ? 'KPIs (This Year by Month)'
                : 'KPIs (All Years)',
          },
        },
        scales: {
          y: { beginAtZero: true },
        },
      };
    }
  }

  // Get unique sorted report dates for reports with non-empty customersData
  const reportDates = reportList
    .filter(r => r.customersData && r.customersData.length > 0)
    .map(r => r.date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));

  // Find the report for the selected date
  const selectedReport = reportList.find(r => r.date === selectedReportDate);

  useEffect(() => {
    if (reportDates.length && !selectedReportDate) {
      setSelectedReportDate(reportDates[0]);
    } else if (!reportDates.length) {
      setSelectedReportDate(null);
    }
  }, [reportDates.length]);

  // Handle customer deletion
  const handleDeleteCustomer = async (reportId, customerId) => {
    if (window.confirm('Are you sure you want to delete this customer info?')) {
      try {
        setLoading(true);
        // Delete customer from report
        await axios.delete(`https://dl-api-v-01.vercel.app/api/reports/${reportId}/customer/${customerId}`);
        // Update reportList in state
        let updatedReportList = reportList.map(r => {
          if (r._id === reportId) {
            return {
              ...r,
              customersData: r.customersData.filter(c => c._id !== customerId)
            };
          }
          return r;
        });
        // Remove report if no customers remain
        const updatedReport = updatedReportList.find(r => r._id === reportId);
        if (updatedReport && updatedReport.customersData.length === 0) {
          await axios.delete(`https://dl-api-v-01.vercel.app/api/reports/${reportId}`);
          updatedReportList = updatedReportList.filter(r => r._id !== reportId);
          // Select the next available report date or null
          const newReportDates = updatedReportList
            .filter(r => r.customersData && r.customersData.length > 0)
            .map(r => r.date)
            .sort((a, b) => new Date(b) - new Date(a));
          setSelectedReportDate(newReportDates[0] || null);
        }
        setReportList(updatedReportList);
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle delete user from table-totals
  const handleDeleteTableTotalsUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user info?')) {
      try {
        setLoading(true);
        await axios.delete(`https://dl-api-v-01.vercel.app/api/table-totals/${userId}`);
        setTotalsList(prev => prev.filter(user => user._id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ice Business Dashboard</h1>
            <p className="text-gray-600">Welcome back, User!</p>
          </div>
          <div className="flex items-center space-x-3">
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-700 font-medium">User Name</span>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-4 flex space-x-2">
          {PERIODS.map(period => (
            <button
              key={period}
              className={`px-4 py-2 rounded-md ${chartPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setChartPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="container">
            <div className="row">
              <div className="col-md-12 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-dark" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {!loading && barChartData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        )}

        {/* Date/Time Info */}
        {!loading && totals && totals.date && (
          <div className="mb-4 text-gray-700 font-medium">
            Date: {getFormattedDate(totals.date)}
          </div>
        )}

        {/* Dynamic KPI Cards */}
        {!loading && totals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {KPI_KEYS.map(key => (
              <div key={key} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">
                  {prettyLabels[key] || key}
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {typeof totals[key] === 'number' ? totals[key].toLocaleString() : totals[key]}
                </p>
              </div>
            ))}
          </div>
        )}
        {!loading && !totals && (
          <div className="text-gray-500 mb-8">No data for this period.</div>
        )}

        {/* Report List Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Customer Reports</h2>
          {loading ? (
            <div className="container">
              <div className="row">
                <div className="col-md-12 d-flex justify-content-center align-items-center">
                  <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : reportList.length === 0 || reportDates.length === 0 ? (
            <div className="text-gray-500">No report data available.</div>
          ) : (
            <>
              {/* Date selector */}
              <div className="mb-4 flex items-center space-x-2">
                <label className="font-medium text-black">Select Date:</label>
                <select
                  className="border rounded px-2 py-1 text-black bg-white"
                  value={selectedReportDate || ''}
                  onChange={e => setSelectedReportDate(e.target.value)}
                >
                  {reportDates.map(date => (
                    <option key={date} value={date}>
                      {getFormattedDate(date)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Show selected report */}
              {selectedReport && selectedReport.customersData.length > 0 ? (
                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                  <div className="font-medium text-gray-700 mb-2">
                    Date: {getFormattedDate(selectedReport.date)}
                  </div>
                  <div className="mb-2 font-semibold text-black">
                    Customer  New Debt  Payment  Total Debt
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">New Debt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Payment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Total Debt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReport.customersData.map(customer => (
                          <tr key={customer._id}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.customerName}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.newDebt}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.payment}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.totalDebt}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm">
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                onClick={() => handleDeleteCustomer(selectedReport._id, customer._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No customers in this report.</div>
              )}
            </>
          )}
        </div>

        {/* Table-Totals User List Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">All Table Totals</h2>
          {loading ? (
            <div className="container">
              <div className="row">
                <div className="col-md-12 d-flex justify-content-center align-items-center">
                  <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : totalsList.length === 0 ? (
            <div className="text-gray-500">No table-totals data available.</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4 mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Total Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Prev Debt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">New Debt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Total Debt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Net Income</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {totalsList.map(user => (
                    <tr key={user._id}>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{getFormattedDate(user.date)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalQuantity}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalPrevDebt}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalNewDebt}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalPayment}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalTotalDebt}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.totalNetIncome}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          onClick={() => handleDeleteTableTotalsUser(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;