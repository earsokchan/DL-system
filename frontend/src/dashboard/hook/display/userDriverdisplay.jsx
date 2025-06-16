// import React, { useState, useEffect } from 'react';
// import IceOrderForm from '../userDriver';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// const Display = () => {
//     const [customers, setCustomers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [editingCustomer, setEditingCustomer] = useState(null);
//     const [showEditModal, setShowEditModal] = useState(false);
//     const [reportDebts, setReportDebts] = useState({});
//     const [currentPage, setCurrentPage] = useState(1);
//     const pageSize = 5; // Number of customers per page

//     const fetchCustomers = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const response = await fetch('https://dl-api-v-01.vercel.app/api/orders');
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to fetch customer data.');
//             }
//             const data = await response.json();
//             setCustomers(data);
//         } catch (err) {
//             console.error('Error fetching customers:', err);
//             setError(err.message || 'An unexpected error occurred while fetching data.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchLatestReportDebts = async () => {
//         try {
//             const res = await fetch('https://dl-api-v-01.vercel.app/api/reports');
//             if (!res.ok) return;
//             const reports = await res.json();
//             if (!Array.isArray(reports) || reports.length === 0) return;
//             const latestReport = reports.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
//             const debts = {};
//             (latestReport.customersData || []).forEach(cust => {
//                 debts[cust.customerName] = cust.totalDebt;
//             });
//             setReportDebts(debts);
//         } catch (e) {
//             // ignore error, fallback to 0
//         }
//     };

//     useEffect(() => {
//         fetchCustomers();
//         fetchLatestReportDebts();
//     }, []);

//     const calculateTotalRevenue = (iceOrders) => {
//         if (!iceOrders) return 0;
//         let total = 0;
//         Object.values(iceOrders).forEach((orders) => {
//             orders.forEach((order) => {
//                 const quantity = parseFloat(order.quantity) || 0;
//                 const price = parseFloat(order.price) || 0;
//                 total += quantity * price;
//             });
//         });
//         return total;
//     };

//     const calculateTotalQuantity = (iceOrders, iceTypeKey = null) => {
//         if (!iceOrders) return 0;
//         let totalQuantity = 0;
//         if (iceTypeKey) {
//             const orders = iceOrders[iceTypeKey] || [];
//             orders.forEach((order) => {
//                 totalQuantity += parseFloat(order.quantity) || 0;
//             });
//         } else {
//             Object.values(iceOrders).forEach((orders) => {
//                 orders.forEach((order) => {
//                     totalQuantity += parseFloat(order.quantity) || 0;
//                 });
//             });
//         }
//         return totalQuantity;
//     };

//     const handleDelete = async (id) => {
//         if (window.confirm('តើអ្នកពិតជាចង់លុបកំណត់ត្រាអតិថិជននេះមែនទេ?')) {
//             try {
//                 const response = await fetch(`https://dl-api-v-01.vercel.app/api/orders/${id}`, {
//                     method: 'DELETE',
//                 });

//                 if (!response.ok) {
//                     const errorData = await response.json();
//                     throw new Error(errorData.message || 'Failed to delete customer data.');
//                 }

//                 setCustomers(customers.filter((customer) => customer._id !== id));
//             } catch (err) {
//                 console.error('Error deleting customer:', err);
//                 setError(err.message || 'An unexpected error occurred during deletion.');
//             }
//         }
//     };

//     const handleEdit = (customer) => {
//         setEditingCustomer(customer);
//         setShowEditModal(true);
//     };

//     const handleUpdateSuccess = (updatedCustomer) => {
//         setCustomers(customers.map(cust =>
//             cust._id === updatedCustomer._id ? updatedCustomer : cust
//         ));
//         setShowEditModal(false);
//         setEditingCustomer(null);
//     };

//     const handleCloseEditModal = () => {
//         setShowEditModal(false);
//         setEditingCustomer(null);
//     };

//     const handleRefresh = () => {
//         setLoading(true);
//         fetchCustomers();
//         fetchLatestReportDebts();
//     };

//     const saveReportAndGeneratePdf = async () => {
//         try {
//             const reportData = {
//                 date: new Date().toISOString(),
//                 customersData: customers
//             };

//             const dbResponse = await fetch('https://dl-api-v-01.vercel.app/api/reports', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(reportData),
//             });

//             if (!dbResponse.ok) {
//                 const errorData = await dbResponse.json();
//                 throw new Error(errorData.message || 'Failed to save report to database.');
//             }

//             alert('Report saved to database!');
//         } catch (err) {
//             console.error('Error saving report:', err);
//             setError(err.message || 'An unexpected error occurred during report save.');
//         }
//     };

//     const saveTableTotalsToApi = async () => {
//         try {
//             const currentTableTotals = calculateTableTotals();
//             const response = await fetch('https://dl-api-v-01.vercel.app/api/table-totals', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(currentTableTotals),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to save table totals to API.');
//             }

//             alert('Table totals saved successfully!');
//         } catch (err) {
//             console.error('Error saving table totals:', err);
//             setError(err.message || 'An unexpected error occurred while saving table totals.');
//         }
//     };

//     const handleSaveAndExport = async () => {
//         await saveReportAndGeneratePdf();
//         await saveTableTotalsToApi();
//         handleExportToExcel();
//     };

//     const handleExportToExcel = () => {
//         const dataForExcel = [];
//         dataForExcel.push([
//             'ល.រ', 'គោត្តនាម', 'ប្រភេទទឹកកក', 'សរុបបរិមាណទឹកកក', 'បរិមាណ', 'តម្លៃរាយ',
//             'សរុប', 'ប្រាក់ជំពាក់ចាស់', 'ប្រាក់ជំពាក់ថ្មី', 'ប្រាក់សង', 'សរុបប្រាក់ជំពាក់',
//             'ថ្លៃសាំង បាយ', 'សរុបចំណូល'
//         ]);

//         const iceTypes = [
//             { key: 'originalIce', label: 'ទឹកកកដើម' },
//             { key: 'largeHygiene20kg', label: 'ទឹកកកអនាម័យធំ 20kg' },
//             { key: 'largeHygiene30kg', label: 'ទឹកកកអនាម័យធំ 30kg' },
//             { key: 'smallHygiene20kg', label: 'ទឹកកកអនាម័យតូច 20kg' },
//             { key: 'smallHygiene2kg', label: 'ទឹកកកអនាម័យតូច 2kg' },
//         ];

//         customers.forEach((customer, custIndex) => {
//             let firstRowForCustomer = true;
//             let totalValidOrdersAcrossAllTypes = 0;
//             iceTypes.forEach((type) => {
//                 const orders = customer.iceOrders?.[type.key] || [];
//                 totalValidOrdersAcrossAllTypes += orders.filter((order) => order.quantity || order.price).length;
//             });

