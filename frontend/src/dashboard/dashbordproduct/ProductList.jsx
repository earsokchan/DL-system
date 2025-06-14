import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./productlist.css";

const ProductList = () => {
  const [selectedCategory, setSelectedCategory] = useState("NEW ARRIVALS");
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    images: ["", "", "", ""],
    stock: "",
    size: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFiles, setImageFiles] = useState(Array(4).fill(null));
  const [existingImages, setExistingImages] = useState(Array(4).fill(null));
  const [successMessage, setSuccessMessage] = useState(""); // Add state for success message

  const fetchProducts = async () => {
    try {
      const url = `https://apiv-1.vercel.app/api/products/${encodeURIComponent(selectedCategory)}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setEditingProductId(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://apiv-1.vercel.app/api/products/${encodeURIComponent(selectedCategory)}/${id}`
      );
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product._id);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || "",
      images: product.images || ["", "", "", ""],
      stock: product.stock,
      size: product.size,
    });
    setExistingImages(product.images || Array(4).fill(null));
    setImageFiles(Array(4).fill(null));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleImageChange = (e, index) => {
    const files = [...imageFiles];
    files[index] = e.target.files[0];
    setImageFiles(files);
    
    // Update the preview if a new image is selected
    if (e.target.files[0]) {
      const images = [...editFormData.images];
      images[index] = URL.createObjectURL(e.target.files[0]);
      setEditFormData({ ...editFormData, images });
    }
  };

  const handleRemoveImage = (index) => {
    const files = [...imageFiles];
    files[index] = null;
    setImageFiles(files);
    
    const images = [...editFormData.images];
    images[index] = "";
    setEditFormData({ ...editFormData, images });
    
    const existing = [...existingImages];
    existing[index] = null;
    setExistingImages(existing);
  };

  // Show a styled success message when edit is successful
  const showEditSuccess = () => {
    setSuccessMessage("Product updated successfully!");
    setTimeout(() => setSuccessMessage(""), 2500); // Hide after 2.5s
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", editFormData.name);
      formData.append("description", editFormData.description);
      formData.append("price", editFormData.price);
      formData.append("discountPrice", editFormData.discountPrice || "");
      formData.append("stock", editFormData.stock);
      formData.append("size", editFormData.size);
      
      // Append existing images that haven't been changed
      existingImages.forEach((img, index) => {
        if (img && !imageFiles[index]) {
          formData.append(`existingImages[${index}]`, img);
        }
      });
      
      // Append new image files
      imageFiles.forEach((file, index) => {
        if (file) {
          formData.append(`images`, file);
        }
      });

      await axios.put(
        `https://apiv-1.vercel.app/api/products/${encodeURIComponent(selectedCategory)}/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setEditingProductId(null);
      fetchProducts();
      showEditSuccess(); // Alert on success
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="product-list">
      {/* Success popup */}
      {successMessage && (
        <div className="success-popup">
          {successMessage}
        </div>
      )}
      <h2>{selectedCategory} Products</h2>
      <select value={selectedCategory} onChange={handleCategoryChange}>
        <option value="NEW ARRIVALS">NEW ARRIVALS</option>
        <option value="HOODIES">HOODIES</option>
        <option value="TEES">TEES</option>
        <option value="OUTFITS">OUTFITS</option>
      </select>
      <div className="product-grid">
        {products.length ? (
          products.map((product) => (
            <div key={product._id} className="product-card">
              {editingProductId === product._id ? (
                <form onSubmit={(e) => handleEditSubmit(e, product._id)}>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    required
                  />
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                  />
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="number"
                    name="discountPrice"
                    placeholder="Discount Price (optional)"
                    value={editFormData.discountPrice}
                    onChange={handleEditChange}
                  />
                  <div className="image-upload-container">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="image-upload-item">
                        {editFormData.images[index] ? (
                          <div className="image-preview-container">
                            <img 
                              src={editFormData.images[index]} 
                              alt={`Preview ${index}`} 
                              className="image-preview"
                            />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => handleRemoveImage(index)}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="file-upload-wrapper">
                            <label>
                              Upload Image {index + 1}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, index)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <input
                    type="number"
                    name="stock"
                    value={editFormData.stock}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="text"
                    name="size"
                    placeholder="Size (e.g., S, M, L)"
                    value={editFormData.size}
                    onChange={handleEditChange}
                    required
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingProductId(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div
                    id={`carousel-${product._id}`}
                    className="carousel slide"
                    data-bs-ride="carousel"
                  >
                    <div className="carousel-inner">
                      {product.images &&
                        product.images.map(
                          (image, index) =>
                            image && (
                              <div
                                key={index}
                                className={`carousel-item ${index === 0 ? "active" : ""}`}
                              >
                                <img
                                  src={image}
                                  alt={`${product.name} - Image ${index + 1}`}
                                  className="d-block w-100 product-image"
                                  style={{ height: "200px", objectFit: "cover", cursor: "pointer" }}
                                  onClick={() => handleImageClick(image)}
                                />
                              </div>
                            )
                        )}
                    </div>
                    {product.images.filter((url) => url.trim() !== "").length > 1 && (
                      <>
                        <button
                          className="carousel-control-prev"
                          type="button"
                          data-bs-target={`#carousel-${product._id}`}
                          data-bs-slide="prev"
                        >
                          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                          <span className="visually-hidden">Previous</span>
                        </button>
                        <button
                          className="carousel-control-next"
                          type="button"
                          data-bs-target={`#carousel-${product._id}`}
                          data-bs-slide="next"
                        >
                          <span className="carousel-control-next-icon" aria-hidden="true"></span>
                          <span className="visually-hidden">Next</span>
                        </button>
                      </>
                    )}
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p>
                    Price: 
                    {product.discountPrice ? (
                      <>
                        <span style={{ textDecoration: "line-through" }}>${product.price}</span>
                        <span style={{ color: "red", marginLeft: "5px" }}>${product.discountPrice}</span>
                      </>
                    ) : (
                      `$${product.price}`
                    )}
                  </p>
                  <p>Stock: {product.stock}</p>
                  <p>Size: {product.size}</p>
                  <button onClick={() => handleEditClick(product)}>Edit</button>
                  <button onClick={() => handleDelete(product._id)}>Delete</button>
                </>
              )}
            </div>
          ))
        ) : (
          <p>No products available in this category.</p>
        )}
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-content">
            <img src={selectedImage} alt="Selected" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;