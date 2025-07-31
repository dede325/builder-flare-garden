import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using demo mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
});

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

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions
export const db = {
  // Aircraft operations
  getAircraft: async () => {
    return await supabase.from('aircraft').select('*').order('registration');
  },
  
  createAircraft: async (aircraft: Omit<Aircraft, 'id' | 'created_at' | 'updated_at'>) => {
    return await supabase.from('aircraft').insert(aircraft).select().single();
  },
  
  updateAircraft: async (id: string, updates: Partial<Aircraft>) => {
    return await supabase.from('aircraft').update(updates).eq('id', id).select().single();
  },
  
  // Employee operations
  getEmployees: async () => {
    return await supabase.from('employees').select('*').order('name');
  },
  
  createEmployee: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    return await supabase.from('employees').insert(employee).select().single();
  },
  
  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    return await supabase.from('employees').update(updates).eq('id', id).select().single();
  },
  
  // Task operations
  getTasks: async () => {
    return await supabase.from('tasks').select(`
      *,
      assigned_employee:employees(name),
      aircraft:aircraft(registration)
    `).order('created_at', { ascending: false });
  },
  
  createTask: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    return await supabase.from('tasks').insert(task).select().single();
  },
  
  updateTask: async (id: string, updates: Partial<Task>) => {
    return await supabase.from('tasks').update(updates).eq('id', id).select().single();
  },
  
  // Flight sheet operations
  getFlightSheets: async () => {
    return await supabase.from('flight_sheets').select(`
      *,
      aircraft:aircraft(registration, model),
      pilot:employees!pilot_id(name),
      copilot:employees!copilot_id(name)
    `).order('departure_time', { ascending: false });
  },
  
  createFlightSheet: async (sheet: Omit<FlightSheet, 'id' | 'created_at' | 'updated_at'>) => {
    return await supabase.from('flight_sheets').insert(sheet).select().single();
  },
  
  updateFlightSheet: async (id: string, updates: Partial<FlightSheet>) => {
    return await supabase.from('flight_sheets').update(updates).eq('id', id).select().single();
  }
};