//             if (totalValidOrdersAcrossAllTypes === 0) {
//                 dataForExcel.push([
//                     custIndex + 1,
//                     customer.customerName,
//                     '-',
//                     0,
//                     0,
//                     0,
//                     0,
//                     reportDebts[customer.customerName] !== undefined ? reportDebts[customer.customerName] : (customer.previousDebt || 0),
//                     customer.newDebt || 0,
//                     customer.payment || 0,
//                     customer.totalDebt !== undefined ? customer.totalDebt : 'N/A',
//                     customer.expenses || 0,
//                     (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0))
//                 ]);
//             } else {
//                 iceTypes.forEach((type) => {
//                     const orders = customer.iceOrders?.[type.key] || [];
//                     const validTypeOrders = orders.filter((order) => order.quantity !== 0 || order.price !== 0);
//                     if (validTypeOrders.length > 0) {
//                         validTypeOrders.forEach((order, orderIndex) => {
//                             const totalPerIceType = (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);
//                             const row = [];
//                             if (firstRowForCustomer) {
//                                 row.push(custIndex + 1);
//                                 row.push(customer.customerName);
//                             } else {
//                                 row.push('', '');
//                             }
//                             if (orderIndex === 0) {
//                                 row.push(type.label);
//                                 row.push(calculateTotalQuantity(customer.iceOrders, type.key));
//                             } else {
//                                 row.push('', '');
//                             }
//                             row.push(order.quantity);
//                             row.push(order.price);
//                             row.push(totalPerIceType);
//                             if (firstRowForCustomer) {
//                                 row.push(reportDebts[customer.customerName] !== undefined
//                                     ? reportDebts[customer.customerName]
//                                     : (customer.previousDebt || 0));
//                                 row.push(customer.newDebt || 0);
//                                 row.push(customer.payment || 0);
//                                 row.push(customer.totalDebt !== undefined ? customer.totalDebt : 'N/A');
//                                 row.push(customer.expenses || 0);
//                                 row.push(calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
//                             } else {
//                                 row.push('', '', '', '', '', '');
//                             }
//                             dataForExcel.push(row);
//                             firstRowForCustomer = false;
//                         });
//                     }
//                 });
//             }
//         });

//         const tableTotals = calculateTableTotals();
//         dataForExcel.push([
//             'សរុប', '', '',
//             tableTotals.totalIceQuantity,
//             tableTotals.totalQuantity,
//             tableTotals.totalPrice,
//             tableTotals.totalRevenue,
//             tableTotals.totalPrevDebt,
//             tableTotals.totalNewDebt,
//             tableTotals.totalPayment,
//             tableTotals.totalTotalDebt,
//             tableTotals.totalExpenses,
//             tableTotals.totalNetIncome
//         ]);

//         const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
//         const wscols = [
//             { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
//             { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
//         ];
//         ws['!cols'] = wscols;

//         let currentRow = 1;
//         customers.forEach(customer => {
//             let numRowsForCustomer = 0;
//             const customerIceTypes = [
//                 'originalIce', 'largeHygiene20kg', 'largeHygiene30kg',
//                 'smallHygiene20kg', 'smallHygiene2kg'
//             ];
//             customerIceTypes.forEach(typeKey => {
//                 const orders = customer.iceOrders?.[typeKey] || [];
//                 numRowsForCustomer += orders.filter(order => order.quantity !== 0 || order.price !== 0).length;
//             });
//             if (numRowsForCustomer === 0) numRowsForCustomer = 1;
//             if (numRowsForCustomer > 1) {
//                 ws['!merges'] = ws['!merges'] || [];
//                 ws['!merges'].push(XLSX.utils.decode_range(`A${currentRow + 1}:A${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`B${currentRow + 1}:B${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`H${currentRow + 1}:H${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`I${currentRow + 1}:I${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`J${currentRow + 1}:J${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`K${currentRow + 1}:K${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`L${currentRow + 1}:L${currentRow + numRowsForCustomer}`));
//                 ws['!merges'].push(XLSX.utils.decode_range(`M${currentRow + 1}:M${currentRow + numRowsForCustomer}`));
//                 let currentIceTypeRow = currentRow;
//                 customerIceTypes.forEach(typeKey => {
//                     const orders = customer.iceOrders?.[typeKey] || [];
//                     const validTypeOrders = orders.filter(order => order.quantity !== 0 || order.price !== 0);
//                     if (validTypeOrders.length > 1) {
//                         ws['!merges'].push(XLSX.utils.decode_range(`C${currentIceTypeRow + 1}:C${currentIceTypeRow + validTypeOrders.length}`));
//                         ws['!merges'].push(XLSX.utils.decode_range(`D${currentIceTypeRow + 1}:D${currentIceTypeRow + validTypeOrders.length}`));
//                     }
//                     currentIceTypeRow += validTypeOrders.length;
//                 });
//             }
//             currentRow += numRowsForCustomer;
//         });
//         ws['!merges'] = ws['!merges'] || [];
//         ws['!merges'].push(XLSX.utils.decode_range(`A${currentRow + 1}:C${currentRow + 1}`));

//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');
//         const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//         const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
//         const now = new Date();
//         const dateTimeString = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
//         const fileName = `Customer_Report_${dateTimeString}.xlsx`;
//         saveAs(data, fileName);
//     };

//     const iceTypeLabels = {
//         originalIce: 'ទឹកកកដើម',
//         largeHygiene20kg: 'ទឹកកកអនាម័យធំ 20kg',
//         largeHygiene30kg: 'ទឹកកកអនាម័យធំ 30kg',
//         smallHygiene20kg: 'ទឹកកកអនាម័យតូច 20kg',
//         smallHygiene2kg: 'ទឹកកកអនាម័យតូច 2kg',
//     };

//     const calculateTableTotals = () => {
//         let totalIceQuantity = 0;
//         let totalQuantity = 0;
//         let totalPrice = 0;
//         let totalRevenue = 0;
//         let totalPrevDebt = 0;
//         let totalNewDebt = 0;
//         let totalPayment = 0;
//         let totalTotalDebt = 0;
//         let totalExpenses = 0;
//         let totalNetIncome = 0;

//         customers.forEach(customer => {
//             const iceTypes = [
//                 'originalIce', 'largeHygiene20kg', 'largeHygiene30kg',
//                 'smallHygiene20kg', 'smallHygiene2kg'
//             ];
//             iceTypes.forEach(typeKey => {
//                 const orders = customer.iceOrders?.[typeKey] || [];
//                 orders.forEach(order => {
//                     totalIceQuantity += parseFloat(order.quantity) || 0;
//                     totalQuantity += parseFloat(order.quantity) || 0;
//                     totalPrice += parseFloat(order.price) || 0;
//                     totalRevenue += (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);
//                 });
//             });
//             totalPrevDebt += reportDebts[customer.customerName] !== undefined
//                 ? parseFloat(reportDebts[customer.customerName]) || 0
//                 : (parseFloat(customer.previousDebt) || 0);
//             totalNewDebt += parseFloat(customer.newDebt) || 0;
//             totalPayment += parseFloat(customer.payment) || 0;
//             totalTotalDebt += customer.totalDebt !== undefined ? parseFloat(customer.totalDebt) || 0 : 0;
//             totalExpenses += parseFloat(customer.expenses) || 0;
//             totalNetIncome += (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
//         });

//         return {
//             totalIceQuantity,
//             totalQuantity,
//             totalPrice,
//             totalRevenue,
//             totalPrevDebt,
//             totalNewDebt,
//             totalPayment,
//             totalTotalDebt,
//             totalExpenses,
//             totalNetIncome
//         };
//     };

//     const totals = calculateTableTotals();

//     if (loading) {
//         return (
//             <div style={styles.loadingContainer}>
//                 <div style={styles.loadingCard}>
//                     <div style={styles.spinner}></div>
//                     <p style={styles.loadingText}>កំពុងផ្ទុកទិន្នន័យ...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div style={styles.errorContainer}>
//                 <div style={styles.errorCard}>
//                     <div style={styles.errorIcon}>⚠️</div>
//                     <p style={styles.errorText}>កំហុស: {error}</p>
//                     <button onClick={() => window.location.reload()} style={styles.retryButton}>
//                         ព្យាយាមម្តងទៀត
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     // Calculate total pages based on customers length
//     const totalPages = Math.ceil(customers.length / pageSize);

