import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://fyngvoojdfjexbzasgiz.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmd2b29qZGZqZXhiemFzZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTM3MTAsImV4cCI6MjA2OTQ4OTcxMH0.0v2M2L2K1EbSXh6gx1ywdz8q7TxaNqW3fq3-fRx1mh0";

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be configured in environment variables');
}

console.log("✅ Connected to AirPlus production Supabase:", supabaseUrl);

// Create Supabase client for AirPlus production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "airplus-aviation-v1.0",
    },
  },
});

// Types for AirPlus production database schema
export interface Aeronave {
  id: string;
  matricula: string;
  modelo: string;
  fabricante: string;
  proprietario?: string;
  status: "ativa" | "manutencao" | "inativa";
  horas_voo: number;
  ultima_inspecao?: string;
  created_at: string;
  updated_at: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  funcao: string;
  numero_bilhete: string;
  codigo_plano: string;
  telefone: string;
  foto_url?: string;
  email: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  funcionario_id?: string;
  role: "admin" | "supervisor" | "operacional" | "cliente";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Folha {
  id: string;
  codigo: string;
  data: string;
  turno: "manha" | "tarde" | "noite";
  local: string;
  aeronave_id: string;
  tipos_intervencao: string[];
  observacoes?: string;
  supervisor_id?: string;
  cliente_confirmou: boolean;
  assinatura_supervisor?: string;
  assinatura_cliente?: string;
  qr_code_data?: string;
  pdf_url?: string;
  sync_status: "pendente" | "sincronizado" | "erro";
  status: "rascunho" | "em_andamento" | "concluida" | "aprovada";
  version: number;
  change_history: any[];
  created_at: string;
  updated_at: string;
}

export interface FolhaFuncionario {
  id: string;
  folha_id: string;
  funcionario_id: string;
  tarefa: string;
  hora_inicio: string;
  hora_fim: string;
  created_at: string;
}

export interface Foto {
  id: string;
  folha_id: string;
  tipo: "antes" | "depois";
  categoria: "exterior" | "interior" | "detalhes";
  url: string;
  thumbnail_url?: string;
  legenda?: string;
  tamanho_arquivo?: number;
  resolucao?: { width: number; height: number };
  gps_coordinates?: { lat: number; lng: number };
  metadata: any;
  upload_status: "pendente" | "enviando" | "enviado" | "erro";
  created_at: string;
}

// Legacy interfaces for compatibility
export interface Aircraft extends Aeronave {
  registration: string;
  model: string;
  manufacturer: string;
  status: "active" | "maintenance" | "inactive";
  last_inspection: string;
  flight_hours: number;
}

export interface Employee extends Funcionario {
  name: string;
  role: string;
  certifications: string[];
  hire_date: string;
  status: "active" | "inactive";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  aircraft_id?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
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
  status: "planned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Production user for AirPlus
const productionUser = {
  id: "airplus-user",
  email: "operacoes@airplus.co",
  user_metadata: {
    name: "AirPlus User",
    role: "Operacional",
  },
};

const productionSession = {
  user: productionUser,
  access_token: "airplus-token",
  refresh_token: "airplus-refresh",
};

// Auth helper functions for AirPlus production
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company: "AirPlus Aviation",
        },
      },
    });
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
  },

  // AirPlus specific auth functions
  signInWithAirPlusEmail: async (email: string, password: string) => {
    // Validate AirPlus email domain
    if (!email.endsWith("@airplus.co")) {
      return {
        data: { user: null, session: null },
        error: { message: "Email deve ser do domínio @airplus.co" },
      };
    }
    return await supabase.auth.signInWithPassword({ email, password });
  },

  createUserProfile: async (
    userId: string,
    funcionarioId: string,
    role: string = "operacional",
  ) => {
    return await supabase.from("usuarios").insert({
      id: userId,
      funcionario_id: funcionarioId,
      role: role,
      ativo: true,
    });
  },
};



