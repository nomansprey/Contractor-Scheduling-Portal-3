import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

// Configure CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', logger(console.log))

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize database schema
async function initializeSchema() {
  try {
    // Check if users table exists in KV store
    const existingUsers = await kv.get('users');
    if (!existingUsers) {
      // Initialize with default users
      const initialUsers = [
        {
          id: '1',
          username: 'karanmadan',
          name: 'Karan',
          role: 'admin'
        },
        {
          id: '2',
          username: 'kunalmadan', 
          name: 'Kunal',
          role: 'admin'
        },
        {
          id: '3',
          username: 'ivan123',
          name: 'Ivan',
          role: 'contractor',
          specialties: ['General Contractor']
        },
        {
          id: '4',
          username: 'mike123',
          name: 'Mike',
          role: 'contractor',
          specialties: ['General Contractor']
        }
      ];
      
      const initialJobs = [
        {
          id: '1',
          title: 'Master Bathroom Renovation',
          clientName: 'Jennifer Davis',
          clientAddress: '123 Oak Street, Springfield',
          startDate: '2024-01-15',
          endDate: '2024-01-22',
          assignedCrew: ['3', '4'],
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
      
      const initialCommunications = [
        {
          id: '1',
          jobId: '1',
          contractorId: '3',
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

      // Store passwords separately 
      const passwords = {
        'karanmadan': 'karan123',
        'kunalmadan': 'kunal123',
        'ivan123': 'ivan123',
        'mike123': 'mike123'
      };

      await kv.set('users', initialUsers);
      await kv.set('jobs', initialJobs);
      await kv.set('communications', initialCommunications);
      await kv.set('passwords', passwords);

      console.log('Database initialized with default data');
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
}

// Initialize on startup
await initializeSchema();

// Authentication Routes
app.post('/make-server-b8a529f8/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    const users = await kv.get('users') || [];
    const passwords = await kv.get('passwords') || {};
    
    const user = users.find((u: any) => u.username === username);
    
    if (user && passwords[username] === password) {
      // Create session token (simplified for demo)
      const sessionToken = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
      
      return c.json({ 
        success: true, 
        user: user,
        sessionToken: sessionToken
      });
    } else {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

app.post('/make-server-b8a529f8/auth/logout', async (c) => {
  return c.json({ success: true });
});

// Helper function to validate session
async function validateSession(sessionToken: string) {
  try {
    if (!sessionToken) return null;
    const decoded = JSON.parse(atob(sessionToken));
    const users = await kv.get('users') || [];
    return users.find((u: any) => u.id === decoded.userId);
  } catch {
    return null;
  }
}

// Data Routes
app.get('/make-server-b8a529f8/users', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const users = await kv.get('users') || [];
    return c.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.post('/make-server-b8a529f8/users', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await c.req.json();
    const users = await kv.get('users') || [];
    const passwords = await kv.get('passwords') || {};
    
    const newUser = {
      ...userData,
      id: Date.now().toString()
    };
    
    const updatedUsers = [...users, newUser];
    await kv.set('users', updatedUsers);
    
    // Set default password
    passwords[userData.username] = userData.username + '123';
    await kv.set('passwords', passwords);

    return c.json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.put('/make-server-b8a529f8/users/:id', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const userData = await c.req.json();
    const users = await kv.get('users') || [];
    
    const updatedUsers = users.map((user: any) => 
      user.id === userId ? { ...user, ...userData } : user
    );
    
    await kv.set('users', updatedUsers);
    
    const updatedUser = updatedUsers.find((u: any) => u.id === userId);
    return c.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

app.delete('/make-server-b8a529f8/users/:id', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('id');
    const users = await kv.get('users') || [];
    
    const updatedUsers = users.filter((user: any) => user.id !== userId);
    await kv.set('users', updatedUsers);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

app.get('/make-server-b8a529f8/jobs', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobs = await kv.get('jobs') || [];
    
    // If contractor, filter to only assigned jobs
    if (currentUser.role === 'contractor') {
      const filteredJobs = jobs.filter((job: any) => 
        job.assignedCrew.includes(currentUser.id)
      );
      return c.json(filteredJobs);
    }
    
    return c.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    return c.json({ error: 'Failed to fetch jobs' }, 500);
  }
});

app.post('/make-server-b8a529f8/jobs', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobData = await c.req.json();
    const jobs = await kv.get('jobs') || [];
    
    const newJob = {
      ...jobData,
      id: Date.now().toString()
    };
    
    const updatedJobs = [...jobs, newJob];
    await kv.set('jobs', updatedJobs);

    return c.json(newJob);
  } catch (error) {
    console.error('Create job error:', error);
    return c.json({ error: 'Failed to create job' }, 500);
  }
});

app.put('/make-server-b8a529f8/jobs/:id', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    const jobData = await c.req.json();
    const jobs = await kv.get('jobs') || [];
    
    // Check if contractor is trying to update job they're not assigned to
    if (currentUser.role === 'contractor') {
      const job = jobs.find((j: any) => j.id === jobId);
      if (!job || !job.assignedCrew.includes(currentUser.id)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }
    
    const updatedJobs = jobs.map((job: any) => 
      job.id === jobId ? { ...job, ...jobData } : job
    );
    
    await kv.set('jobs', updatedJobs);
    
    const updatedJob = updatedJobs.find((j: any) => j.id === jobId);
    return c.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    return c.json({ error: 'Failed to update job' }, 500);
  }
});

app.delete('/make-server-b8a529f8/jobs/:id', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    const jobs = await kv.get('jobs') || [];
    
    const updatedJobs = jobs.filter((job: any) => job.id !== jobId);
    await kv.set('jobs', updatedJobs);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return c.json({ error: 'Failed to delete job' }, 500);
  }
});

app.get('/make-server-b8a529f8/communications', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const communications = await kv.get('communications') || [];
    
    // If contractor, filter to only their communications
    if (currentUser.role === 'contractor') {
      const filteredComms = communications.filter((comm: any) => 
        comm.contractorId === currentUser.id
      );
      return c.json(filteredComms);
    }
    
    return c.json(communications);
  } catch (error) {
    console.error('Get communications error:', error);
    return c.json({ error: 'Failed to fetch communications' }, 500);
  }
});

app.post('/make-server-b8a529f8/communications', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const commData = await c.req.json();
    const communications = await kv.get('communications') || [];
    
    const newCommunication = {
      ...commData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedCommunications = [...communications, newCommunication];
    await kv.set('communications', updatedCommunications);

    return c.json(newCommunication);
  } catch (error) {
    console.error('Create communication error:', error);
    return c.json({ error: 'Failed to create communication' }, 500);
  }
});

app.put('/make-server-b8a529f8/communications/:id/resolve', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const commId = c.req.param('id');
    const { adminResponse } = await c.req.json();
    const communications = await kv.get('communications') || [];
    
    const updatedCommunications = communications.map((comm: any) => 
      comm.id === commId ? { 
        ...comm, 
        status: 'resolved', 
        adminResponse,
        resolvedAt: new Date().toISOString()
      } : comm
    );
    
    await kv.set('communications', updatedCommunications);
    
    const updatedComm = updatedCommunications.find((c: any) => c.id === commId);
    return c.json(updatedComm);
  } catch (error) {
    console.error('Resolve communication error:', error);
    return c.json({ error: 'Failed to resolve communication' }, 500);
  }
});

// Health check
app.get('/make-server-b8a529f8/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

Deno.serve(app.fetch);