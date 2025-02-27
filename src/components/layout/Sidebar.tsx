import React from 'react';
import { NavLink } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const Sidebar = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'staff', 'manager'] },
    { icon: Users, label: 'Members', path: '/members', roles: ['admin', 'staff', 'manager'] },
    { icon: CreditCard, label: 'Payments', path: '/payments', roles: ['admin', 'staff', 'manager'] },
    { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['admin', 'staff', 'trainer'] },
    { icon: Dumbbell, label: 'Classes', path: '/classes', roles: ['admin', 'trainer', 'manager'] },
    { icon: UserCog, label: 'Staff', path: '/staff', roles: ['admin', 'manager'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'manager'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white"
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
      <div className={cn(
        "fixed md:sticky top-0 left-0 h-[100dvh] bg-gray-900 text-white transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
        "md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4">
          {!collapsed && <h1 className="text-xl font-bold">Gym Manager</h1>}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800 hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </Button>
        </div>
        <nav className="space-y-1 px-2">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800",
                  collapsed && "justify-center"
                )
              }
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;