// userDriverdisplay.jsx
import React, { useState, useEffect } from 'react';
import IceOrderForm from '../userDriver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

const columnBgColors = {
  originalIce: "#fefce8", // yellow-50
  largeHygiene20kg: "#f0fdf4", // green-50
  largeHygiene30kg: "#f0f9ff", // blue-50
  smallHygiene20kg: "#fef2f2", // red-50
  smallHygiene30kg: "#f3e8ff", // violet-50
  smallHygiene2kg: "#f5f3ff", // purple-50
  default: "#f9fafb", // gray-50
  totalIce: "#bbf7d0", // green-100
  quantity: "#bbf7d0", // green-100
  price: "#bae6fd", // blue-100
  total: "#fca5a5", // red-100
};

const iceTypeColors = { ...columnBgColors };

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
      const response = await fetch('https://dl-api-v-01.vercel.app/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to fetch customer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestReportDebts = async () => {
    try {
      const res = await fetch('https://dl-api-v-01.vercel.app/api/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
      console.warn('Error fetching report debts:', e);
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
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        setCustomers(customers.filter((customer) => customer._id !== id));
      } catch (err) {
        console.error('Error deleting customer:', err);
        setError(err.message || 'Failed to delete customer data.');
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
        customersData: customers,
      };
      const dbResponse = await fetch('https://dl-api-v-01.vercel.app/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      if (!dbResponse.ok) {
        const errorData = await dbResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${dbResponse.status}`);
      }
      console.log('Report saved to database successfully!');
      alert('Report saved to database!');
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.message || 'Failed to save report.');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      console.log('Table totals saved successfully:', currentTableTotals);
      alert('Table totals saved successfully!');
    } catch (err) {
      console.error('Error saving table totals:', err);
      setError(err.message || 'Failed to save table totals.');
    }
  };

  const handleSaveAndExport = async () => {
    await saveReportAndGeneratePdf();
    await saveTableTotalsToApi();
  };

  const excelHeaderStyles = [
    { fill: { fgColor: { rgb: "FEF9C3" } }, font: { bold: true } }, // ល.រ
    { fill: { fgColor: { rgb: "FEF9C3" } }, font: { bold: true } }, // គោត្តនាម
    { fill: { fgColor: { rgb: "FDE68A" } }, font: { bold: true } }, // ប្រភេទទឹកកក
    { fill: { fgColor: { rgb: "BBF7D0" } }, font: { bold: true } }, // សរុបបរិមាណទឹកកក
    { fill: { fgColor: { rgb: "BBF7D0" } }, font: { bold: true } }, // បរិមាណ
    { fill: { fgColor: { rgb: "BAE6FD" } }, font: { bold: true } }, // តម្លៃរាយ
    { fill: { fgColor: { rgb: "FCA5A5" } }, font: { bold: true } }, // សរុប
    { fill: { fgColor: { rgb: "BAE6FD" } }, font: { bold: true } }, // ប្រាក់ជំពាក់ចាស់
    { fill: { fgColor: { rgb: "BAE6FD" } }, font: { bold: true } }, // ប្រាក់ជំពាក់ថ្មី
    { fill: { fgColor: { rgb: "BAE6FD" } }, font: { bold: true } }, // ប្រាក់សង
    { fill: { fgColor: { rgb: "BAE6FD" } }, font: { bold: true } }, // សរុបប្រាក់ជំពាក់
    { fill: { fgColor: { rgb: "FCA5A5" } }, font: { bold: true } }, // ថ្លៃសាំង បាយ
    { fill: { fgColor: { rgb: "DDD6FE" } }, font: { bold: true } }, // សរុបចំណូល
  ];

  const excelIceTypeBg = {
    originalIce: { fill: { fgColor: { rgb: "FEFCE8" } } },
    largeHygiene20kg: { fill: { fgColor: { rgb: "F0FDF4" } } },
    largeHygiene30kg: { fill: { fgColor: { rgb: "F0F9FF" } } },
    smallHygiene20kg: { fill: { fgColor: { rgb: "FEF2F2" } } },
    smallHygiene30kg: { fill: { fgColor: { rgb: "F3E8FF" } } },
    smallHygiene2kg: { fill: { fgColor: { rgb: "F5F3FF" } } },
    default: { fill: { fgColor: { rgb: "F9FAFB" } } },
  };

  const excelTotalRowStyle = { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } };

  const handleExportToExcel = () => {
    const dataForExcel = [];
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
      { key: 'smallHygiene30kg', label: 'ទឹកកកអនាម័យតូច 30kg' },
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
          '-',
          0,
          0,
          0,
          0,
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
                row.push('', '');
              }
              if (orderIndex === 0) {
                row.push(type.label);
                row.push(calculateTotalQuantity(customer.iceOrders, type.key));
              } else {
                row.push('', '');
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
                row.push('', '', '', '', '', '');
              }
              dataForExcel.push(row);
              firstRowForCustomer = false;
            });
          }
        });
      }
    });

    const tableTotals = calculateTableTotals();
    dataForExcel.push([
      'សរុប', '', '',
      tableTotals.totalIceQuantity,
      tableTotals.totalRevenue,
      tableTotals.totalPrevDebt,
      tableTotals.totalNewDebt,
      tableTotals.totalPayment,
      tableTotals.totalTotalDebt,
      tableTotals.totalExpenses,
      tableTotals.totalNetIncome
    ]);

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    for (let c = 0; c < excelHeaderStyles.length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) cell.s = excelHeaderStyles[c];
    }

    let rowIdx = 1;
    customers.forEach((customer, custIndex) => {
      let firstRowForCustomer = true;
      let totalValidOrdersAcrossAllTypes = 0;
      const iceTypes = [
        { key: 'originalIce', label: 'ទឹកកកដើម' },
        { key: 'largeHygiene20kg', label: 'ទឹកកកអនាម័យធំ 20kg' },
        { key: 'largeHygiene30kg', label: 'ទឹកកកអនាម័យធំ 30kg' },
        { key: 'smallHygiene20kg', label: 'ទឹកកកអនាម័យតូច 20kg' },
        { key: 'smallHygiene30kg', label: 'ទឹកកកអនាម័យតូច 30kg' },
        { key: 'smallHygiene2kg', label: 'ទឹកកកអនាម័យតូច 2kg' },
      ];
      iceTypes.forEach((type) => {
        const orders = customer.iceOrders?.[type.key] || [];
        totalValidOrdersAcrossAllTypes += orders.filter((order) => order.quantity || order.price).length;
      });

      if (totalValidOrdersAcrossAllTypes === 0) {
        for (let c = 0; c < 13; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: rowIdx, c })];
          if (cell) cell.s = { ...excelIceTypeBg.default };
        }
        rowIdx++;
      } else {
        iceTypes.forEach((type) => {
          const orders = customer.iceOrders?.[type.key] || [];
          const validTypeOrders = orders.filter((order) => order.quantity !== 0 || order.price !== 0);
          if (validTypeOrders.length > 0) {
            validTypeOrders.forEach((order, orderIndex) => {
              for (let c = 2; c <= 6; c++) {
                const cell = ws[XLSX.utils.encode_cell({ r: rowIdx, c })];
                if (cell) cell.s = { ...excelIceTypeBg[type.key] };
              }
              rowIdx++;
            });
          }
        });
      }
    });

    const totalRowIdx = rowIdx;
    for (let c = 0; c < 13; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: totalRowIdx, c })];
      if (cell) cell.s = { ...excelTotalRowStyle };
    }

    const wscols = [
      { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    if (!ws['!merges']) ws['!merges'] = [];
    let currentRow = 1;
    customers.forEach(customer => {
      let numRowsForCustomer = 0;
      const customerIceTypes = [
        'originalIce', 'largeHygiene20kg', 'largeHygiene30kg',
        'smallHygiene20kg', 'smallHygiene30kg', 'smallHygiene2kg'
      ];
      customerIceTypes.forEach(typeKey => {
        const orders = customer.iceOrders?.[typeKey] || [];
        numRowsForCustomer += orders.filter(order => order.quantity !== 0 || order.price !== 0).length;
      });

      if (numRowsForCustomer === 0) numRowsForCustomer = 1;
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
      { key: 'smallHygiene30kg', label: 'ទឹកកកអនាម័យតូច 30kg' },
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
          <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.default }}>0</td>
          <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.default }}>0</td>
          <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.default }}>0</td>
          <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.default }}>0</td>
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
      const totalPerIceTypeSum = validTypeOrders.reduce(
        (sum, order) => sum + ((parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0)),
        0
      );

      if (validTypeOrders.length > 0) {
        validTypeOrders.forEach((order, orderIndex) => {
          const totalPerIceType = (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);
          const bgColor = columnBgColors[type.key];
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
                  <td
                    rowSpan={validTypeOrders.length}
                    className="border px-4 py-2"
                    style={{ backgroundColor: bgColor }}
                  >
                    {type.label}
                  </td>
                  <td
                    rowSpan={validTypeOrders.length}
                    className="border px-4 py-2"
                    style={{ backgroundColor: bgColor }}
                  >
                    {calculateTotalQuantity(customer.iceOrders, type.key)}
                  </td>
                </>
              ) : null}
              <td className="border px-4 py-2" style={{ backgroundColor: bgColor }}>{order.quantity}</td>
              <td className="border px-4 py-2" style={{ backgroundColor: bgColor }}>{order.price}</td>
              {orderIndex === 0 ? (
                <td
                  rowSpan={validTypeOrders.length}
                  className="border px-4 py-2"
                  style={{ backgroundColor: bgColor }}
                >
                  {totalPerIceTypeSum}
                </td>
              ) : null}
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
        'originalIce', 'largeHygiene20kg', 'largeHygiene30kg',
        'smallHygiene20kg', 'smallHygiene30kg', 'smallHygiene2kg'
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
      totalIceQuantity, totalQuantity, totalPrice, totalRevenue,
      totalPrevDebt, totalNewDebt, totalPayment, totalTotalDebt,
      totalExpenses, totalNetIncome
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
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={fetchCustomers}
        >
          Retry
        </button>
      </div>
    );
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
      </div>
      {customers.length === 0 ? (
        <p className="text-center text-gray-500">មិនមានទិន្នន័យអតិថិជនទេ (No customer data)</p>
      ) : (
        <div
          id="customer-table"
          style={{
            maxHeight: "95vh",
            overflowY: "auto",
            overflowX: "hidden",
            width: "120%"
          }}
        >
          <table
            className="border-collapse border border-gray-300 bg-white text-black"
            style={{
              backgroundColor: "#fff",
              color: "#000",
              width: "100%",
              tableLayout: "fixed"
            }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#f3f4f6" }}>
              <tr
                className="text-black"
                style={{
                  background: "linear-gradient(90deg, #fde68a 0%, #bbf7d0 25%, #bae6fd 50%, #fca5a5 75%, #ddd6fe 100%)"
                }}
              >
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#fef9c3" }}>ល.រ</th>
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#fef9c3" }}>គោត្តនាម</th>
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#fde68a" }}>ប្រភេទទឹកកក</th>
                <th colSpan="4" className="border px-4 py-2" style={{ backgroundColor: "#bbf7d0" }}>ចំណូល</th>
                <th colSpan="4" className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>ប្រាក់ជំពាក់</th>
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#fca5a5" }}>ថ្លៃសាំង បាយ</th>
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#ddd6fe" }}>សរុបចំណូល</th>
                <th rowSpan="2" className="border px-4 py-2" style={{ backgroundColor: "#f3f4f6" }}>សកម្មភាព</th>
              </tr>
              <tr
                className="text-black"
                style={{
                  background: "linear-gradient(90deg, #fde68a 0%, #bbf7d0 25%, #bae6fd 50%, #fca5a5 75%, #ddd6fe 100%)"
                }}
              >
                <th className="border px-4 py-2" style={{ backgroundColor: "#fde68a" }}>សរុបបរិមាណទឹកកក</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bbf7d0" }}>បរិមាណ</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>តម្លៃរាយ</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#fca5a5" }}>សរុប</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>ប្រាក់ជំពាក់ចាស់</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>ប្រាក់ជំពាក់ថ្មី</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>ប្រាក់សង</th>
                <th className="border px-4 py-2" style={{ backgroundColor: "#bae6fd" }}>សរុបប្រាក់ជំពាក់</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, idx) => {
                const rows = renderIceTypeDetails(customer);
                const netIncome = (calculateTotalRevenue(customer.iceOrders) - (parseFloat(customer.expenses) || 0));
                const infoColor =
                  netIncome > 0
                    ? "bg-green-50"
                    : netIncome < 0
                    ? "bg-red-50"
                    : (idx % 2 === 0 ? "bg-white" : "bg-gray-50");
                if (Array.isArray(rows)) {
                  return rows.map((row, i) =>
                    React.cloneElement(row, {
                      className: infoColor + " text-black"
                    })
                  );
                }
                return React.cloneElement(rows, {
                  className: infoColor + " text-black"
                });
              })}
              <tr
                className="font-bold bg-blue-100 text-black"
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                  background: "#dbeafe"
                }}
              >
                <td className="border px-4 py-2 text-center" colSpan={3}>សរុប</td>
                <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.totalIce }}>{tableTotals.totalIceQuantity}</td>
                <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.quantity }}>{tableTotals.totalIceQuantity}</td>
                <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.price }}>{tableTotals.totalRevenue}</td>
                <td className="border px-4 py-2" style={{ backgroundColor: columnBgColors.total }}>{tableTotals.totalRevenue}</td>
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