// AirPlus production database helper functions
export const db = {
  // Aeronaves operations
  getAeronaves: async () => {
    return await supabase.from("aeronaves").select("*").order("matricula");
  },

  createAeronave: async (
    aeronave: Omit<Aeronave, "id" | "created_at" | "updated_at">,
  ) => {
    return await supabase.from("aeronaves").insert(aeronave).select().single();
  },

  updateAeronave: async (id: string, updates: Partial<Aeronave>) => {
    return await supabase
      .from("aeronaves")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  },

  // Funcionarios operations
  getFuncionarios: async () => {
    return await supabase
      .from("funcionarios")
      .select("*")
      .eq("ativo", true)
      .order("nome");
  },

  createFuncionario: async (
    funcionario: Omit<Funcionario, "id" | "created_at" | "updated_at">,
  ) => {
    return await supabase
      .from("funcionarios")
      .insert(funcionario)
      .select()
      .single();
  },

  updateFuncionario: async (id: string, updates: Partial<Funcionario>) => {
    return await supabase
      .from("funcionarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  },

  // Folhas operations
  getFolhas: async () => {
    return await supabase
      .from("folhas")
      .select(
        `
        *,
        aeronave:aeronaves(*),
        supervisor:funcionarios!supervisor_id(*),
        folha_funcionarios(
          *,
          funcionario:funcionarios(*)
        ),
        fotos(*)
      `,
      )
      .order("created_at", { ascending: false });
  },

  createFolha: async (
    folha: Omit<Folha, "id" | "created_at" | "updated_at">,
  ) => {
    return await supabase.from("folhas").insert(folha).select().single();
  },

  updateFolha: async (id: string, updates: Partial<Folha>) => {
    return await supabase
      .from("folhas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  },

  // Fotos operations
  createFoto: async (foto: Omit<Foto, "id" | "created_at">) => {
    return await supabase.from("fotos").insert(foto).select().single();
  },

  getFotosByFolha: async (folhaId: string) => {
    return await supabase
      .from("fotos")
      .select("*")
      .eq("folha_id", folhaId)
      .order("created_at");
  },

  // Legacy compatibility functions
  getAircraft: async () => {
    const result = await db.getAeronaves();
    if (result.data) {
      // Transform to legacy format
      const transformedData = result.data.map((aeronave: Aeronave) => ({
        ...aeronave,
        registration: aeronave.matricula,
        model: aeronave.modelo,
        manufacturer: aeronave.fabricante,
        status:
          aeronave.status === "ativa"
            ? "active"
            : aeronave.status === "manutencao"
              ? "maintenance"
              : "inactive",
        last_inspection: aeronave.ultima_inspecao || "",
        flight_hours: aeronave.horas_voo,
      }));
      return { data: transformedData, error: result.error };
    }
    return result;
  },

  getEmployees: async () => {
    const result = await db.getFuncionarios();
    if (result.data) {
      // Transform to legacy format
      const transformedData = result.data.map((funcionario: Funcionario) => ({
        ...funcionario,
        name: funcionario.nome,
        role: funcionario.funcao,
        certifications: [],
        hire_date: funcionario.created_at.split("T")[0],
        status: funcionario.ativo ? "active" : "inactive",
      }));
      return { data: transformedData, error: result.error };
    }
    return result;
  },

  // Task operations
  getTasks: async () => {
    return await supabase
      .from("tasks")
      .select(
        `
      *,
      assigned_employee:employees(name),
      aircraft:aircraft(registration)
    `,
      )
      .order("created_at", { ascending: false });
  },

  createTask: async (task: Omit<Task, "id" | "created_at" | "updated_at">) => {
    return await supabase.from("tasks").insert(task).select().single();
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    return await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  },

  // Flight sheet operations
  getFlightSheets: async () => {
    return await supabase
      .from("flight_sheets")
      .select(
        `
      *,
      aircraft:aircraft(registration, model),
      pilot:employees!pilot_id(name),
      copilot:employees!copilot_id(name)
    `,
      )
      .order("departure_time", { ascending: false });
  },

  createFlightSheet: async (
    sheet: Omit<FlightSheet, "id" | "created_at" | "updated_at">,
  ) => {
    return await supabase.from("flight_sheets").insert(sheet).select().single();
  },

  updateFlightSheet: async (id: string, updates: Partial<FlightSheet>) => {
    return await supabase
      .from("flight_sheets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  },
};
