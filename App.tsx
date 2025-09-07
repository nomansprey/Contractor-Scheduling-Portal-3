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
    return (
      <div className="min-h-screen bg-background">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
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
