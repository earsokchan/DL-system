import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
    padding: "80px 30px 30px 280px",
  },
  input: {
    margin: "20px 0",
    padding: "10px",
    fontSize: "16px",
    width: "100%",
    maxWidth: "400px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "0 10px",
  },
  paginationButton: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "5px",
    opacity: (props) => (props.disabled ? 0.5 : 1),
  },
  preview: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#333",
  },
  uploadedImage: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#333",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  loading: {
    marginTop: "20px",
    fontSize: "16px",
    color: "#007bff",
  },
  error: {
    marginTop: "20px",
    fontSize: "16px",
    color: "#ff0000",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
    marginTop: "20px",
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  imageLink: {
    textDecoration: "none",
    color: "#333",
  },
  idText: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#555",
  },
  pagination: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

const Hoodieimage = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [imageCount, setImageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check if an image exists
  const checkImageExists = async (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Function to find all available images
  const findAvailableImages = async () => {
    setIsLoading(true);
    const foundImages = [];
    let highestFound = 0;
    
    // Check images in batches for better performance
    const batchSize = 20;
    let batchStart = 1;
    let consecutiveFails = 0;

    while (consecutiveFails < batchSize && batchStart <= 1000) {
      const batchPromises = [];
      
      // Create a batch of image checks
      for (let i = batchStart; i < batchStart + batchSize; i++) {
        batchPromises.push(checkImageExists(`/Hoodieimages/image${i}.webp`));
      }

      // Wait for the entire batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Process results
      for (let i = 0; i < batchResults.length; i++) {
        const currentIndex = batchStart + i;
        if (batchResults[i]) {
          foundImages.push(`/Hoodieimages/image${currentIndex}.webp`);
          highestFound = currentIndex;
          consecutiveFails = 0;
        } else {
          consecutiveFails++;
        }
      }

      batchStart += batchSize;
    }
    
    setImageUrls(foundImages);
    setImageCount(foundImages.length);
    setIsLoading(false);
  };

  useEffect(() => {
    findAvailableImages();
    
    // // Optional: Refresh the gallery periodically
    // const interval = setInterval(findAvailableImages, 30000);
    // return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div style={styles.loading}>Loading images...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>Hoodie Gallery ({imageCount} images)</h1>
      
      {imageCount === 0 ? (
        <p style={styles.error}>No images found in /public/images/ folder</p>
      ) : (
        <div style={styles.gridContainer}>
          {imageUrls.map((url, index) => (
            <div key={url} style={styles.gridItem}>
              <img 
                src={url} 
                alt={`Image ${index + 1}`}
                loading="lazy"
                style={styles.image}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <a href={url} style={styles.imageLink} target="_blank" rel="noopener noreferrer">
                <span style={styles.idText}>Image {index + 1}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Hoodieimage;