// src/components/Dashboard.jsx
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

  // Fetch all totals data
  useEffect(() => {
    axios
      .get('https://dl-api-v-01.vercel.app/api/table-totals')
      .then((response) => setTotalsList(response.data))
      .catch((error) => console.error('Error fetching totals:', error));
  }, []);

  // Fetch report list data
  useEffect(() => {
    axios
      .get('https://dl-api-v-01.vercel.app/api/reports')
      .then((response) => setReportList(response.data))
      .catch((error) => console.error('Error fetching reports:', error));
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
    // Return the latest entry for the period, or null if none
    if (!filtered.length) return null;
    return filtered.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
  };

  const totals = getFilteredTotals();

  // Helper to format date (only date, no time)
  const getFormattedDate = (dateStr) => {
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('km-KH', { timeZone: 'Asia/Phnom_Penh' });
    }
    return dateStr;
  };

  // Helper to summarize ice orders for display
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

  // --- Bar Chart for all data from API ---
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
      // Show all data from API for Day
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

        {/* Bar Chart for Day, Week, Month, Year for all KPIs */}
        {barChartData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        )}

        {/* Date/Time Info */}
        {totals && totals.date && (
          <div className="mb-4 text-gray-700 font-medium">
            Date: {getFormattedDate(totals.date)}
          </div>
        )}

        {/* Dynamic KPI Cards */}
        {totals && (
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
        {!totals && (
          <div className="text-gray-500 mb-8">No data for this period.</div>
        )}

        {/* Report List Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Customer Reports</h2>
          {reportList.length === 0 ? (
            <div className="text-gray-500">No report data.</div>
          ) : (
            reportList.map(report => (
              <div key={report._id} className="mb-6 bg-white rounded-lg shadow-md p-4">
                <div className="font-medium text-gray-700 mb-2">
                  Date: {getFormattedDate(report.date)}
                </div>
                {/* Added custom header text */}
                <div className="mb-2 font-semibold text-black">
                  Customer&nbsp;&nbsp;New Debt&nbsp;&nbsp;Payment&nbsp;&nbsp;Total Debt
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">New Debt</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black">Total Debt</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.customersData.map(customer => (
                        <tr key={customer._id}>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.customerName}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.newDebt}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.payment}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{customer.totalDebt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;