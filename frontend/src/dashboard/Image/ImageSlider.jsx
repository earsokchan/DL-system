// ImageSlider.jsx
import React from 'react';
import Shopimage from './shop.jsx';
import Hoodieimage from './hoodieimage.jsx';
import Teesimage from './teesimage.jsx';
import Pantsimage from './pantsimage.jsx';
import ImageUpload from './image.jsx';
import Bannerimage from './bannerimage.jsx';
import { useState } from 'react';
import './sliderstyle/slider.css'; // Assuming you have a CSS file for styling

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { component: <ImageUpload />, title: "Main Image" },
    { component: <Shopimage />, title: "Shop Image" },
    { component: <Hoodieimage />, title: "Hoodie Image" },
    { component: <Teesimage />, title: "Tees Image" },
    { component: <Pantsimage />, title: "Pants Image" },
    { component: <Bannerimage />, title: "Banner Image" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="image-slider-container">
      <h2>{slides[currentSlide].title}</h2>
      <div className="slider-controls">
        <button onClick={prevSlide}>Previous</button>
        <button onClick={nextSlide}>Next</button>
      </div>
      <div className="slide">
        {slides[currentSlide].component}
      </div>
    </div>
  );
};

export default ImageSlider;