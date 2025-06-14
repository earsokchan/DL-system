import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './stock.css'; // Import the CSS file

function Stock() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    qty: '',
    size: '',
    color: ''
  });
  const [editId, setEditId] = useState(null); // Track the ID of the product being edited
  const [filterDate, setFilterDate] = useState({
    month: '',
    year: ''
  });

  // Fetch products from the backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://target-dash-board.vercel.app/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Handle input changes for product fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  // Add or update a product
  const addProduct = async () => {
    if (newProduct.name && newProduct.qty && newProduct.size && newProduct.color) {
      try {
        if (editId !== null) {
          // Update existing product
          await axios.put(`https://target-dash-board.vercel.app/api/products/${editId}`, newProduct);
        } else {
          // Add new product
          await axios.post('https://target-dash-board.vercel.app/api/products', newProduct);
        }
        fetchProducts(); // Refresh the product list
        setNewProduct({ name: '', qty: '', size: '', color: '' }); // Clear the form
        setEditId(null); // Reset edit mode
      } catch (error) {
        console.error('Error saving product:', error);
      }
    } else {
      alert('Please fill all fields');
    }
  };

  // Edit a product
  const editProduct = (product) => {
    setNewProduct(product); // Pre-fill the form with the selected product's data
    setEditId(product._id); // Set the ID of the product being edited
  };

  // Delete a product
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`https://target-dash-board.vercel.app/api/products/${id}`);
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Filter products by month and year
  const filteredProducts = products.filter((product) => {
    const productDate = new Date(product.date);
    return (
      (!filterDate.month || productDate.getMonth() + 1 === parseInt(filterDate.month)) &&
      (!filterDate.year || productDate.getFullYear() === parseInt(filterDate.year))
    );
  });

  return (
    <div className="stock-dashboard">
      <h1 className="dashboard-title">Stock Management Dashboard</h1>

      {/* Add/Edit Product Form */}
      <div className="form-container">
        <h3>{editId !== null ? 'Edit Product' : 'Add New Product'}</h3>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            name="name"
            value={newProduct.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            name="qty"
            value={newProduct.qty}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>Size</label>
          <input
            type="text"
            placeholder="Enter size"
            name="size"
            value={newProduct.size}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>Color</label>
          <input
            type="text"
            placeholder="Enter color"
            name="color"
            value={newProduct.color}
            onChange={handleInputChange}
          />
        </div>
        <button className="btn" onClick={addProduct}>
          {editId !== null ? 'Update Product' : 'Add Product'}
        </button>
      </div>

      {/* Date Filter */}
      <div className="filter-container">
        <h3>Filter Products by Date</h3>
        <div className="filter-group">
          <label>Month</label>
          <select
            name="month"
            value={filterDate.month}
            onChange={(e) => setFilterDate({ ...filterDate, month: e.target.value })}
          >
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Year</label>
          <select
            name="year"
            value={filterDate.year}
            onChange={(e) => setFilterDate({ ...filterDate, year: e.target.value })}
          >
            <option value="">Select Year</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="table-container">
        <h3>Product List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Size</th>
              <th>Color</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.qty}</td>
                  <td>{product.size}</td>
                  <td>{product.color}</td>
                  <td>{product.date}</td>
                  <td>
                    <button className="btn-edit" onClick={() => editProduct(product)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteProduct(product._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stock;
