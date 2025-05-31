import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null, 
  onLoad = () => {}, 
  onError = () => {},
  onClick = () => {},
  threshold = 0.1 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    return (
      <div className={`lazy-image-placeholder ${className}`}>
        <div className="placeholder-content">
          <div className="placeholder-icon">🖼️</div>
          <div className="placeholder-text">Loading image...</div>
        </div>
      </div>
    );
  };

  const renderErrorState = () => (
    <div className={`lazy-image-error ${className}`}>
      <div className="error-content">
        <div className="error-icon">❌</div>
        <div className="error-text">Failed to load image</div>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className="lazy-image-container">
      {hasError ? (
        renderErrorState()
      ) : !isInView ? (
        renderPlaceholder()
      ) : (
        <>
          {!isLoaded && renderPlaceholder()}
          <img
            src={src}
            alt={alt}
            className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            style={{ 
              display: isLoaded ? 'block' : 'none',
              cursor: onClick ? 'pointer' : 'default'
            }}
          />
        </>
      )}
    </div>
  );
};

export default LazyImage; 