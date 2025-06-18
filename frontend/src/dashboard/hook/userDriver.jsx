"use client"

import { useState, useEffect } from "react"
import "./userDriver.css"

const IceOrderForm = ({ initialData = null, onClose, onUpdateSuccess }) => {
  const [customerName, setCustomerName] = useState("")
  const [iceOrders, setIceOrders] = useState({
    originalIce: Array(4).fill({ quantity: "", price: "" }),
    largeHygiene20kg: Array(4).fill({ quantity: "", price: "" }),
    largeHygiene30kg: Array(4).fill({ quantity: "", price: "" }),
    smallHygiene20kg: Array(4).fill({ quantity: "", price: "" }),
    smallHygiene30kg: Array(4).fill({ quantity: "", price: "" }),
  })

  const [newDebt, setNewDebt] = useState("")
  const [payment, setPayment] = useState("")
  const [expenses, setExpenses] = useState("")
  const [addDebtAmount, setAddDebtAmount] = useState("")
  const [addPaymentAmount, setAddPaymentAmount] = useState("")
  const [popupIceType, setPopupIceType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || "")

      const populatedIceOrders = {}
      for (const type in initialData.iceOrders) {
        const filteredOrders = initialData.iceOrders[type].filter((item) => item.quantity !== 0 || item.price !== 0)
        populatedIceOrders[type] = [
          ...filteredOrders.map((item) => ({
            quantity: item.quantity !== undefined ? item.quantity.toString() : "",
            price: item.price !== undefined ? item.price.toString() : "",
          })),
          ...Array(Math.max(0, 4 - filteredOrders.length)).fill({ quantity: "", price: "" }),
        ]
      }
      setIceOrders(populatedIceOrders)

      setNewDebt(initialData.newDebt !== undefined ? initialData.newDebt.toString() : "0")
      setPayment(initialData.payment !== undefined ? initialData.payment.toString() : "0")
      setExpenses(initialData.expenses !== undefined ? initialData.expenses.toString() : "0")

      setAddDebtAmount("")
      setAddPaymentAmount("")
    } else {
      clearForm()
    }
  }, [initialData])

  const handleIceOrderChange = (iceType, index, field, value) => {
    const updatedIceOrders = { ...iceOrders }
    updatedIceOrders[iceType][index] = {
      ...updatedIceOrders[iceType][index],
      [field]: value,
    }
    setIceOrders(updatedIceOrders)
  }

  const processIceOrderData = (orders) => {
    const processedOrders = {}
    for (const type in orders) {
      processedOrders[type] = orders[type]
        .filter((item) => item.quantity !== "" || item.price !== "")
        .map((item) => ({
          quantity: item.quantity === "" ? 0 : Number(item.quantity),
          price: item.price === "" ? 0 : Number(item.price),
        }))
    }
    return processedOrders
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const processedIceOrders = processIceOrderData(iceOrders)

    let updatedNewDebt = Number(newDebt) || 0
    let updatedPayment = Number(payment) || 0

    if (initialData) {
      if (addDebtAmount) {
        updatedNewDebt += Number(addDebtAmount) || 0
      }
      if (addPaymentAmount) {
        updatedPayment += Number(addPaymentAmount) || 0
      }
    }

    const orderData = {
      customerName,
      iceOrders: processedIceOrders,
      newDebt: updatedNewDebt,
      payment: updatedPayment,
      expenses: Number(expenses) || 0,
    }

    const url = initialData
      ? `http://localhost:5000/api/orders/${initialData._id}`
      : "http://localhost:5000/api/api/orders"
    const method = initialData ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${initialData ? "update" : "save"} customer data.`)
      }

      const data = await response.json()
      setSuccess(true)
      if (initialData) {
        onUpdateSuccess && onUpdateSuccess(data)
        setAddDebtAmount("")
        setAddPaymentAmount("")
      } else {
        clearForm()
        window.location.reload()
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setCustomerName("")
    setIceOrders({
      originalIce: Array(4).fill({ quantity: "", price: "" }),
      largeHygiene20kg: Array(4).fill({ quantity: "", price: "" }),
      largeHygiene30kg: Array(4).fill({ quantity: "", price: "" }),
      smallHygiene20kg: Array(4).fill({ quantity: "", price: "" }),
      smallHygiene30kg: Array(4).fill({ quantity: "", price: "" }),
    })
    setNewDebt("")
    setPayment("")
    setExpenses("")
    setAddDebtAmount("")
    setAddPaymentAmount("")
    setPopupIceType(null)
    setError(null)
    setSuccess(false)
  }

  const clearFinancialData = () => {
    setNewDebt("")
    setPayment("")
    setExpenses("")
    setAddDebtAmount("")
    setAddPaymentAmount("")
  }

  const renderIceInputs = (iceType, label) => (
    <div className="ice-inputs-container">
      <h3 className="ice-type-title">{label}</h3>
      {iceOrders[iceType].map((order, index) => (
        <div key={index} className="ice-input-row">
          <div className="input-group">
            <label htmlFor={`${iceType}-quantity-${index}`} className="input-label">
              ចំណួន (Quantity)
            </label>
            <input
              type="number"
              id={`${iceType}-quantity-${index}`}
              value={order.quantity}
              onChange={(e) => handleIceOrderChange(iceType, index, "quantity", e.target.value)}
              placeholder="0"
              className="form-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor={`${iceType}-price-${index}`} className="input-label">
              តម្លៃ (Price)
            </label>
            <input
              type="number"
              id={`${iceType}-price-${index}`}
              value={order.price}
              onChange={(e) => handleIceOrderChange(iceType, index, "price", e.target.value)}
              placeholder="0"
              className="form-input"
            />
          </div>
        </div>
      ))}
      <div className="popup-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setIceOrders((prev) => ({
              ...prev,
              [iceType]: Array(4).fill({ quantity: "", price: "" }),
            }))
          }}
        >
          Clear
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setPopupIceType(null)}>
          Done
        </button>
      </div>
    </div>
  )

  const iceTypeLabels = {
    originalIce: "ទឹកកកដើម (Original Ice)",
    largeHygiene20kg: "ទឹកកកអនាម័យធំ (Large) 20kg",
    largeHygiene30kg: "ទឹកកកអនាម័យធំ (Large) 30kg",
    smallHygiene20kg: "ទឹកកកអនាម័យតូច (Small) 20kg",
    smallHygiene30kg: "ទឹកកកអនាម័យតូច (Small) 30kg",
  }

  // Calculate totals for display
  const currentDebtTotal = (Number(newDebt) || 0) + (Number(addDebtAmount) || 0)
  const currentPaymentTotal = (Number(payment) || 0) + (Number(addPaymentAmount) || 0)
  const netBalance = currentDebtTotal - currentPaymentTotal

  return (
    <div className="ice-order-form">
      <div className="form-header">
        <h1 className="form-title">{initialData ? "កែសម្រួលព័ត៌មានអតិថិជន" : "បន្ថែមអតិថិជនថ្មី"}</h1>
        <p className="form-subtitle">{initialData ? "Edit Customer Information" : "Add New Customer"}</p>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        {/* Customer Name */}
        <div className="form-section customer-section">
          <div className="section-header">
            <h2 className="section-title">👤 Customer Information</h2>
          </div>
          <div className="section-content">
            <div className="input-group">
              <label htmlFor="customerName" className="input-label">
                គោត្តនាម (Customer Name) *
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Enter customer name"
                className="form-input form-input-large"
              />
            </div>
          </div>
        </div>

        {/* Ice Types */}
        <div className="form-section ice-section">
          <div className="section-header">
            <h2 className="section-title">🧊 ប្រភេទទឹកកក (Ice Types)</h2>
          </div>
          <div className="section-content">
            <div className="ice-type-buttons">
              {Object.entries(iceTypeLabels).map(([key, label]) => (
                <button key={key} type="button" className="ice-type-btn" onClick={() => setPopupIceType(key)}>
                  <span className="btn-icon">➕</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Details - Reorganized */}
        <div className="form-section financial-section">
          <div className="section-header">
            <h2 className="section-title">💰 ព័ត៌មានហិរញ្ញវត្ថុ (Financial Details)</h2>
            <button
              type="button"
              className="clear-financial-btn"
              onClick={clearFinancialData}
              title="Clear all financial data"
            >
              🗑️ Clear
            </button>
          </div>
          <div className="section-content">
            {/* Financial Summary Card */}
            {(initialData || Number(newDebt) > 0 || Number(payment) > 0) && (
              <div className="financial-summary-card">
                <h3 className="summary-title">📊 Financial Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item debt-summary">
                    <span className="summary-label">Total Debt:</span>
                    <span className="summary-value debt-value">{currentDebtTotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-item payment-summary">
                    <span className="summary-label">Total Payment:</span>
                    <span className="summary-value payment-value">{currentPaymentTotal.toFixed(2)}</span>
                  </div>
                  <div
                    className={`summary-item balance-summary ${netBalance >= 0 ? "debt-balance" : "credit-balance"}`}
                  >
                    <span className="summary-label">Net Balance:</span>
                    <span className="summary-value balance-value">
                      {Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? "(Owed)" : "(Credit)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Debt Management */}
            <div className="financial-group debt-group">
              <h3 className="group-title">
                <span className="group-icon">📈</span>
                ការគ្រប់គ្រងប្រាក់ជំពាក់ (Debt Management)
              </h3>

              <div className="financial-inputs-grid">
                <div className="input-group">
                  <label htmlFor="newDebt" className="input-label">
                    ប្រាក់ជំពាក់បច្ចុប្បន្ន (Current Debt)
                  </label>
                  <input
                    type="number"
                    id="newDebt"
                    value={newDebt}
                    onChange={(e) => setNewDebt(e.target.value)}
                    disabled={!!initialData}
                    placeholder="0.00"
                    className="form-input financial-input"
                    step="0.01"
                    min="0"
                  />
                </div>

                {initialData && (
                  <div className="input-group add-debt-group">
                    <label htmlFor="addDebtAmount" className="input-label add-debt-label">
                      បន្ថែមប្រាក់ជំពាក់ (Add Debt)
                    </label>
                    <input
                      type="number"
                      id="addDebtAmount"
                      value={addDebtAmount}
                      onChange={(e) => setAddDebtAmount(e.target.value)}
                      placeholder="0.00"
                      className="form-input financial-input add-debt-input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Management */}
            <div className="financial-group payment-group">
              <h3 className="group-title">
                <span className="group-icon">💳</span>
                ការគ្រប់គ្រងការទូទាត់ (Payment Management)
              </h3>

              <div className="financial-inputs-grid">
                <div className="input-group">
                  <label htmlFor="payment" className="input-label">
                    ប្រាក់សងបច្ចុប្បន្ន (Current Payment)
                  </label>
                  <input
                    type="number"
                    id="payment"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    disabled={!!initialData}
                    placeholder="0.00"
                    className="form-input financial-input"
                    step="0.01"
                    min="0"
                  />
                </div>

                {initialData && (
                  <div className="input-group add-payment-group">
                    <label htmlFor="addPaymentAmount" className="input-label add-payment-label">
                      បន្ថែមការទូទាត់ (Add Payment)
                    </label>
                    <input
                      type="number"
                      id="addPaymentAmount"
                      value={addPaymentAmount}
                      onChange={(e) => setAddPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="form-input financial-input add-payment-input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Expenses */}
            <div className="financial-group expenses-group">
              <h3 className="group-title">
                <span className="group-icon">🍽️</span>
                ការចំណាយ (Expenses)
              </h3>

              <div className="input-group">
                <label htmlFor="expenses" className="input-label">
                  ថ្លៃសាំង បាយ (Gas & Food Expenses)
                </label>
                <input
                  type="number"
                  id="expenses"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="0.00"
                  className="form-input financial-input expenses-input"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Form Actions - Integrated */}
            <div className="financial-actions">
              <button
                type="button"
                className="btn btn-secondary btn-large"
                onClick={initialData ? onClose : clearForm}
                disabled={loading}
              >
                <span className="btn-icon">❌</span>
                {initialData ? "Cancel" : "Clear All"}
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary btn-large">
                {loading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    {initialData ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <span className="btn-icon">{initialData ? "✏️" : "💾"}</span>
                    {initialData ? "Update Customer" : "Save Customer"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="alert alert-info">
            <div className="loading-spinner"></div>
            {initialData ? "Updating customer data..." : "Saving customer data..."}
          </div>
        )}

        {error && <div className="alert alert-error">❌ Error: {error}</div>}

        {success && (
          <div className="alert alert-success">✅ Customer data {initialData ? "updated" : "saved"} successfully!</div>
        )}
      </form>

      {/* Popup Modal */}
      {popupIceType && (
        <div className="popup-overlay" onClick={() => setPopupIceType(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-btn" type="button" onClick={() => setPopupIceType(null)}>
              ✕
            </button>
            {renderIceInputs(popupIceType, iceTypeLabels[popupIceType])}
          </div>
        </div>
      )}
    </div>
  )
}

export default IceOrderForm
