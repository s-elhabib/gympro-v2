import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * A component that provides smooth transitions between pages
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      
      // Wait for the fade out animation to complete before updating the location
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 150); // This should match the CSS transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={cn(
        'transition-opacity duration-150 ease-in-out',
        transitionStage === 'fadeIn' ? 'opacity-100' : 'opacity-0'
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
