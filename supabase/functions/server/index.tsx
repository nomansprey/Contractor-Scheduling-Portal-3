import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// KV store helper functions
async function kvGet(key: string) {
  try {
    const { data } = await supabase
      .from('kv_store_b8a529f8')
      .select('value')
      .eq('key', key)
      .single();
    return data ? JSON.parse(data.value) : null;
  } catch (error) {
    return null;
  }
}

async function kvSet(key: string, value: any) {
  await supabase
    .from('kv_store_b8a529f8')
    .upsert({ key, value: JSON.stringify(value) });
}

// Health check FIRST
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/make-server-b8a529f8/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database schema
async function initializeSchema() {
  try {
    const existingUsers = await kvGet('users');
    
    if (!existingUsers) {
      const initialUsers = [
        {
          id: '1',
          username: 'karanmadan',
          name: 'Karan',
          role: 'admin'
        },
        {
          id: '3',
          username: 'ivan123',
          name: 'Ivan',
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
          assignedCrew: ['3'],
          status: 'scheduled',
          notes: 'Complete gut renovation. Client wants luxury finishes.',
          reminders: [],
          projectType: 'bathroom'
        }
      ];
      
      const initialCommunications: any[] = [];

      const passwords = {
        'karanmadan': 'karan123',
        'ivan123': 'ivan123'
      };

      await kvSet('users', initialUsers);
      await kvSet('jobs', initialJobs);
      await kvSet('communications', initialCommunications);
      await kvSet('passwords', passwords);

      console.log('Database initialized!');
    }
  } catch (error) {
    console.error('Init error:', error);
  }
}

async function validateSession(sessionToken: string) {
  try {
    if (!sessionToken) return null;
    const decoded = JSON.parse(atob(sessionToken));
    const users = await kvGet('users') || [];
    return users.find((u: any) => u.id === decoded.userId);
  } catch {
    return null;
  }
}

app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    const users = await kvGet('users') || [];
    const passwords = await kvGet('passwords') || {};
    
    const user = users.find((u: any) => u.username === username);
    
    if (user && passwords[username] === password) {
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

app.post('/auth/logout', async (c) => {
  return c.json({ success: true });
});

app.get('/users', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const users = await kvGet('users') || [];
    return c.json(users);
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.get('/jobs', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobs = await kvGet('jobs') || [];
    
    if (currentUser.role === 'contractor') {
      const filteredJobs = jobs.filter((job: any) => 
        job.assignedCrew.includes(currentUser.id)
      );
      return c.json(filteredJobs);
    }
    
    return c.json(jobs);
  } catch (error) {
    return c.json({ error: 'Failed to fetch jobs' }, 500);
  }
});

app.get('/communications', async (c) => {
  try {
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const currentUser = await validateSession(sessionToken);
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const communications = await kvGet('communications') || [];
    
    if (currentUser.role === 'contractor') {
      const filteredComms = communications.filter((comm: any) => 
        comm.contractorId === currentUser.id
      );
      return c.json(filteredComms);
    }
    
    return c.json(communications);
  } catch (error) {
    return c.json({ error: 'Failed to fetch communications' }, 500);
  }
});

// Initialize after routes are defined
initializeSchema();

Deno.serve(app.fetch);
