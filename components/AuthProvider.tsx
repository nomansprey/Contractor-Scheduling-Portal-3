import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'contractor';
  specialties?: string[];
}

export interface Job {
  id: string;
  title: string;
  clientName: string;
  clientAddress: string;
  startDate: string;
  endDate: string;
  assignedCrew: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  reminders: Reminder[];
  projectType: 'bathroom' | 'kitchen' | 'other';
}

export interface Reminder {
  id: string;
  date: string;
  message: string;
  type: 'general' | 'material_delivery' | 'inspection' | 'client_meeting';
}

export interface Communication {
  id: string;
  jobId: string;
  contractorId: string;
  type: 'material_request' | 'change_order' | 'issue_report' | 'question' | 'other';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  adminResponse?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  jobs: Job[];
  communications: Communication[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addJob: (job: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addCommunication: (communication: Omit<Communication, 'id' | 'createdAt'>) => Promise<void>;
  resolveCommunication: (id: string, adminResponse: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get auth headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken || publicAnonKey}`,
  });

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  };

  // Load initial data and restore session
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check for existing session
        const savedToken = localStorage.getItem('contractor_session_token');
        const savedUser = localStorage.getItem('contractor_current_user');

        if (savedToken && savedUser) {
          setSessionToken(savedToken);
          setUser(JSON.parse(savedUser));
          await refreshData();
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        // Clear invalid session
        localStorage.removeItem('contractor_session_token');
        localStorage.removeItem('contractor_current_user');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const refreshData = async (token?: string) => {
    const currentToken = token || sessionToken;
    if (!currentToken) return;

    try {
      console.log('Refreshing data with session token:', currentToken ? 'present' : 'missing');
      
      // Create API call helper with specific token
      const apiCallWithToken = async (endpoint: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.json();
      };
      
      // Fetch all data in parallel
      const [usersData, jobsData, communicationsData] = await Promise.all([
        apiCallWithToken('/users').then(data => {
          console.log('Users data received:', data);
          return data;
        }),
        apiCallWithToken('/jobs').then(data => {
          console.log('Jobs data received:', data);
          return data;
        }),
        apiCallWithToken('/communications').then(data => {
          console.log('Communications data received:', data);
          return data;
        })
      ]);

      setUsers(usersData);
      setJobs(jobsData);
      setCommunications(communicationsData);
      
      console.log('Data refresh complete:', {
        users: usersData?.length || 0,
        jobs: jobsData?.length || 0,
        communications: communicationsData?.length || 0
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      // If unauthorized, clear session
      if (error instanceof Error && error.message.includes('401')) {
        logout();
      }
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { username, password: '***' });
      console.log('Making login request to:', `${API_BASE}/auth/login`);
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login HTTP error:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      let data;
      let responseText;
      try {
        // Get the response text first so we can debug if needed
        responseText = await response.text();
        console.log('Raw login response text:', responseText);
        
        // Then parse it as JSON
        data = JSON.parse(responseText);
        console.log('Login response parsed successfully');
        console.log('Login response data:', { 
          success: data.success, 
          user: data.user?.username,
          sessionToken: data.sessionToken ? 'present' : 'missing',
          fullData: data 
        });
      } catch (jsonError) {
        console.error('Failed to parse login response as JSON:', jsonError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid response format from server');
      }

      if (data.success) {
        setUser(data.user);
        setSessionToken(data.sessionToken);
        
        // Save to localStorage
        localStorage.setItem('contractor_session_token', data.sessionToken);
        localStorage.setItem('contractor_current_user', JSON.stringify(data.user));
        
        // Load data after successful login with the new session token
        console.log('About to call refreshData with token:', data.sessionToken ? 'present' : 'missing');
        await refreshData(data.sessionToken);
        return true;
      } else {
        console.error('Login failed:', data.error);
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await apiCall('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionToken(null);
      setUsers([]);
      setJobs([]);
      setCommunications([]);
      
      // Clear localStorage
      localStorage.removeItem('contractor_session_token');
      localStorage.removeItem('contractor_current_user');
    }
  };

  const addJob = async (jobData: Omit<Job, 'id'>) => {
    try {
      const newJob = await apiCall('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      setJobs(prev => [...prev, newJob]);
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    try {
      const updatedJob = await apiCall(`/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      });
      setJobs(prev => prev.map(job => 
        job.id === id ? updatedJob : job
      ));
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await apiCall(`/jobs/${id}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = await apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiCall(`/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const addCommunication = async (communicationData: Omit<Communication, 'id' | 'createdAt'>) => {
    try {
      const newCommunication = await apiCall('/communications', {
        method: 'POST',
        body: JSON.stringify(communicationData),
      });
      setCommunications(prev => [...prev, newCommunication]);
    } catch (error) {
      console.error('Error adding communication:', error);
      throw error;
    }
  };

  const resolveCommunication = async (id: string, adminResponse: string) => {
    try {
      const updatedCommunication = await apiCall(`/communications/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ adminResponse }),
      });
      setCommunications(prev => prev.map(comm => 
        comm.id === id ? updatedCommunication : comm
      ));
    } catch (error) {
      console.error('Error resolving communication:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contractor scheduling system...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      users,
      jobs,
      communications,
      login,
      logout,
      addJob,
      updateJob,
      deleteJob,
      addUser,
      updateUser,
      deleteUser,
      addCommunication,
      resolveCommunication,
      refreshData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
