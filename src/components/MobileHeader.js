import React from 'react';
import './MobileHeader.css';

const MobileHeader = ({ 
  title,
  subtitle,
  showBack = false,
  onBack,
  showSearch = false,
  onSearch,
  showAction = false,
  actionIcon,
  actionLabel,
  onAction,
  variant = 'default' // 'default', 'landing', 'gradient'
}) => {
  
  return (
    <div className={`mobile-header ${variant}`}>
      <div className="mobile-header-content">
        
        {/* Left Side - Back Button */}
        <div className="mobile-header-left">
          {showBack && (
            <button 
              className="mobile-header-back"
              onClick={onBack}
              aria-label="Go back"
            >
              ←
            </button>
          )}
        </div>

        {/* Center - Title and Subtitle */}
        <div className="mobile-header-center">
          <h1 className="mobile-header-title">{title}</h1>
          {subtitle && (
            <p className="mobile-header-subtitle">{subtitle}</p>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="mobile-header-right">
          {showSearch && (
            <button 
              className="mobile-header-action"
              onClick={onSearch}
              aria-label="Search"
            >
              🔍
            </button>
          )}
          
          {showAction && (
            <button 
              className="mobile-header-action"
              onClick={onAction}
              aria-label={actionLabel}
            >
              {actionIcon}
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default MobileHeader; 