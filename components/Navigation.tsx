import React from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogOut, Shield, User, Calendar, Briefcase } from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Contractor Scheduler
            </h1>
          </div>
          
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {user.role === 'admin' ? 'Admin' : 'Contractor'}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}