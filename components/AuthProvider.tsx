import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addJob: (job: Omit<Job, 'id'>) => void;
  updateJob: (id: string, job: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addCommunication: (communication: Omit<Communication, 'id' | 'createdAt'>) => void;
  resolveCommunication: (id: string, adminResponse: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock data for demonstration
const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'John Smith',
    role: 'admin'
  },
  {
    id: '2',
    username: 'mike_plumber',
    name: 'Mike Johnson',
    role: 'contractor',
    specialties: ['Plumbing', 'Fixture Installation']
  },
  {
    id: '3',
    username: 'sarah_tile',
    name: 'Sarah Wilson',
    role: 'contractor',
    specialties: ['Tile Work', 'Flooring']
  },
  {
    id: '4',
    username: 'tom_electric',
    name: 'Tom Brown',
    role: 'contractor',
    specialties: ['Electrical', 'Lighting']
  }
];

const initialJobs: Job[] = [
  {
    id: '1',
    title: 'Master Bathroom Renovation',
    clientName: 'Jennifer Davis',
    clientAddress: '123 Oak Street, Springfield',
    startDate: '2024-01-15',
    endDate: '2024-01-22',
    assignedCrew: ['2', '3'],
    status: 'scheduled',
    notes: 'Complete gut renovation. Client wants luxury finishes.',
    reminders: [
      {
        id: '1',
        date: '2024-01-14',
        message: 'Confirm tile delivery',
        type: 'material_delivery'
      }
    ],
    projectType: 'bathroom'
  },
  {
    id: '2',
    title: 'Kitchen Cabinet Installation',
    clientName: 'Robert Martinez',
    clientAddress: '456 Pine Avenue, Springfield',
    startDate: '2024-01-20',
    endDate: '2024-01-25',
    assignedCrew: ['4'],
    status: 'in_progress',
    notes: 'Custom cabinets delivered. Need electrical for under-cabinet lighting.',
    reminders: [],
    projectType: 'kitchen'
  }
];

const initialCommunications: Communication[] = [
  {
    id: '1',
    jobId: '1',
    contractorId: '2',
    type: 'material_request',
    subject: 'Additional Tile Needed',
    message: 'We need 3 more boxes of the subway tile for the shower area. Found some damage in the existing tiles.',
    priority: 'medium',
    status: 'pending',
    createdAt: '2024-01-12T10:30:00Z'
  },
  {
    id: '2',
    jobId: '2',
    contractorId: '4',
    type: 'change_order',
    subject: 'Under-Cabinet Lighting Upgrade',
    message: 'Client wants to upgrade to LED strip lighting instead of puck lights. Will need approval for additional $200.',
    priority: 'high',
    status: 'resolved',
    createdAt: '2024-01-18T14:15:00Z',
    resolvedAt: '2024-01-18T16:00:00Z',
    adminResponse: 'Approved. Client confirmed via phone. Proceed with LED strips.'
  }
];

// Mock passwords for demonstration (in real app, use proper auth)
const mockPasswords: Record<string, string> = {
  'admin': 'admin123',
  'mike_plumber': 'mike123',
  'sarah_tile': 'sarah123',
  'tom_electric': 'tom123'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);

  useEffect(() => {
    // Load data from localStorage or use initial data
    const savedUsers = localStorage.getItem('contractor_users');
    const savedJobs = localStorage.getItem('contractor_jobs');
    const savedCommunications = localStorage.getItem('contractor_communications');
    const savedUser = localStorage.getItem('contractor_current_user');

    setUsers(savedUsers ? JSON.parse(savedUsers) : initialUsers);
    setJobs(savedJobs ? JSON.parse(savedJobs) : initialJobs);
    setCommunications(savedCommunications ? JSON.parse(savedCommunications) : initialCommunications);
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const foundUser = (savedUsers ? JSON.parse(savedUsers) : initialUsers).find((u: User) => u.id === parsedUser.id);
      if (foundUser) setUser(foundUser);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('contractor_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('contractor_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('contractor_communications', JSON.stringify(communications));
  }, [communications]);

  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(u => u.username === username);
    if (foundUser && mockPasswords[username] === password) {
      setUser(foundUser);
      localStorage.setItem('contractor_current_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('contractor_current_user');
  };

  const addJob = (jobData: Omit<Job, 'id'>) => {
    const newJob: Job = {
      ...jobData,
      id: Date.now().toString()
    };
    setJobs(prev => [...prev, newJob]);
  };

  const updateJob = (id: string, jobData: Partial<Job>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...jobData } : job
    ));
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString()
    };
    setUsers(prev => [...prev, newUser]);
    
    // Add default password for new contractors (in real app, generate random password and email it)
    mockPasswords[userData.username] = userData.username + '123';
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const addCommunication = (communicationData: Omit<Communication, 'id' | 'createdAt'>) => {
    const newCommunication: Communication = {
      ...communicationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setCommunications(prev => [...prev, newCommunication]);
  };

  const resolveCommunication = (id: string, adminResponse: string) => {
    setCommunications(prev => prev.map(comm => 
      comm.id === id ? { 
        ...comm, 
        status: 'resolved' as const, 
        adminResponse,
        resolvedAt: new Date().toISOString()
      } : comm
    ));
  };

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
      resolveCommunication
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
