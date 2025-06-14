import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Order.css"; // Import the CSS file

const AddBanner = () => {
  const [slot, setSlot] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [banners, setBanners] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const fileInputRef = useRef(null); // Add ref for file input

  const handleSlotChange = (e) => setSlot(e.target.value);
  const handleImageChange = (e) => setImage(e.target.files[0]);

  // Fetch banners from backend
  const fetchBanners = async () => {
    try {
      const res = await axios.get("https://apiv-1.vercel.app/api/get/banners");
      setBanners(res.data);
    } catch (err) {
      setBanners([]);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Delete banner by slot
  const handleDelete = async (slot) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await axios.delete(`https://apiv-1.vercel.app/api/delete/banner/${slot}`);
      setMessage("Banner deleted successfully.");
      fetchBanners();
      // If deleting the banner currently being edited, reset form
      if (editMode && editSlot === slot) {
        setEditMode(false);
        setEditSlot(null);
        setSlot("");
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error deleting banner.");
    }
  };

  // Edit banner: prefill form with selected banner's slot
  const handleEdit = (banner) => {
    setEditMode(true);
    setEditSlot(banner.slot);
    setSlot(banner.slot);
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slot || (!image && !editMode)) {
      setMessage("Please select a slot and an image.");
      return;
    }
    const formData = new FormData();
    formData.append("slot", slot);
    if (image) formData.append("image", image);

    try {
      const res = await axios.post(
        "https://apiv-1.vercel.app/api/post/banners",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(res.data.message || "Banner added!");
      setSlot("");
      setImage(null);
      setEditMode(false);
      setEditSlot(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      fetchBanners(); // Refresh banners after upload
    } catch (err) {
      setMessage(err.response?.data?.message || "Error uploading banner.");
    }
  };

  return (
    <div className="banner-management">
      <form className="add-banner-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="slot">Slot:</label>
          <select
            id="slot"
            value={slot}
            onChange={handleSlotChange}
            required
            disabled={editMode} // Prevent changing slot in edit mode
          >
            <option value="">Select slot</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div>
          <label htmlFor="banner-image">Image:</label>
          <input
            id="banner-image"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required={!editMode} // Only required when adding
          />
        </div>
        <button type="submit">{editMode ? "Update Banner" : "Add Banner"}</button>
        {editMode && (
          <button
            type="button"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEditMode(false);
              setEditSlot(null);
              setSlot("");
              setImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              setMessage("");
            }}
          >
            Cancel
          </button>
        )}
        {message && (
          <div
            className={
              "banner-message" +
              (message.toLowerCase().includes("error")
                ? " error"
                : " success")
            }
          >
            {message}
          </div>
        )}
      </form>
      <hr style={{ margin: "32px 0" }} />
      <h3 style={{ marginBottom: 18, fontWeight: 600, fontSize: 22 }}>Current Banners</h3>
      <div className="banner-grid">
        {banners.map((banner) => (
          <div className="banner-card" key={banner.slot}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Slot: {banner.slot}</div>
            <div className="banner-preview">
              <img
                src={banner.imageUrl}
                alt={`Banner slot ${banner.slot}`}
              />
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => handleEdit(banner)}>Edit</button>
              <button onClick={() => handleDelete(banner.slot)} style={{ color: "red" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddBanner;