//     // Handler for pagination
//     const handlePageChange = (direction) => {
//         if (direction === 'prev') {
//             setCurrentPage((prev) => Math.max(1, prev - 1));
//         } else if (direction === 'next') {
//             setCurrentPage((prev) => Math.min(totalPages, prev + 1));
//         }
//     };

//     // Get customers for current page
//     const paginatedCustomers = customers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

//     return (
//         <div style={styles.container}>
//             <div style={styles.content}>
//                 {/* Header */}
//                 <div style={styles.headerCard}>
//                     <div style={styles.headerContent}>
//                         <div>
//                             <h1 style={styles.title}>🧊 តារាងអតិថិជន</h1>
//                             <p style={styles.subtitle}>Customer Management Dashboard</p>
//                             <div style={styles.headerStats}>
//                                 <span style={styles.statItem}>
//                                     👥 <strong>{customers.length}</strong> អតិថិជន
//                                 </span>
//                                 <span style={styles.statItem}>
//                                     💰 <strong>${totals.totalRevenue.toLocaleString()}</strong> ចំណូលសរុប
//                                 </span>
//                                 <span style={styles.statItem}>
//                                     📦 <strong>{totals.totalQuantity}</strong> បរិមាណសរុប
//                                 </span>
//                             </div>
//                         </div>
//                         <div style={styles.headerButtons}>
//                             <button style={styles.outlineButton} onClick={handleSaveAndExport}>
//                                 💾 Save & Export
//                             </button>
//                             <button onClick={handleRefresh} style={styles.primaryButton}>
//                                 🔄 Refresh
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Summary Cards */}
//                 <div style={styles.summaryGrid}>
//                     <div style={{ ...styles.summaryCard, ...styles.blueCard }}>
//                         <div style={styles.summaryContent}>
//                             <div>
//                                 <p style={styles.summaryLabel}>អតិថិជនសរុប</p>
//                                 <p style={styles.summaryValue}>{customers.length}</p>
//                             </div>
//                             <div style={styles.summaryIcon}>👥</div>
//                         </div>
//                     </div>
//                     <div style={{ ...styles.summaryCard, ...styles.greenCard }}>
//                         <div style={styles.summaryContent}>
//                             <div>
//                                 <p style={styles.summaryLabel}>ចំណូលសរុប</p>
//                                 <p style={styles.summaryValue}>${totals.totalRevenue.toLocaleString()}</p>
//                             </div>
//                             <div style={styles.summaryIcon}>💰</div>
//                         </div>
//                     </div>
//                     <div style={{ ...styles.summaryCard, ...styles.purpleCard }}>
//                         <div style={styles.summaryContent}>
//                             <div>
//                                 <p style={styles.summaryLabel}>បរិមាណសរុប</p>
//                                 <p style={styles.summaryValue}>{totals.totalQuantity}</p>
//                             </div>
//                             <div style={styles.summaryIcon}>📦</div>
//                         </div>
//                     </div>
//                     <div style={{ ...styles.summaryCard, ...styles.orangeCard }}>
//                         <div style={styles.summaryContent}>
//                             <div>
//                                 <p style={styles.summaryLabel}>ចំណូលសុទ្ធ</p>
//                                 <p style={styles.summaryValue}>${totals.totalNetIncome.toLocaleString()}</p>
//                             </div>
//                             <div style={styles.summaryIcon}>📈</div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Customer Cards */}
//                 <div style={styles.customerSection}>
//                     <div style={styles.customerHeader}>
//                         <h2 style={styles.customerTitle}>👥 បញ្ជីអតិថិជន</h2>
//                     </div>
//                     <div style={styles.customerContent}>
//                         {customers.length === 0 ? (
//                             <div style={styles.emptyState}>
//                                 <div style={styles.emptyIcon}>📋</div>
//                                 <h2 style={styles.emptyTitle}>មិនមានទិន្នន័យអតិថិជនទេ</h2>
//                                 <p style={styles.emptySubtitle}>No customer data available</p>
//                             </div>
//                         ) : (
//                             <div style={styles.customerList}>
//                                 {paginatedCustomers.map((customer, index) => (
//                                     <div key={customer._id} style={styles.customerCard}>
//                                         <div style={styles.customerCardContent}>
//                                             <div style={styles.customerInfo}>
//                                                 <div style={styles.customerHeader}>
//                                                     <span style={styles.customerBadge}>#{index + 1}</span>
//                                                     <h3 style={styles.customerName}>{customer.customerName}</h3>
//                                                 </div>
//                                                 <div style={styles.iceOrdersSection}>
//                                                     <h4 style={styles.iceOrdersTitle}>🧊 ប្រភេទទឹកកក:</h4>
//                                                     <div style={styles.iceOrdersGrid}>
//                                                         {Object.entries(customer.iceOrders || {}).map(([type, orders]) => {
//                                                             if (!orders || orders.length === 0) return null;
//                                                             return (
//                                                                 <div key={type} style={styles.iceOrderCard}>
//                                                                     <p style={styles.iceOrderType}>{iceTypeLabels[type]}</p>
//                                                                     {orders.map((order, idx) => (
//                                                                         <div key={idx} style={styles.iceOrderDetails}>
//                                                                             <span>បរិមាណ: {order.quantity}</span>
//                                                                             <span style={styles.priceText}>តម្លៃ: ${order.price}</span>
//                                                                         </div>
//                                                                     ))}
//                                                                 </div>
//                                                             );
//                                                         })}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                             <div style={styles.financialSection}>
//                                                 <div style={styles.financialCard}>
//                                                     <h4 style={styles.financialTitle}>💳 ព័ត៌មានហិរញ្ញវត្ថុ</h4>
//                                                     <div style={styles.financialList}>
//                                                         <div style={styles.financialItem}>
//                                                             <span>ចំណូលសរុប:</span>
//                                                             <span style={styles.revenueText}>
//                                                                 ${calculateTotalRevenue(customer.iceOrders).toLocaleString()}
//                                                             </span>
//                                                         </div>
//                                                         <div style={styles.financialItem}>
//                                                             <span>ប្រាក់ជំពាក់ចាស់:</span>
//                                                             <span style={styles.debtText}>
//                                                                 ${reportDebts[customer.customerName] !== undefined
//                                                                     ? reportDebts[customer.customerName]
//                                                                     : (customer.previousDebt || 0)}
//                                                             </span>
//                                                         </div>
//                                                         <div style={styles.financialItem}>
//                                                             <span>ប្រាក់ជំពាក់ថ្មី:</span>
//                                                             <span style={styles.newDebtText}>${customer.newDebt || 0}</span>
//                                                         </div>
//                                                         <div style={styles.financialItem}>
//                                                             <span>ប្រាក់សង:</span>
//                                                             <span style={styles.paymentText}>${customer.payment || 0}</span>
//                                                         </div>
//                                                         <div style={styles.separator}></div>
//                                                         <div style={{ ...styles.financialItem, ...styles.totalDebtItem }}>
//                                                             <span>សរុបប្រាក់ជំពាក់:</span>
//                                                             <span style={styles.totalDebtText}>${customer.totalDebt || 0}</span>
//                                                         </div>
//                                                         <div style={styles.financialItem}>
//                                                             <span>ថ្លៃចំណាយ:</span>
//                                                             <span style={styles.expenseText}>${customer.expenses || 0}</span>
//                                                         </div>
//                                                         <div style={{ ...styles.financialItem, ...styles.netIncomeItem }}>
//                                                             <span>ចំណូលសុទ្ធ:</span>
//                                                             <span style={styles.netIncomeText}>
//                                                                 ${(calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0)).toLocaleString()}
//                                                             </span>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div style={styles.actionButtons}>
//                                                     <button onClick={() => handleEdit(customer)} style={styles.editButton}>
//                                                         ✏️ កែសម្រួល
//                                                     </button>
//                                                     <button onClick={() => handleDelete(customer._id)} style={styles.deleteButton}>
//                                                         🗑️ លុប
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}

