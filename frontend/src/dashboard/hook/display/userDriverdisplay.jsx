// userDriverdisplay.jsx
import React, { useState, useEffect } from 'react';
import IceOrderForm from '../userDriver'; // Import the form component
import html2canvas from 'html2canvas'; // Import html2canvas for capturing DOM
import jsPDF from 'jspdf'; // Import jsPDF for generating PDF

const Display = () => {
    // Use useState to manage the customers data
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null); // State to hold customer data for editing
    const [showEditModal, setShowEditModal] = useState(false); // State to control modal visibility
    const [reportDebts, setReportDebts] = useState({}); // { customerName: totalDebt }

    // Function to fetch customers
    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/orders'); // Adjust URL if your backend is on a different port/domain
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch customer data.');
            }
            const data = await response.json();
            setCustomers(data); // Set the fetched data to the state
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError(err.message || 'An unexpected error occurred while fetching data.');
        } finally {
            setLoading(false); // End loading regardless of success or failure
        }
    };

    // Fetch latest report debts
    const fetchLatestReportDebts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/reports');
            if (!res.ok) return;
            const reports = await res.json();
            if (!Array.isArray(reports) || reports.length === 0) return;
            // Get the latest report (by date)
            const latestReport = reports.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
            // Map customerName -> totalDebt
            const debts = {};
            (latestReport.customersData || []).forEach(cust => {
                debts[cust.customerName] = cust.totalDebt;
            });
            setReportDebts(debts);
        } catch (e) {
            // ignore error, fallback to 0
        }
    };

    // useEffect to fetch data when the component mounts
    useEffect(() => {
        fetchCustomers();
        fetchLatestReportDebts();
    }, []); // The empty dependency array ensures this runs only once on mount

    // Calculate total revenue for a single customer (overall, across all ice types)
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

    // Calculate total quantity for a specific ice type or all ice types
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

    // Handle delete action
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer record?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/orders/${id}`, { // Adjust URL
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete customer data.');
                }

                // If deletion is successful on the backend, update the frontend state
                setCustomers(customers.filter((customer) => customer._id !== id)); // Use _id from MongoDB
            } catch (err) {
                console.error('Error deleting customer:', err);
                setError(err.message || 'An unexpected error occurred during deletion.');
            }
        }
    };

    // Handle edit action - set the customer to be edited and open the modal
    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowEditModal(true);
    };

    // Handle successful update - update the customer in the list and close the modal
    const handleUpdateSuccess = (updatedCustomer) => {
        setCustomers(customers.map(cust =>
            cust._id === updatedCustomer._id ? updatedCustomer : cust
        ));
        setShowEditModal(false);
        setEditingCustomer(null);
    };

    // Handle closing the edit modal
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingCustomer(null);
    };

    // **FIXED FUNCTION**: saveReportToDatabase and generate PDF
    const saveReportAndGeneratePdf = async () => {
        try {
            // 1. Save the current report data to the database
            const reportData = {
                date: new Date().toISOString(),
                customersData: customers
            };

            const dbResponse = await fetch('http://localhost:5000/api/reports', {
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

    // Helper to toggle export style
    const toggleExportStyle = (enable) => {
        const tableDiv = document.getElementById('customer-table');
        if (tableDiv) {
            if (enable) {
                tableDiv.classList.add('export-pdf-style');
            } else {
                tableDiv.classList.remove('export-pdf-style');
            }
        }
    };

    // **NEW FUNCTION**: Export report to PDF (with style fix)
    const exportReportToPdf = async () => {
        const input = document.getElementById('customer-table');
        if (!input) {
            alert('Cannot find the customer table to export.');
            return;
        }
        try {
            toggleExportStyle(true); // Apply white bg/black text
            // Wait for style to apply
            await new Promise((resolve) => setTimeout(resolve, 100));
            const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#fff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4',
            });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save('customer-report.pdf');
        } catch (err) {
            console.error('Error exporting PDF:', err);
            alert('Failed to export PDF.');
        } finally {
            toggleExportStyle(false); // Remove export style
        }
    };

    // Combined handler for Save Report and Export PDF
    const handleSaveAndExport = async () => {
        await saveReportAndGeneratePdf();
        await exportReportToPdf();
    };

    // Render ice type details for a customer
    const renderIceTypeDetails = (customer) => {
        const iceTypes = [
            { key: 'originalIce', label: 'ទឹកកកដើម' },
            { key: 'largeHygiene20kg', label: 'ទឹកកកអនាម័យធំ 20kg' },
            { key: 'largeHygiene30kg', label: 'ទឹកកកអនាម័យធំ 30kg' },
            { key: 'smallHygiene20kg', label: 'ទឹកកកអនាម័យតូច 20kg' },
            { key: 'smallHygiene30kg', label: 'ទឹកកកអនាម័យតូច 30kg' },
        ];

        let totalValidOrdersAcrossAllTypes = 0;
        iceTypes.forEach((type) => {
            const orders = customer.iceOrders?.[type.key] || [];
            totalValidOrdersAcrossAllTypes += orders.filter((order) => order.quantity || order.price).length;
        });

        // If no specific ice orders, render a single row for the customer's overall data
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
                    {/* Use totalDebt from reportDebts */}
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

        // Generate rows for each valid ice order
        const rows = [];
        let firstRowForCustomer = true;

        iceTypes.forEach((type) => {
            const orders = customer.iceOrders?.[type.key] || [];
            const validTypeOrders = orders.filter((order) => order.quantity !== 0 || order.price !== 0); // Consider 0 as valid if explicitly set

            if (validTypeOrders.length > 0) {
                validTypeOrders.forEach((order, orderIndex) => {
                    const totalPerIceType = (parseFloat(order.quantity) || 0) * (parseFloat(order.price) || 0);

                    rows.push(
                        <tr key={`${customer._id}-${type.key}-${orderIndex}`}>
                            {/* Only show customer info for the first row of the customer */}
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
                            {/* Only show ice type label and total quantity for the first row of this ice type */}
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
                                        {/* Use totalDebt from reportDebts */}
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
                    firstRowForCustomer = false; // Only the very first valid order row gets the rowSpanned cells
                });
            }
        });

        return rows;
    };

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
            <div className="flex justify-end mb-4">
                <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleSaveAndExport}
                >
                    Save Report
                </button>
                {/* Removed Export to PDF button */}
            </div>
            {customers.length === 0 ? (
                <p className="text-center text-gray-500">មិនមានទិន្នន័យអតិថិជនទេ (No customer data)</p>
            ) : (
                <div id="customer-table">
                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                {/* Row 1: Main Categories */}
                                <th rowSpan="2" className="border px-4 py-2">ល.រ</th>
                                <th rowSpan="2" className="border px-4 py-2">គោត្តនាម</th>
                                <th rowSpan="2" className="border px-4 py-2">ប្រភេទទឹកកក</th>
                                <th colSpan="4" className="border px-4 py-2">ចំណូល</th> {/* Colspan 4 for Quantity, Price, Total */}
                                <th colSpan="4" className="border px-4 py-2">ប្រាក់ជំពាក់</th> {/* Adjusted colSpan to 4 for Previous Debt + New Debt + Payment + Total Debt */}
                                <th rowSpan="2" className="border px-4 py-2">ថ្លៃសាំង បាយ</th>
                                <th rowSpan="2" className="border px-4 py-2">សរុបចំណូល</th>
                                <th rowSpan="2" className="border px-4 py-2">សកម្មភាព</th>
                            </tr>
                            <tr className="bg-gray-100">
                                {/* Row 2: Sub-categories for Income and Debt */}
                                <th className="border px-4 py-2">សរុបបរិមាណទឹកកក</th> {/* Total quantity for THIS ice type */}
                                <th className="border px-4 py-2">បរិមាណ</th>
                                <th className="border px-4 py-2">តម្លៃរាយ</th>
                                <th className="border px-4 py-2">សរុប</th> {/* This is the total revenue for a specific ice type order */}
                                <th className="border px-4 py-2">ប្រាក់ជំពាក់ចាស់</th> {/* Added Previous Debt */}
                                <th className="border px-4 py-2">ប្រាក់ជំពាក់ថ្មី</th>
                                <th className="border px-4 py-2">ប្រាក់សង</th>
                                <th className="border px-4 py-2">សរុបប្រាក់ជំពាក់</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => renderIceTypeDetails(customer))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Customer Modal/Form */}
            {showEditModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', // Darker overlay for modal
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflowY: 'auto' // Allow scrolling for long forms
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '10px',
                            padding: '2rem',
                            minWidth: '320px',
                            maxWidth: '800px', // Increased max-width for better form display
                            width: '90%', // Use a percentage width
                            maxHeight: '90vh', // Limit height and enable scrolling if content overflows
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
            {/* Add this style at the end of the file (or in your global CSS if preferred) */}
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