import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * A persistent layout component that doesn't remount when routes change
 * Uses framer-motion for smooth transitions between pages
 */
const PersistentLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location);
  const [transitionKey, setTransitionKey] = useState(location.pathname);

  // Update the transition key when the location changes
  useEffect(() => {
    // Only update if the pathname has changed
    if (prevLocation.pathname !== location.pathname) {
      setTransitionKey(location.pathname);
      setPrevLocation(location);
    }
  }, [location, prevLocation]);

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    in: {
      opacity: 1,
    },
    out: {
      opacity: 0,
    }
  };

  // Page transition settings
  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={transitionKey}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default PersistentLayout;