//                                 {/* Pagination controls */}
//                                 <div style={styles.pagination}>
//                                     <button
//                                         style={styles.pageButton}
//                                         onClick={() => handlePageChange('prev')}
//                                         disabled={currentPage === 1}
//                                     >
//                                         ◀️ មុននេះ
//                                     </button>
//                                     <span style={styles.pageInfo}>
//                                         ទំព័រ {currentPage} នៃ {totalPages}
//                                     </span>
//                                     <button
//                                         style={styles.pageButton}
//                                         onClick={() => handlePageChange('next')}
//                                         disabled={currentPage === totalPages || totalPages === 0}
//                                     >
//                                         អន្ទាក់ក្រោយ ▶️
//                                     </button>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Summary Totals */}
//                 <div style={styles.totalsSection}>
//                     <h2 style={styles.totalsTitle}>🏆 សរុបទាំងអស់</h2>
//                     <div style={styles.totalsGrid}>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>បរិមាណសរុប</p>
//                             <p style={styles.totalValue}>{totals.totalQuantity}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ចំណូលសរុប</p>
//                             <p style={{ ...styles.totalValue, color: "#10b981" }}>${totals.totalRevenue.toLocaleString()}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ប្រាក់ជំពាក់ចាស់</p>
//                             <p style={{ ...styles.totalValue, color: "#f59e0b" }}>${totals.totalPrevDebt.toLocaleString()}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ប្រាក់ជំពាក់ថ្មី</p>
//                             <p style={{ ...styles.totalValue, color: "#ef4444" }}>${totals.totalNewDebt.toLocaleString()}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ប្រាក់សង</p>
//                             <p style={{ ...styles.totalValue, color: "#3b82f6" }}>${totals.totalPayment.toLocaleString()}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ប្រាក់ជំពាក់សរុប</p>
//                             <p style={{ ...styles.totalValue, color: "#ef4444" }}>${totals.totalTotalDebt.toLocaleString()}</p>
//                         </div>
//                         <div style={styles.totalItem}>
//                             <p style={styles.totalLabel}>ចំណូលសុទ្ធ</p>
//                             <p style={{ ...styles.totalValue, color: "#10b981" }}>${totals.totalNetIncome.toLocaleString()}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Edit Modal */}
//             {showEditModal && (
//                 <div style={styles.modalOverlay} onClick={handleCloseEditModal}>
//                     <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
//                         <div style={styles.modalHeader}>
//                             <h2 style={styles.modalTitle}>✏️ កែសម្រួលអតិថិជន</h2>
//                             <p style={styles.modalSubtitle}>Edit Customer Information</p>
//                         </div>
//                         <div style={styles.modalBody}>
//                             <IceOrderForm
//                                 initialData={editingCustomer}
//                                 onClose={handleCloseEditModal}
//                                 onUpdateSuccess={handleUpdateSuccess}
//                             />
//                             <button onClick={handleCloseEditModal} style={styles.closeButton}>
//                                 បិទ
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <style jsx>{`
//                 @keyframes spin {
//                     0% { transform: rotate(0deg); }
//                     100% { transform: rotate(360deg); }
//                 }
//                 .summary-card:hover {
//                     transform: translateY(-4px);
//                     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
//                 }
//                 .customer-card:hover {
//                     transform: translateY(-4px);
//                     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
//                 }
//                 .edit-button:hover {
//                     background-color: #dbeafe;
//                     border-color: #93c5fd;
//                     box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//                 }
//                 .delete-button:hover {
//                     background-color: #b91c1c;
//                     box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//                 }
//                 .outline-button:hover {
//                     background-color: #f9fafb;
//                     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
//                     transform: translateY(-2px);
//                 }
//                 .primary-button:hover {
//                     background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
//                     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
//                     transform: translateY(-2px);
//                 }
//                 @media (max-width: 768px) {
//                     .customer-card-content {
//                         flex-direction: column;
//                     }
//                     .financial-section {
//                         width: 100% !important;
//                         min-width: auto !important;
//                     }
//                     .header-content {
//                         flex-direction: column;
//                         align-items: flex-start;
//                     }
//                     .header-buttons {
//                         width: 100%;
//                         justify-content: stretch;
//                     }
//                     .outline-button,
//                     .primary-button {
//                         flex: 1;
//                     }
//                 }
//             `}</style>
//         </div>
//     );
// };

