import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fyngvoojdfjexbzasgiz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmd2b29qZGZqZXhiemFzZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTM3MTAsImV4cCI6MjA2OTQ4OTcxMH0.0v2M2L2K1EbSXh6gx1ywdz8q7TxaNqW3fq3-fRx1mh0';

// Check if we have real Supabase credentials
const hasSupabaseCredentials = supabaseUrl !== 'https://demo.supabase.co' && supabaseAnonKey !== 'demo-key-placeholder';

if (!hasSupabaseCredentials) {
  console.warn('Using fallback Supabase credentials. Ensure environment variables are set for production.');
} else {
  console.log('✅ Connected to AirPlus production Supabase:', supabaseUrl);
}

// Only create real Supabase client if we have credentials
export const supabase = hasSupabaseCredentials
  ? createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'aviation-ops'
        }
      }
    })
  : null;

// Types for our database schema
export interface Aircraft {
  id: string;
  registration: string;
  model: string;
  manufacturer: string;
  status: 'active' | 'maintenance' | 'inactive';
  last_inspection: string;
  flight_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  certifications: string[];
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  aircraft_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface FlightSheet {
  id: string;
  flight_number: string;
  aircraft_id: string;
  pilot_id: string;
  copilot_id?: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time?: string;
  flight_hours: number;
  fuel_consumption: number;
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Demo user for when Supabase is not configured
const demoUser = {
  id: 'demo-user',
  email: 'demo@aviation.com',
  user_metadata: {
    name: 'João Silva (Demo)',
    role: 'Gestor de Operações'
  }
};

const demoSession = {
  user: demoUser,
  access_token: 'demo-token',
  refresh_token: 'demo-refresh'
};

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      // Demo mode - simulate successful signup
      return { data: { user: null, session: null }, error: null };
    }
    return await supabase.auth.signUp({ email, password });
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      // Demo mode - simulate successful login
      return { data: { user: demoUser, session: demoSession }, error: null };
    }
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    if (!supabase) {
      // Demo mode - simulate successful logout
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  getSession: async () => {
    if (!supabase) {
      // Demo mode - return demo session
      return { data: { session: demoSession }, error: null };
    }
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      // Demo mode - simulate auth state change
      setTimeout(() => callback('SIGNED_IN', demoSession), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Demo data for when Supabase is not configured
const demoAircraft: Aircraft[] = [
  { id: '1', registration: 'PT-ABC', model: 'Cessna 172', manufacturer: 'Cessna', status: 'active', last_inspection: '2024-01-15', flight_hours: 1250, created_at: '2024-01-01', updated_at: '2024-01-15' },
  { id: '2', registration: 'PT-XYZ', model: 'Piper Cherokee', manufacturer: 'Piper', status: 'maintenance', last_inspection: '2024-01-10', flight_hours: 890, created_at: '2024-01-01', updated_at: '2024-01-10' }
];

const demoEmployees: Employee[] = [
  { id: '1', name: 'Maria Santos', email: 'maria@aviation.com', role: 'Piloto Comercial', certifications: ['ANAC', 'IFR'], hire_date: '2023-06-01', status: 'active', created_at: '2023-06-01', updated_at: '2024-01-01' },
  { id: '2', name: 'Carlos Lima', email: 'carlos@aviation.com', role: 'Mecânico', certifications: ['ANAC Manutenção'], hire_date: '2023-08-15', status: 'active', created_at: '2023-08-15', updated_at: '2024-01-01' }
];

// Database helper functions
export const db = {
  // Aircraft operations
  getAircraft: async () => {
    if (!supabase) {
      return { data: demoAircraft, error: null };
    }
    return await supabase.from('aircraft').select('*').order('registration');
  },

  createAircraft: async (aircraft: Omit<Aircraft, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) {
      const newAircraft = { ...aircraft, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { data: newAircraft, error: null };
    }
    return await supabase.from('aircraft').insert(aircraft).select().single();
  },

  updateAircraft: async (id: string, updates: Partial<Aircraft>) => {
    if (!supabase) {
      return { data: { ...updates, id, updated_at: new Date().toISOString() }, error: null };
    }
    return await supabase.from('aircraft').update(updates).eq('id', id).select().single();
  },

  // Employee operations
  getEmployees: async () => {
    if (!supabase) {
      return { data: demoEmployees, error: null };
    }
    return await supabase.from('employees').select('*').order('name');
  },

  createEmployee: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) {
      const newEmployee = { ...employee, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { data: newEmployee, error: null };
    }
    return await supabase.from('employees').insert(employee).select().single();
  },

  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    if (!supabase) {
      return { data: { ...updates, id, updated_at: new Date().toISOString() }, error: null };
    }
    return await supabase.from('employees').update(updates).eq('id', id).select().single();
  },

  // Task operations
  getTasks: async () => {
    if (!supabase) {
      const demoTasks = [
        { id: '1', title: 'Inspeção 100h PT-ABC', description: 'Inspeção programada de 100 horas', assigned_to: '2', aircraft_id: '1', priority: 'high' as const, status: 'pending' as const, due_date: '2024-02-01', created_at: '2024-01-15', updated_at: '2024-01-15' }
      ];
      return { data: demoTasks, error: null };
    }
    return await supabase.from('tasks').select(`
      *,
      assigned_employee:employees(name),
      aircraft:aircraft(registration)
    `).order('created_at', { ascending: false });
  },

  createTask: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) {
      const newTask = { ...task, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { data: newTask, error: null };
    }
    return await supabase.from('tasks').insert(task).select().single();
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    if (!supabase) {
      return { data: { ...updates, id, updated_at: new Date().toISOString() }, error: null };
    }
    return await supabase.from('tasks').update(updates).eq('id', id).select().single();
  },

  // Flight sheet operations
  getFlightSheets: async () => {
    if (!supabase) {
      const demoSheets = [
        { id: '1', flight_number: 'AO001', aircraft_id: '1', pilot_id: '1', departure_airport: 'SBSP', arrival_airport: 'SBRJ', departure_time: '2024-01-20T08:00:00Z', flight_hours: 1.5, fuel_consumption: 45, status: 'completed' as const, created_at: '2024-01-20', updated_at: '2024-01-20' }
      ];
      return { data: demoSheets, error: null };
    }
    return await supabase.from('flight_sheets').select(`
      *,
      aircraft:aircraft(registration, model),
      pilot:employees!pilot_id(name),
      copilot:employees!copilot_id(name)
    `).order('departure_time', { ascending: false });
  },

  createFlightSheet: async (sheet: Omit<FlightSheet, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) {
      const newSheet = { ...sheet, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { data: newSheet, error: null };
    }
    return await supabase.from('flight_sheets').insert(sheet).select().single();
  },

  updateFlightSheet: async (id: string, updates: Partial<FlightSheet>) => {
    if (!supabase) {
      return { data: { ...updates, id, updated_at: new Date().toISOString() }, error: null };
    }
    return await supabase.from('flight_sheets').update(updates).eq('id', id).select().single();
  }
};
