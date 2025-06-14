import React, { useState, useEffect } from 'react';
import './userDriver.css'; // Make sure this CSS file exists and contains the necessary styles

const IceOrderForm = ({ initialData = null, onClose, onUpdateSuccess }) => {
  // State to manage form inputs
  const [customerName, setCustomerName] = useState('');
  const [iceOrders, setIceOrders] = useState({
    originalIce: Array(4).fill({ quantity: '', price: '' }),
    largeHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
    largeHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
    smallHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
    smallHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
  });

  // These states will now be directly editable for new users, and will display current values for existing.
  const [newDebt, setNewDebt] = useState(''); // Renamed from currentNewDebt for clarity
  const [payment, setPayment] = useState(''); // Renamed from currentPayment for clarity
  const [expenses, setExpenses] = useState(''); // Renamed from currentExpenses for clarity

  // States for the amounts to be added/subtracted (only relevant for existing customers)
  const [addDebtAmount, setAddDebtAmount] = useState('');
  const [addPaymentAmount, setAddPaymentAmount] = useState('');

  const [popupIceType, setPopupIceType] = useState(null); // Track which popup is open
  const [loading, setLoading] = useState(false); // To show loading state
  const [error, setError] = useState(null); // To handle errors
  const [success, setSuccess] = useState(false); // To show success message

  // Effect to pre-populate form when initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || '');

      const populatedIceOrders = {};
      for (const type in initialData.iceOrders) {
        const filteredOrders = initialData.iceOrders[type].filter(item => item.quantity !== 0 || item.price !== 0);
        populatedIceOrders[type] = [
          ...filteredOrders.map(item => ({
            quantity: item.quantity !== undefined ? item.quantity.toString() : '',
            price: item.price !== undefined ? item.price.toString() : '',
          })),
          ...Array(Math.max(0, 4 - filteredOrders.length)).fill({ quantity: '', price: '' }),
        ];
      }
      setIceOrders(populatedIceOrders);

      // Set current values for display and potential updates
      setNewDebt(initialData.newDebt !== undefined ? initialData.newDebt.toString() : '0');
      setPayment(initialData.payment !== undefined ? initialData.payment.toString() : '0');
      setExpenses(initialData.expenses !== undefined ? initialData.expenses.toString() : '0');

      // Clear the "add" input fields when an existing customer is loaded for editing
      setAddDebtAmount('');
      setAddPaymentAmount('');

    } else {
      // Clear form for new entry
      clearForm();
    }
  }, [initialData]);

  // Handle changes for ice order inputs
  const handleIceOrderChange = (iceType, index, field, value) => {
    const updatedIceOrders = { ...iceOrders };
    updatedIceOrders[iceType][index] = {
      ...updatedIceOrders[iceType][index],
      [field]: value,
    };
    setIceOrders(updatedIceOrders);
  };

  // Helper function to process ice order data before sending
  const processIceOrderData = (orders) => {
    const processedOrders = {};
    for (const type in orders) {
      processedOrders[type] = orders[type]
        .filter(item => item.quantity !== '' || item.price !== '')
        .map(item => ({
          quantity: item.quantity === '' ? 0 : Number(item.quantity),
          price: item.price === '' ? 0 : Number(item.price),
        }));
    }
    return processedOrders;
  };

  // Handle form submission for ice orders and other fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const processedIceOrders = processIceOrderData(iceOrders);

    const orderData = {
      customerName,
      iceOrders: processedIceOrders,
      // For new customers, these will be the directly entered values.
      // For existing customers, these will be the 'current' values,
      // which have already been updated by handleAddDebt/Payment.
      newDebt: Number(newDebt) || 0,
      payment: Number(payment) || 0,
      expenses: Number(expenses) || 0,
    };

    const url = initialData ? `http://localhost:5000/api/orders/${initialData._id}` : 'http://localhost:5000/api/orders';
    const method = initialData ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${initialData ? 'update' : 'save'} customer data.`);
      }

      const data = await response.json();
      console.log(`Customer data ${initialData ? 'updated' : 'saved'} successfully:`, data);
      setSuccess(true);
      if (initialData) {
        onUpdateSuccess(data);
      } else {
        clearForm(); // Clear the form after adding a new customer
      }
    } catch (err) {
      console.error(`Error ${initialData ? 'updating' : 'saving'} customer data:`, err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding debt (only for existing customers)
  const handleAddDebt = async () => {
    if (!initialData) {
      setError('Error: This function is only for adding to existing debt. For new customers, please input directly into "ប្រាក់ជំពាក់បច្ចុប្បន្ន".');
      return;
    }
    const amount = Number(addDebtAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number for new debt to add.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const url = `http://localhost:5000/api/orders/${initialData._id}/add-debt`; // New endpoint
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add new debt.');
      }

      const data = await response.json();
      setNewDebt(data.newDebt.toString()); // Update the displayed current new debt
      setAddDebtAmount(''); // Clear the input field
      setSuccess(true);
      onUpdateSuccess(data); // Propagate the updated customer data
    } catch (err) {
      console.error('Error adding debt:', err);
      setError(err.message || 'An unexpected error occurred while adding debt.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding payment (only for existing customers)
  const handleAddPayment = async () => {
    if (!initialData) {
      setError('Error: This function is only for adding to existing payment. For new customers, please input directly into "ប្រាក់សងបច្ចុប្បន្ន".');
      return;
    }
    const amount = Number(addPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number for payment to add.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const url = `http://localhost:5000/api/orders/${initialData._id}/add-payment`; // New endpoint
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment.');
      }

      const data = await response.json();
      setPayment(data.payment.toString()); // Update the displayed current payment
      setAddPaymentAmount(''); // Clear the input field
      setSuccess(true);
      onUpdateSuccess(data); // Propagate the updated customer data
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.message || 'An unexpected error occurred while recording payment.');
    } finally {
      setLoading(false);
    }
  };

  // Clear all form fields
  const clearForm = () => {
    setCustomerName('');
    setIceOrders({
      originalIce: Array(4).fill({ quantity: '', price: '' }),
      largeHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
      largeHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
      smallHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
      smallHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
    });
    setNewDebt(''); // Clear for new entry
    setPayment(''); // Clear for new entry
    setExpenses('');
    setAddDebtAmount(''); // Clear add debt field
    setAddPaymentAmount(''); // Clear add payment field
    setPopupIceType(null); // Close any open popup
    setError(null); // Clear errors
    setSuccess(false); // Clear success message
  };

  // Helper function to render ice input rows (for popup)
  const renderIceInputs = (iceType, label, isPopup = false) => (
    <div className={isPopup ? "" : "mb-4 p-4 border rounded-md shadow-sm"}>
      <h3
        className={`font-semibold text-lg mb-2 ${isPopup ? 'popup-heading' : ''}`}
      >
        {label}
      </h3>
      {iceOrders[iceType].map((order, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label htmlFor={`${iceType}-quantity-${index}`} className="block text-sm font-medium text-gray-700">
              ចំណួន (Quantity)
            </label>
            <input
              type="number"
              id={`${iceType}-quantity-${index}`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
              value={order.quantity}
              onChange={(e) =>
                handleIceOrderChange(iceType, index, 'quantity', e.target.value)
              }
            />
          </div>
          <div>
            <label htmlFor={`${iceType}-price-${index}`} className="block text-sm font-medium text-gray-700">
              តម្លៃ (Price)
            </label>
            <input
              type="number"
              id={`${iceType}-price-${index}`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
              value={order.price}
              onChange={(e) =>
                handleIceOrderChange(iceType, index, 'price', e.target.value)
              }
            />
          </div>
        </div>
      ))}
      {isPopup && (
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => {
              setIceOrders((prev) => ({
                ...prev,
                [iceType]: Array(4).fill({ quantity: '', price: '' }),
              }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setPopupIceType(null)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {initialData ? 'កែសម្រួលព័ត៌មានអតិថិជន (Edit Customer Info)' : 'បន្ថែមអតិថិជនថ្មី (Add New Customer)'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            គោត្តនាម (Customer Name)
          </label>
          <input
            type="text"
            id="customerName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        {/* Ice Type Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">ប្រភេទទឹកកក (Ice Type)</h2>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className="font-semibold text-left p-2 border rounded-md"
              onClick={() => setPopupIceType('originalIce')}
            >
              ទឹកកកដើម (Original Ice)
            </button>
            <button
              type="button"
              className="font-semibold text-left p-2 border rounded-md"
              onClick={() => setPopupIceType('largeHygiene20kg')}
            >
              ទឹកកកអនាម័យធំ (Large) 20kg
            </button>
            <button
              type="button"
              className="font-semibold text-left p-2 border rounded-md"
              onClick={() => setPopupIceType('largeHygiene30kg')}
            >
              ទឹកកកអនាម័យធំ (Large) 30kg
            </button>
            <button
              type="button"
              className="font-semibold text-left p-2 border rounded-md"
              onClick={() => setPopupIceType('smallHygiene20kg')}
            >
              ទឹកកកអនាម័យតូច (Small) 20kg
            </button>
            <button
              type="button"
              className="font-semibold text-left p-2 border rounded-md"
              onClick={() => setPopupIceType('smallHygiene30kg')}
            >
              ទឹកកកអនាម័យតូច (Small) 30kg
            </button>
          </div>
        </div>

        {/* Popup for ice type input */}
        {popupIceType && (
          <div className="popup-overlay">
            <div className="popup-content">
              {renderIceInputs(
                popupIceType,
                {
                  originalIce: 'ទឹកកកដើម (Original Ice)',
                  largeHygiene20kg: 'ទឹកកកអនាម័យធំ (Large) 20kg',
                  largeHygiene30kg: 'ទឹកកកអនាម័យធំ (Large) 30kg',
                  smallHygiene20kg: 'ទឹកកកអនាម័យតូច (Small) 20kg',
                  smallHygiene30kg: 'ទឹកកកអនាម័យតូច (Small) 30kg'
                }[popupIceType],
                true
              )}
            </div>
          </div>
        )}

        {/* Financial Details */}
        <h2 className="text-2xl font-semibold mb-4 mt-6">ព័ត៌មានហិរញ្ញវត្ថុ (Financial Details)</h2>

        {/* Current New Debt / Direct New Debt Input */}
        <div className="mb-4">
          <label htmlFor="newDebt" className="block text-sm font-medium text-gray-700">
            ប្រាក់ជំពាក់បច្ចុប្បន្ន (Current New Debt)
          </label>
          <input
            type="number"
            id="newDebt"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 ${initialData ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'}`}
            value={newDebt}
            onChange={(e) => setNewDebt(e.target.value)}
            disabled={!!initialData && !addDebtAmount} // Disable direct input if it's an existing customer AND no "add" amount is being entered
          />
        </div>

        {/* Add New Debt Section (only for existing customers) */}
        {initialData && (
          <div className="mb-4 p-4 border rounded-md shadow-sm bg-blue-50">
            <label htmlFor="addDebtAmount" className="block text-sm font-medium text-gray-700 mb-2">
              បញ្ចូលប្រាក់ជំពាក់ថ្មីបន្ថែម (Add More New Debt)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                id="addDebtAmount"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
                value={addDebtAmount}
                onChange={(e) => setAddDebtAmount(e.target.value)}
                placeholder="Enter amount to add"
              />
              <button
                type="button"
                onClick={handleAddDebt}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={loading}
              >
                បន្ថែម (Add)
              </button>
            </div>
          </div>
        )}

        {/* Current Payment / Direct Payment Input */}
        <div className="mb-4">
          <label htmlFor="payment" className="block text-sm font-medium text-gray-700">
            ប្រាក់សងបច្ចុប្បន្ន (Current Payment)
          </label>
          <input
            type="number"
            id="payment"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 ${initialData ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'}`}
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            disabled={!!initialData && !addPaymentAmount} // Disable direct input if it's an existing customer AND no "add" amount is being entered
          />
        </div>

        {/* Add Payment Section (only for existing customers) */}
        {initialData && (
          <div className="mb-4 p-4 border rounded-md shadow-sm bg-yellow-50">
            <label htmlFor="addPaymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
              បញ្ចូលប្រាក់សងបន្ថែម (Add More Payment)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                id="addPaymentAmount"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
                value={addPaymentAmount}
                onChange={(e) => setAddPaymentAmount(e.target.value)}
                placeholder="Enter amount to pay"
              />
              <button
                type="button"
                onClick={handleAddPayment}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={loading}
              >
                សង (Pay)
              </button>
            </div>
          </div>
        )}

        {/* Expenses (this input allows direct editing as before) */}
        <div className="mb-6">
          <label htmlFor="expenses" className="block text-sm font-medium text-gray-700">
            ថ្លៃសាំង បាយ (Expenses)
          </label>
          <input
            type="number"
            id="expenses"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
            value={expenses} // Now bound to `expenses` state
            onChange={(e) => setExpenses(e.target.value)}
          />
        </div>

        {/* Loading, Error, and Success Messages */}
        {loading && <p className="text-blue-500 text-center mb-4">{initialData ? 'Updating data...' : 'Saving data...'}</p>}
        {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
        {success && <p className="text-green-500 text-center mb-4">Customer data {initialData ? 'updated' : 'saved'} successfully!</p>}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={initialData ? onClose : clearForm}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {initialData ? 'Cancel' : 'Clear'}
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? (initialData ? 'Updating...' : 'Saving...') : (initialData ? 'Update Customer' : 'Save Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IceOrderForm;