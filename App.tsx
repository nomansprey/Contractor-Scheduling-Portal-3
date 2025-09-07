import React from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { LoginForm } from './components/LoginForm';
import { AdminDashboard } from './components/AdminDashboard';
import { ContractorDashboard } from './components/ContractorDashboard';
import { Navigation } from './components/Navigation';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
        {user.role === 'admin' ? <AdminDashboard /> : <ContractorDashboard />}
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}