// const styles = {
//     container: {
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #f9fafb 0%, #dbeafe 100%)",
//     },
//     content: {
//         maxWidth: "1200px",
//         margin: "0 auto",
//         padding: "24px",
//         display: "flex",
//         flexDirection: "column",
//         gap: "32px",
//     },
//     loadingContainer: {
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     loadingCard: {
//         padding: "32px",
//         backgroundColor: "white",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         gap: "16px",
//         color: "black",
//     },
//     spinner: {
//         width: "64px",
//         height: "64px",
//         border: "4px solid #e5e7eb",
//         borderTop: "4px solid #2563eb",
//         borderRadius: "50%",
//         animation: "spin 1s linear infinite",
//     },
//     loadingText: {
//         color: "#6b7280",
//         fontSize: "18px",
//         fontWeight: "500",
//         margin: 0,
//     },
//     errorContainer: {
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #fef2f2 0%, #fce7e7 100%)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     errorCard: {
//         width: "384px",
//         backgroundColor: "white",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         padding: "24px",
//         textAlign: "center",
//         color: "black",
//     },
//     errorIcon: {
//         fontSize: "96px",
//         marginBottom: "16px",
//     },
//     errorText: {
//         color: "#dc2626",
//         fontWeight: "500",
//         fontSize: "18px",
//         marginBottom: "16px",
//     },
//     retryButton: {
//         backgroundColor: "#dc2626",
//         color: "white",
//         border: "none",
//         padding: "12px 24px",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//     },
//     headerCard: {
//         backgroundColor: "rgba(255, 255, 255, 0.8)",
//         backdropFilter: "blur(8px)",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         border: "none",
//     },
//     headerContent: {
//         padding: "32px",
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "flex-start",
//         gap: "24px",
//         flexWrap: "wrap",
//     },
//     title: {
//         fontSize: "36px",
//         fontWeight: "bold",
//         color: "#1f2937",
//         margin: "0 0 8px 0",
//         display: "flex",
//         alignItems: "center",
//         gap: "12px",
//     },
//     subtitle: {
//         color: "#6b7280",
//         fontSize: "18px",
//         margin: "0 0 16px 0",
//     },
//     headerStats: {
//         display: "flex",
//         alignItems: "center",
//         gap: "24px",
//         fontSize: "14px",
//         color: "#6b7280",
//         flexWrap: "wrap",
//     },
//     statItem: {
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//     },
//     headerButtons: {
//         display: "flex",
//         gap: "12px",
//     },
//     outlineButton: {
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//         padding: "12px 24px",
//         backgroundColor: "transparent",
//         border: "2px solid #e5e7eb",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//         boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
//         transition: "all 0.2s",
//     },
//     primaryButton: {
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//         padding: "12px 24px",
//         background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
//         color: "white",
//         border: "none",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//         boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
//         transition: "all 0.2s",
//     },
//     summaryGrid: {
//         display: "grid",
//         gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//         gap: "24px",
//     },
//     summaryCard: {
//         borderRadius: "16px",
//         color: "white",
//         boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
//         transition: "all 0.2s",
//         cursor: "pointer",
//     },
//     blueCard: {
//         background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
//     },
//     greenCard: {
//         background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
//     },
//     purpleCard: {
//         background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
//     },
//     orangeCard: {
//         background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
//     },
//     summaryContent: {
//         padding: "24px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//     },
//     summaryLabel: {
//         fontSize: "14px",
//         fontWeight: "500",
//         margin: "0 0 8px 0",
//         opacity: 0.9,
//     },
//     summaryValue: {
//         fontSize: "32px",
//         fontWeight: "bold",
//         margin: 0,
//     },
//     summaryIcon: {
//         fontSize: "40px",
//         opacity: 0.8,
//     },
//     customerSection: {
//         backgroundColor: "rgba(255, 255, 255, 0.8)",
//         backdropFilter: "blur(8px)",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         border: "none",
//     },
//     customerHeader: {
//         background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
//         color: "black",
//         borderRadius: "16px 16px 0 0",
//         padding: "24px 32px",
//     },
//     customerTitle: {
//         fontSize: "20px",
//         fontWeight: "bold",
//         margin: 0,
//         display: "flex",
//         alignItems: "center",
//         gap: "12px",
//         color: "#1f2937",
//     },
//     customerContent: {
//         padding: "32px",
//         color: "black",
//     },
//     emptyState: {
//         textAlign: "center",
//         padding: "64px 0",
//     },
//     emptyIcon: {
//         fontSize: "128px",
//         marginBottom: "24px",
//     },
//     emptyTitle: {
//         fontSize: "24px",
//         fontWeight: "bold",
//         color: "#374151",
//         margin: "0 0 8px 0",
//     },
//     emptySubtitle: {
//         color: "#6b7280",
//         margin: 0,
//     },
//     customerList: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "32px",
//     },
//     customerCard: {
//         borderLeft: "4px solid #3b82f6",
//         backgroundColor: "white",
//         borderRadius: "12px",
//         boxShadow: "0 10px 15px -5px rgba(0, 0, 0, 0.1)",
//         transition: "all 0.2s",
//         color: "black",
//     },
//     customerCardContent: {
//         padding: "32px",
//         display: "flex",
//         gap: "32px",
//         flexWrap: "wrap",
//         color: "black",
//     },
//     customerInfo: {
//         flex: 1,
//         minWidth: "300px",
//     },
//     customerBadge: {
//         backgroundColor: "#dbeafe",
//         color: "#1e40af",
//         padding: "4px 12px",
//         borderRadius: "6px",
//         fontSize: "16px",
//         fontWeight: "600",
//     },
//     customerName: {
//         fontSize: "24px",
//         fontWeight: "bold",
//         color: "#1f2937",
//         margin: 0,
//     },
//     iceOrdersSection: {
//         marginTop: "24px",
//     },
//     iceOrdersTitle: {
//         fontWeight: "600",
//         color: "#374151",
//         fontSize: "18px",
//         margin: "0 0 16px 0",
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//     },
//     iceOrdersGrid: {
//         display: "grid",
//         gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//         gap: "16px",
//     },
//     iceOrderCard: {
//         background: "linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)",
//         padding: "16px",
//         borderRadius: "12px",
//         border: "2px solid #bfdbfe",
//     },
//     iceOrderType: {
//         fontWeight: "600",
//         color: "#1e40af",
//         margin: "0 0 12px 0",
//     },
//     iceOrderDetails: {
//         display: "flex",
//         justifyContent: "space-between",
//         fontSize: "14px",
//         color: "#374151",
//         backgroundColor: "white",
//         padding: "8px",
//         borderRadius: "8px",
//         marginBottom: "4px",
//     },
//     priceText: {
//         fontWeight: "500",
//         color: "#059669",
//     },
//     financialSection: {
//         width: "384px",
//         minWidth: "384px",
//     },
//     financialCard: {
//         background: "linear-gradient(135deg, #f9fafb 0%, #dbeafe 100%)",
//         padding: "24px",
//         borderRadius: "12px",
//         border: "2px solid #e5e7eb",
//         color: "black",
//     },
//     financialTitle: {
//         fontWeight: "600",
//         color: "#374151",
//         fontSize: "18px",
//         margin: "0 0 16px 0",
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//     },
//     financialList: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "12px",
//     },
//     financialItem: {
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         padding: "8px",
//         backgroundColor: "white",
//         borderRadius: "8px",
//         color: "black",
//     },
//     totalDebtItem: {
//         backgroundColor: "#fef2f2",
//         border: "2px solid #fecaca",
//         padding: "12px",
//     },
//     netIncomeItem: {
//         backgroundColor: "#f0fdf4",
//         border: "2px solid #bbf7d0",
//         padding: "12px",
//     },
//     revenueText: {
//         fontWeight: "bold",
//         color: "#059669",
//         fontSize: "18px",
//     },
//     debtText: {
//         fontWeight: "600",
//         color: "#d97706",
//     },
//     newDebtText: {
//         fontWeight: "600",
//         color: "#dc2626",
//     },
//     paymentText: {
//         fontWeight: "600",
//         color: "#2563eb",
//     },
//     totalDebtText: {
//         fontWeight: "bold",
//         color: "#b91c1c",
//         fontSize: "18px",
//     },
//     expenseText: {
//         fontWeight: "600",
//         color: "#7c3aed",
//     },
//     netIncomeText: {
//         fontWeight: "bold",
//         color: "#047857",
//         fontSize: "18px",
//     },
//     separator: {
//         height: "1px",
//         backgroundColor: "#e5e7eb",
//         margin: "12px 0",
//     },
//     actionButtons: {
//         display: "flex",
//         gap: "12px",
//         marginTop: "24px",
//     },
//     editButton: {
//         flex: 1,
//         padding: "12px",
//         backgroundColor: "transparent",
//         border: "2px solid #e5e7eb",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//         transition: "all 0.2s",
//     },
//     deleteButton: {
//         flex: 1,
//         padding: "12px",
//         backgroundColor: "#dc2626",
//         color: "white",
//         border: "none",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//         transition: "all 0.2s",
//     },
//     totalsSection: {
//         background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
//         color: "black",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         padding: "32px",
//     },
//     totalsTitle: {
//         fontSize: "24px",
//         fontWeight: "bold",
//         margin: "0 0 24px 0",
//         display: "flex",
//         alignItems: "center",
//         gap: "12px",
//         color: "black",
//     },
//     totalsGrid: {
//         display: "grid",
//         gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
//         gap: "16px",
//     },
//     totalItem: {
//         textAlign: "center",
//         padding: "16px",
//         backgroundColor: "rgba(255, 255, 255, 0.1)",
//         borderRadius: "12px",
//         backdropFilter: "blur(8px)",
//         color: "black",
//     },
//     totalLabel: {
//         color: "#d1d5db",
//         fontSize: "14px",
//         margin: "0 0 8px 0",
//     },
//     totalValue: {
//         fontWeight: "bold",
//         fontSize: "24px",
//         margin: 0,
//         color: "black",
//     },
//     modalOverlay: {
//         position: "fixed",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: "rgba(0, 0, 0, 0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1000,
//     },
//     modalContent: {
//         maxWidth: "1024px",
//         maxHeight: "90vh",
//         overflowY: "auto",
//         backgroundColor: "white",
//         borderRadius: "16px",
//         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
//         border: "none",
//         color: "black",
//     },
//     modalHeader: {
//         background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
//         color: "black",
//         padding: "24px",
//         borderRadius: "16px 16px 0 0",
//     },
//     modalTitle: {
//         fontSize: "24px",
//         fontWeight: "bold",
//         margin: "0 0 4px 0",
//         display: "flex",
//         alignItems: "center",
//         gap: "12px",
//         color: "black",
//     },
//     modalSubtitle: {
//         color: "#bfdbfe",
//         margin: 0,
//     },
//     modalBody: {
//         padding: "24px",
//     },
//     closeButton: {
//         marginTop: "24px",
//         padding: "12px 24px",
//         backgroundColor: "#2563eb",
//         color: "black",
//         border: "none",
//         borderRadius: "8px",
//         cursor: "pointer",
//         fontWeight: "500",
//     },
//     pagination: {
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         gap: "16px",
//         marginTop: "24px",
//     },
//     pageButton: {
//         padding: "8px 16px",
//         borderRadius: "6px",
//         border: "1px solid #d1d5db",
//         backgroundColor: "#f3f4f6",
//         color: "black",
//         fontWeight: "500",
//         cursor: "pointer",
//         minWidth: "80px",
//         transition: "background 0.2s",
//         disabled: {
//             opacity: 0.5,
//             cursor: "not-allowed",
//         },
//     },
//     pageInfo: {
//         fontWeight: "500",
//         color: "#374151",
//     },
// };

// export default Display;






import React, { useState, useEffect } from 'react';
import IceOrderForm from '../userDriver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx'; // Use xlsx-style for styling
import { saveAs } from 'file-saver';

const Display = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [reportDebts, setReportDebts] = useState({});

    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://dl-api-v-01.vercel.app/api/orders');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch customer data.');
            }
            const data = await response.json();
            setCustomers(data);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError(err.message || 'An unexpected error occurred while fetching data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLatestReportDebts = async () => {
        try {
            const res = await fetch('https://dl-api-v-01.vercel.app/api/reports');
            if (!res.ok) return;
            const reports = await res.json();
            if (!Array.isArray(reports) || reports.length === 0) return;
            const latestReport = reports.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            const debts = {};
            (latestReport.customersData || []).forEach(cust => {
                debts[cust.customerName] = cust.totalDebt;
            });
            setReportDebts(debts);
        } catch (e) {
            // ignore error, fallback to 0
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchLatestReportDebts();
    }, []);

    const calculateTotalRevenue = (iceOrders) => {
        if (!iceOrders) return 0;
        let total = 0;
        Object.values(iceOrders).forEach((orders) => {
            orders.forEach((order) => {
                const quantity = parseFloat(order.quantity) || 0;
                const price = parseFloat(order.price) || 0;
                total += quantity * price;
            });
        });
        return total;
    };

    const calculateTotalQuantity = (iceOrders, iceTypeKey = null) => {
        if (!iceOrders) return 0;
        let totalQuantity = 0;

        if (iceTypeKey) {
            const orders = iceOrders[iceTypeKey] || [];
            orders.forEach((order) => {
                totalQuantity += parseFloat(order.quantity) || 0;
            });
        } else {
            Object.values(iceOrders).forEach((orders) => {
                orders.forEach((order) => {
                    totalQuantity += parseFloat(order.quantity) || 0;
                });
            });
        }
        return totalQuantity;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer record?')) {
            try {
                const response = await fetch(`https://dl-api-v-01.vercel.app/api/orders/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete customer data.');
                }

                setCustomers(customers.filter((customer) => customer._id !== id));
            } catch (err) {
                console.error('Error deleting customer:', err);
                setError(err.message || 'An unexpected error occurred during deletion.');
            }
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowEditModal(true);
    };

    const handleUpdateSuccess = (updatedCustomer) => {
        setCustomers(customers.map(cust =>
            cust._id === updatedCustomer._id ? updatedCustomer : cust
        ));
        setShowEditModal(false);
        setEditingCustomer(null);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingCustomer(null);
    };

    const saveReportAndGeneratePdf = async () => {
        try {
            const reportData = {
                date: new Date().toISOString(),
                customersData: customers
            };

            const dbResponse = await fetch('https://dl-api-v-01.vercel.app/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (!dbResponse.ok) {
                const errorData = await dbResponse.json();
                throw new Error(errorData.message || 'Failed to save report to database.');
            }

            console.log('Report saved to database successfully!');
            alert('Report saved to database!');
        } catch (err) {
            console.error('Error saving report:', err);
            setError(err.message || 'An unexpected error occurred during report save.');
        }
    };

    const saveTableTotalsToApi = async () => {
        try {
            const currentTableTotals = calculateTableTotals();
            const response = await fetch('https://dl-api-v-01.vercel.app/api/table-totals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentTableTotals),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save table totals to API.');
            }

            console.log('Table totals saved successfully:', currentTableTotals);
            alert('Table totals saved successfully!');
        } catch (err) {
            console.error('Error saving table totals:', err);
            setError(err.message || 'An unexpected error occurred while saving table totals.');
        }
    };

    const handleSaveAndExport = async () => {
        await saveReportAndGeneratePdf();
        await saveTableTotalsToApi();
    };

const handleExportToExcel = () => {
    const dataForExcel = [];

    // Add headers
    dataForExcel.push([
        'ល.រ', 'គោត្តនាម', 'ប្រភេទទឹកកក', 'សរុបបរិមាណទឹកកក', 'បរិមាណ', 'តម្លៃរាយ',
        'សរុប', 'ប្រាក់ជំពាក់ចាស់', 'ប្រាក់ជំពាក់ថ្មី', 'ប្រាក់សង', 'សរុបប្រាក់ជំពាក់',
        'ថ្លៃសាំង បាយ', 'សរុបចំណូល'
    ]);

    const iceTypes = [
        { key: 'originalIce', label: 'ទឹកកកដើម' },
        { key: 'largeHygiene20kg', label: 'ទឹកកកអនាម័យធំ 20kg' },
        { key: 'largeHygiene30kg', label: 'ទឹកកកអនាម័យធំ 30kg' },
        { key: 'smallHygiene20kg', label: 'ទឹកកកអនាម័យតូច 20kg' },
        { key: 'smallHygiene2kg', label: 'ទឹកកកអនាម័យតូច 2kg' },
    ];

    customers.forEach((customer, custIndex) => {
        let firstRowForCustomer = true;
        let totalValidOrdersAcrossAllTypes = 0;
        iceTypes.forEach((type) => {
            const orders = customer.iceOrders?.[type.key] || [];
            totalValidOrdersAcrossAllTypes += orders.filter((order) => order.quantity || order.price).length;
        });

        if (totalValidOrdersAcrossAllTypes === 0) {
            dataForExcel.push([
                custIndex + 1,
                customer.customerName,
                '-', // Ice Type
                0, // Total Ice Quantity for type
                0, // Quantity
                0, // Price
                0, // Total
                reportDebts[customer.customerName] !== undefined ? reportDebts[customer.customerName] : (customer.previousDebt || 0),
                customer.newDebt || 0,
                customer.payment || 0,
                customer.totalDebt !== undefined ? customer.totalDebt : 'N/A',
                customer.expenses || 0,
                (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0))
            ]);
        } else {
            iceTypes.forEach((type) => {
                const orders = customer.iceOrders?.[type.key] || [];
                const validTypeOrders = orders.filter((order) => order.quantity !== 0 || order.price !== 0);

                if (validTypeOrders.length > 0) {
                    validTypeOrders.forEach((order, orderIndex) => {
                        const totalPerIceType = (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);

                        const row = [];
                        if (firstRowForCustomer) {
                            row.push(custIndex + 1);
                            row.push(customer.customerName);
                        } else {
                            row.push('', ''); // Empty for merged cells
                        }

                        if (orderIndex === 0) {
                            row.push(type.label);
                            row.push(calculateTotalQuantity(customer.iceOrders, type.key));
                        } else {
                            row.push('', ''); // Empty for merged cells
                        }

                        row.push(order.quantity);
                        row.push(order.price);
                        row.push(totalPerIceType);

                        if (firstRowForCustomer) {
                            row.push(
                                reportDebts[customer.customerName] !== undefined
                                    ? reportDebts[customer.customerName]
                                    : (customer.previousDebt || 0)
                            );
                            row.push(customer.newDebt || 0);
                            row.push(customer.payment || 0);
                            row.push(customer.totalDebt !== undefined ? customer.totalDebt : 'N/A');
                            row.push(customer.expenses || 0);
                            row.push(calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
                        } else {
                            row.push('', '', '', '', '', ''); // Empty for merged cells
                        }
                        dataForExcel.push(row);
                        firstRowForCustomer = false;
                    });
                }
            });
        }
    });

    // Add totals row
    const tableTotals = calculateTableTotals();
    dataForExcel.push([
        'សរុប', '', '',
        tableTotals.totalIceQuantity,
        tableTotals.totalQuantity,
        tableTotals.totalPrice,
        tableTotals.totalRevenue,
        tableTotals.totalPrevDebt,
        tableTotals.totalNewDebt,
        tableTotals.totalPayment,
        tableTotals.totalTotalDebt,
        tableTotals.totalExpenses,
        tableTotals.totalNetIncome
    ]);

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);

    // Set column widths for better readability
    const wscols = [
        { wch: 5 }, // ល.រ
        { wch: 20 }, // គោត្តនាម
        { wch: 25 }, // ប្រភេទទឹកកក
        { wch: 20 }, // សរុបបរិមាណទឹកកក
        { wch: 10 }, // បរិមាណ
        { wch: 10 }, // តម្លៃរាយ
        { wch: 15 }, // សរុប
        { wch: 15 }, // ប្រាក់ជំពាក់ចាស់
        { wch: 15 }, // ប្រាក់ជំពាក់ថ្មី
        { wch: 15 }, // ប្រាក់សង
        { wch: 18 }, // សរុបប្រាក់ជំពាក់
        { wch: 15 }, // ថ្លៃសាំង បាយ
        { wch: 15 } // សរុបចំណូល
    ];
    ws['!cols'] = wscols;

    // Apply merges for customer information and ice type totals
    if (!ws['!merges']) {
        ws['!merges'] = [];
    }

    let currentRow = 1; // Start from row 1 (0-indexed) after headers
    customers.forEach(customer => {
        let numRowsForCustomer = 0;
        const customerIceTypes = [
            'originalIce', 'largeHygiene20kg', 'largeHygiene30kg',
            'smallHygiene20kg', 'smallHygiene2kg'
        ];
        customerIceTypes.forEach(typeKey => {
            const orders = customer.iceOrders?.[typeKey] || [];
            numRowsForCustomer += orders.filter(order => order.quantity !== 0 || order.price !== 0).length;
        });

        if (numRowsForCustomer === 0) {
            numRowsForCustomer = 1; // For customers with no specific orders
        }

        if (numRowsForCustomer > 1) {
            ws['!merges'].push(XLSX.utils.decode_range(`A${currentRow + 1}:A${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`B${currentRow + 1}:B${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`H${currentRow + 1}:H${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`I${currentRow + 1}:I${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`J${currentRow + 1}:J${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`K${currentRow + 1}:K${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`L${currentRow + 1}:L${currentRow + numRowsForCustomer}`));
            ws['!merges'].push(XLSX.utils.decode_range(`M${currentRow + 1}:M${currentRow + numRowsForCustomer}`));

            let currentIceTypeRow = currentRow;
            customerIceTypes.forEach(typeKey => {
                const orders = customer.iceOrders?.[typeKey] || [];
                const validTypeOrders = orders.filter(order => order.quantity !== 0 || order.price !== 0);
                if (validTypeOrders.length > 1) {
                    ws['!merges'].push(XLSX.utils.decode_range(`C${currentIceTypeRow + 1}:C${currentIceTypeRow + validTypeOrders.length}`));
                    ws['!merges'].push(XLSX.utils.decode_range(`D${currentIceTypeRow + 1}:D${currentIceTypeRow + validTypeOrders.length}`));
                }
                currentIceTypeRow += validTypeOrders.length;
            });
        }
        currentRow += numRowsForCustomer;
    });

    // Merge for the "Total" row
    ws['!merges'].push(XLSX.utils.decode_range(`A${currentRow + 1}:C${currentRow + 1}`));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const fileName = `Customer_Report_${dateTimeString}.xlsx`;

    saveAs(data, fileName);
};

    const renderIceTypeDetails = (customer) => {
        const iceTypes = [
            { key: 'originalIce', label: 'ទឹកកកដើម' },
            { key: 'largeHygiene20kg', label: 'ទឹកកកអនាម័យធំ 20kg' },
            { key: 'largeHygiene30kg', label: 'ទឹកកកអនាម័យធំ 30kg' },
            { key: 'smallHygiene20kg', label: 'ទឹកកកអនាម័យតូច 20kg' },
            { key: 'smallHygiene2kg', label: 'ទឹកកកអនាម័យតូច 2kg' },
        ];

        let totalValidOrdersAcrossAllTypes = 0;
        iceTypes.forEach((type) => {
            const orders = customer.iceOrders?.[type.key] || [];
            totalValidOrdersAcrossAllTypes += orders.filter((order) => order.quantity || order.price).length;
        });

        if (totalValidOrdersAcrossAllTypes === 0) {
            return (
                <tr key={customer._id}>
                    <td className="border px-4 py-2">{customers.findIndex((c) => c._id === customer._id) + 1}</td>
                    <td className="border px-4 py-2">{customer.customerName}</td>
                    <td className="border px-4 py-2">-</td>
                    <td className="border px-4 py-2">0</td>
                    <td className="border px-4 py-2">0</td>
                    <td className="border px-4 py-2">0</td>
                    <td className="border px-4 py-2">0</td>
                    <td className="border px-4 py-2">
                        {reportDebts[customer.customerName] !== undefined
                            ? reportDebts[customer.customerName]
                            : (customer.previousDebt || 0)}
                    </td>
                    <td className="border px-4 py-2">{customer.newDebt || 0}</td>
                    <td className="border px-4 py-2">{customer.payment || 0}</td>
                    <td className="border px-4 py-2">
                        {customer.totalDebt !== undefined ? customer.totalDebt : 'N/A'}
                    </td>
                    <td className="border px-4 py-2">{customer.expenses || 0}</td>
                    <td className="border px-4 py-2">
                        {calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0)}
                    </td>
                    <td className="border px-4 py-2">
                        <button
                            className="text-blue-500 hover:underline mr-2"
                            onClick={() => handleEdit(customer)}
                        >
                            កែសម្រួល
                        </button>
                        <button
                            className="text-red-500 hover:underline"
                            onClick={() => handleDelete(customer._id)}
                        >
                            លុប
                        </button>
                    </td>
                </tr>
            );
        }

        const rows = [];
        let firstRowForCustomer = true;

        iceTypes.forEach((type) => {
            const orders = customer.iceOrders?.[type.key] || [];
            const validTypeOrders = orders.filter((order) => order.quantity !== 0 || order.price !== 0);

            if (validTypeOrders.length > 0) {
                validTypeOrders.forEach((order, orderIndex) => {
                    const totalPerIceType = (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);

                    rows.push(
                        <tr key={`${customer._id}-${type.key}-${orderIndex}`}>
                            {firstRowForCustomer && (
                                <>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customers.findIndex((c) => c._id === customer._id) + 1}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customer.customerName}
                                    </td>
                                </>
                            )}
                            {orderIndex === 0 ? (
                                <>
                                    <td rowSpan={validTypeOrders.length} className="border px-4 py-2">{type.label}</td>
                                    <td rowSpan={validTypeOrders.length} className="border px-4 py-2">{calculateTotalQuantity(customer.iceOrders, type.key)}</td>
                                </>
                            ) : null}
                            <td className="border px-4 py-2">{order.quantity}</td>
                            <td className="border px-4 py-2">{order.price}</td>
                            <td className="border px-4 py-2">{totalPerIceType}</td>
                            {firstRowForCustomer && (
                                <>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {reportDebts[customer.customerName] !== undefined
                                            ? reportDebts[customer.customerName]
                                            : (customer.previousDebt || 0)}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customer.newDebt || 0}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customer.payment || 0}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customer.totalDebt !== undefined ? customer.totalDebt : 'N/A'}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {customer.expenses || 0}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        {calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0)}
                                    </td>
                                    <td rowSpan={totalValidOrdersAcrossAllTypes} className="border px-4 py-2">
                                        <button
                                            className="text-blue-500 hover:underline mr-2"
                                            onClick={() => handleEdit(customer)}
                                        >
                                            កែសម្រួល
                                        </button>
                                        <button
                                            className="text-red-500 hover:underline"
                                            onClick={() => handleDelete(customer._id)}
                                        >
                                            លុប
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    );
                    firstRowForCustomer = false;
                });
            }
        });

        return rows;
    };

    const grandTotals = customers.reduce(
        (acc, customer) => {
            acc.totalIceQuantity += calculateTotalQuantity(customer.iceOrders);
            acc.totalRevenue += calculateTotalRevenue(customer.iceOrders);
            acc.totalDebt += customer.totalDebt !== undefined ? parseFloat(customer.totalDebt) || 0 : 0;
            acc.totalNetIncome += (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
            return acc;
        },
        { totalIceQuantity: 0, totalRevenue: 0, totalDebt: 0, totalNetIncome: 0 }
    );

    const calculateTableTotals = () => {
        let totalIceQuantity = 0;
        let totalQuantity = 0;
        let totalPrice = 0;
        let totalRevenue = 0;
        let totalPrevDebt = 0;
        let totalNewDebt = 0;
        let totalPayment = 0;
        let totalTotalDebt = 0;
        let totalExpenses = 0;
        let totalNetIncome = 0;

        customers.forEach(customer => {
            const iceTypes = [
                'originalIce',
                'largeHygiene20kg',
                'largeHygiene30kg',
                'smallHygiene20kg',
                'smallHygiene2kg'
            ];
            iceTypes.forEach(typeKey => {
                const orders = customer.iceOrders?.[typeKey] || [];
                orders.forEach(order => {
                    totalIceQuantity += parseFloat(order.quantity) || 0;
                    totalQuantity += parseFloat(order.quantity) || 0;
                    totalPrice += parseFloat(order.price) || 0;
                    totalRevenue += (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);
                });
            });
            totalPrevDebt += reportDebts[customer.customerName] !== undefined
                ? parseFloat(reportDebts[customer.customerName]) || 0
                : (parseFloat(customer.previousDebt) || 0);
            totalNewDebt += parseFloat(customer.newDebt) || 0;
            totalPayment += parseFloat(customer.payment) || 0;
            totalTotalDebt += customer.totalDebt !== undefined ? parseFloat(customer.totalDebt) || 0 : 0;
            totalExpenses += parseFloat(customer.expenses) || 0;
            totalNetIncome += (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
        });

        return {
            totalIceQuantity,
            totalQuantity,
            totalPrice,
            totalRevenue,
            totalPrevDebt,
            totalNewDebt,
            totalPayment,
            totalTotalDebt,
            totalExpenses,
            totalNetIncome
        };
    };

    const tableTotals = calculateTableTotals();

    if (loading) {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12 d-flex justify-content-center align-items-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center">តារាងអតិថិជន (Customer Table)</h1>
            <div className="flex justify-end mb-4 gap-2">





                <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        handleSaveAndExport();
                        handleExportToExcel();
                    }}
                >
                    Save Report
                </button>


                {/* <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleSaveAndExport}
                >
                    Save Report
                </button>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleExportToExcel}
                >
                    Export to Excel
                </button> */}
            </div>
            {customers.length === 0 ? (
                <p className="text-center text-gray-500">មិនមានទិន្នន័យអតិថិជនទេ (No customer data)</p>
            ) : (
                <div id="customer-table">
                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th rowSpan="2" className="border px-4 py-2">ល.រ</th>
                                <th rowSpan="2" className="border px-4 py-2">គោត្តនាម</th>
                                <th rowSpan="2" className="border px-4 py-2">ប្រភេទទឹកកក</th>
                                <th colSpan="4" className="border px-4 py-2">ចំណូល</th>
                                <th colSpan="4" className="border px-4 py-2">ប្រាក់ជំពាក់</th>
                                <th rowSpan="2" className="border px-4 py-2">ថ្លៃសាំង បាយ</th>
                                <th rowSpan="2" className="border px-4 py-2">សរុបចំណូល</th>
                                <th rowSpan="2" className="border px-4 py-2">សកម្មភាព</th>
                            </tr>
                            <tr className="bg-gray-100">
                                <th className="border px-4 py-2">សរុបបរិមាណទឹកកក</th>
                                <th className="border px-4 py-2">បរិមាណ</th>
                                <th className="border px-4 py-2">តម្លៃរាយ</th>
                                <th className="border px-4 py-2">សរុប</th>
                                <th className="border px-4 py-2">ប្រាក់ជំពាក់ចាស់</th>
                                <th className="border px-4 py-2">ប្រាក់ជំពាក់ថ្មី</th>
                                <th className="border px-4 py-2">ប្រាក់សង</th>
                                <th className="border px-4 py-2">សរុបប្រាក់ជំពាក់</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => renderIceTypeDetails(customer))}
                            <tr className="font-bold">
                                <td className="border px-4 py-2 text-center" colSpan={3}>សរុប</td>
                                <td className="border px-4 py-2">{tableTotals.totalIceQuantity}</td>
                                <td className="border px-4 py-2">{tableTotals.totalQuantity}</td>
                                <td className="border px-4 py-2">{tableTotals.totalPrice}</td>
                                <td className="border px-4 py-2">{tableTotals.totalRevenue}</td>
                                <td className="border px-4 py-2">{tableTotals.totalPrevDebt}</td>
                                <td className="border px-4 py-2">{tableTotals.totalNewDebt}</td>
                                <td className="border px-4 py-2">{tableTotals.totalPayment}</td>
                                <td className="border px-4 py-2">{tableTotals.totalTotalDebt}</td>
                                <td className="border px-4 py-2">{tableTotals.totalExpenses}</td>
                                <td className="border px-4 py-2">{tableTotals.totalNetIncome}</td>
                                <td className="border px-4 py-2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflowY: 'auto'
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '10px',
                            padding: '2rem',
                            minWidth: '320px',
                            maxWidth: '800px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                    >
                        <IceOrderForm
                            initialData={editingCustomer}
                            onClose={handleCloseEditModal}
                            onUpdateSuccess={handleUpdateSuccess}
                        />
                    </div>
                </div>
            )}
            <style>
                {`
            .export-pdf-style {
                background: #fff !important;
                color: #000 !important;
            }
            .export-pdf-style * {
                background: transparent !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            `}
            </style>
        </div>
    );
};

export default Display;