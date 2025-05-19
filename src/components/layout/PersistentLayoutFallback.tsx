import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * A fallback persistent layout component that doesn't use framer-motion
 * This is used if framer-motion is not available
 */
const PersistentLayoutFallback: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle location changes for transitions
  useEffect(() => {
    if (prevLocation.pathname !== location.pathname) {
      // Start transition
      setIsTransitioning(true);
      
      // After a short delay, update the location and end transition
      const timeout = setTimeout(() => {
        setPrevLocation(location);
        setIsTransitioning(false);
      }, 150); // This should match the CSS transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [location, prevLocation]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div
            key={location.pathname}
            className={`transition-opacity duration-150 ease-in-out ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ 
              transform: 'translateZ(0)', // Force hardware acceleration
              willChange: 'opacity', // Hint to browser for optimization
              backfaceVisibility: 'hidden' // Prevent flickering in some browsers
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PersistentLayoutFallback;
