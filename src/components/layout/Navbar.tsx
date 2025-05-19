import React from 'react';
import { Bell, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types/auth';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { format } from 'date-fns';

// Function to get a user-friendly role label
const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'manager':
      return 'Manager';
    case 'trainer':
      return 'Entraîneur';
    case 'receptionist':
      return 'Réceptionniste';
    case 'staff':
      return 'Personnel';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 ml-12 md:ml-0">
          <span className="text-lg font-semibold truncate max-w-[200px]">
            Welcome, {user?.name || 'Guest'}
          </span>
          <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hidden sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            <span>
              {user?.role ? getRoleLabel(user.role) : 'Guest'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] md:w-[320px]">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-4 px-2 text-center text-sm text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{notification.title}</span>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <span className="text-xs text-gray-400 mt-2">
                      {format(notification.createdAt, 'MMM d, h:mm a')}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <div className="px-2 py-1.5 text-xs flex items-center">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-blue-600" />
                <span className="text-gray-600">
                  Rôle: {user?.role ? getRoleLabel(user.role) : 'Guest'}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;