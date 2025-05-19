import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  CreditCard,
  Calendar,
  UserCog,
  BarChart3,
  Settings,
  Dumbbell,
  Menu,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRBAC, Permission } from "../../context/RBACContext";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { supabase } from "../../lib/supabase";

const Sidebar = () => {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [checkoutCount, setCheckoutCount] = useState(0);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      permission: "dashboard:view" as Permission,
    },
    {
      icon: Users,
      label: "Membres",
      path: "/members",
      permission: "members:view" as Permission,
    },
    {
      icon: CreditCard,
      label: "Paiements",
      path: "/payments",
      permission: "payments:view" as Permission,
    },
    {
      icon: Calendar,
      label: "Presence",
      path: "/attendance",
      permission: "attendance:view" as Permission,
      notificationCount: checkoutCount, // Using the real count from state
    },
    {
      icon: Dumbbell,
      label: "Cours",
      path: "/classes",
      permission: "classes:view" as Permission,
    },
    {
      icon: UserCog,
      label: "Personnel",
      path: "/staff",
      permission: "staff:view" as Permission,
    },
    {
      icon: BarChart3,
      label: "Rapports & Analyses",
      path: "/reports",
      permission: "reports:view" as Permission,
    },
    {
      icon: Settings,
      label: "Parametres",
      path: "/settings",
      permission: "settings:view" as Permission,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    hasPermission(item.permission)
  );

  useEffect(() => {
    const fetchOverdueCheckouts = async () => {
      try {
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .is("check_out_time", null) // Not checked out
          .lt("check_in_time", fiveHoursAgo.toISOString()); // Check-in time more than 5 hours ago

        if (error) {
          console.error("Error fetching overdue checkouts:", error);
          return;
        }

        setCheckoutCount(data?.length || 0);
      } catch (error) {
        console.error("Error in fetchOverdueCheckouts:", error);
      }
    };

    fetchOverdueCheckouts();
    const interval = setInterval(fetchOverdueCheckouts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle mobile menu close when route changes
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-gray-300 hover:text-white transition-colors duration-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:sticky top-0 left-0 h-[100dvh] bg-gray-900 text-white transition-all duration-300 z-40",
          collapsed ? "w-16" : "w-64",
          "md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4">
          {!collapsed && <h1 className="text-xl font-bold">Gym Manager</h1>}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </Button>
        </div>
        <nav className="space-y-1 px-2">
          {filteredMenuItems.map((item) => {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg relative",
                  "transition-all duration-200 ease-in-out",
                  "text-gray-300 hover:text-white", // Subtle hover effect without background change
                  collapsed && "justify-center"
                )}
                style={{
                  transform: 'translateZ(0)', // Force hardware acceleration
                  willChange: 'color', // Hint to browser for optimization (only color changes now)
                  backfaceVisibility: 'hidden' // Prevent flickering in some browsers
                }}
                preventScrollReset={true} // Prevent scroll reset on navigation
                replace={true} // Use replace instead of push to avoid browser history buildup
              >
                <div className="relative">
                  <item.icon size={20} />
                  {item.notificationCount > 0 && (
                    <span
                      className={cn(
                        "absolute -top-2 -right-2 min-w-[20px] h-5 px-1",
                        "flex items-center justify-center",
                        "rounded-full text-xs font-medium",
                        "bg-red-500 text-white",
                        "border-2 border-gray-900",
                        collapsed ? "-right-1" : "-right-2"
                      )}
                    >
                      {item.notificationCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
