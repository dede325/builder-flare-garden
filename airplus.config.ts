// AirPlus Aviation - Production Configuration
// ==========================================

export const airPlusConfig = {
  // Company Information
  company: {
    name: "AirPlus Aviation Services",
    shortName: "AirPlus",
    address: "Aeroporto Internacional 4 de Fevereiro",
    city: "Luanda",
    country: "Angola",
    phone: "+244 923 000 000",
    email: "operacoes@airplus.co",
    website: "www.airplus.co",
    emailDomain: "@airplus.co"
  },

  // Application Configuration
  app: {
    name: "AirPlus Aviation",
    version: "1.0.0",
    buildNumber: "1",
    environment: import.meta.env.VITE_APP_ENVIRONMENT || "production",
    
    // Features
    features: {
      demoMode: import.meta.env.VITE_ENABLE_DEMO_MODE === "true",
      offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== "false",
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
      qrCodes: true,
      photoEvidence: true,
      digitalSignatures: true,
      pdfGeneration: true,
      realTimeSync: true
    }
  },

  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://fyngvoojdfjexbzasgiz.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    
    // Database Tables
    tables: {
      funcionarios: "funcionarios",
      aeronaves: "aeronaves", 
      folhas: "folhas",
      folhaFuncionarios: "folha_funcionarios",
      fotos: "fotos",
      qrCodes: "qr_codes",
      usuarios: "usuarios",
      auditLog: "audit_log"
    },

    // Storage Buckets
    storage: {
      pdfs: "pdfs",
      photos: "photos",
      signatures: "signatures",
      avatars: "avatars"
    }
  },

  // Mobile Configuration
  mobile: {
    appId: "com.airplus.aviation",
    appName: "AirPlus Aviation",
    version: "1.0.0",
    
    // Permissions
    permissions: {
      camera: true,
      photos: true,
      location: false,
      notifications: true,
      storage: true
    },

    // Platform specific
    android: {
      minSdkVersion: 22,
      targetSdkVersion: 34,
      compileSdkVersion: 34
    },
    
    ios: {
      deploymentTarget: "13.0",
      bundleId: "com.airplus.aviation"
    }
  },

  // PDF Configuration
  pdf: {
    companyLogo: "/airplus-logo.svg",
    brandColors: {
      primary: [37, 99, 235],    // Blue
      secondary: [71, 85, 105],  // Gray
      accent: [34, 197, 94],     // Green
      text: [15, 23, 42],        // Dark blue
      lightGray: [248, 250, 252] // Light gray
    },
    
    metadata: {
      author: "AirPlus Aviation Services",
      creator: "AirPlus System v1.0",
      subject: "Aircraft Cleaning Sheet",
      keywords: "aircraft, cleaning, maintenance, aviation, airplus"
    }
  },

  // Security Configuration
  security: {
    enableRowLevelSecurity: true,
    requireEmailVerification: true,
    restrictToCompanyDomain: true,
    passwordMinLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    
    // Authentication
    auth: {
      providers: ["email"],
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      autoRefreshToken: true,
      persistSession: true
    }
  },

  // UI Configuration
  ui: {
    theme: {
      primaryColor: "#2563eb",
      secondaryColor: "#475569", 
      accentColor: "#22c55e",
      backgroundColor: "#0f172a",
      surfaceColor: "#1e293b"
    },
    
    language: "pt-AO",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm",
    currency: "AOA",
    
    // Navigation
    defaultRoute: "/",
    loginRoute: "/login",
    dashboardRoute: "/",
    
    // Features UI
    showCompanyLogo: true,
    showVersionInfo: false,
    enableDarkMode: false,
    enableNotifications: true
  },

  // Business Logic
  business: {
    // Form Configuration
    forms: {
      codePrefix: "AP-PS-SNR",
      autoGenerateQR: true,
      requireSupervisorSignature: true,
      allowClientConfirmationWithoutSignature: true,
      maxPhotosPerCategory: 10,
      requiredFields: ["aeronave_id", "local", "tipos_intervencao", "funcionarios"]
    },

    // Shifts
    shifts: [
      { id: "manha", name: "Manhã", start: "06:00", end: "14:00" },
      { id: "tarde", name: "Tarde", start: "14:00", end: "22:00" },
      { id: "noite", name: "Noite", start: "22:00", end: "06:00" }
    ],

    // Default intervention types
    defaultInterventionTypes: [
      "Limpeza Exterior",
      "Limpeza Interior", 
      "Polimento da Fuselagem",
      "Lavagem Durante Manutenção",
      "Desinfecção da Cabine",
      "Limpeza de Janelas",
      "Aspiração de Carpetes",
      "Limpeza de WC"
    ],

    // Default locations
    defaultLocations: [
      "Hangar Principal",
      "Hangar de Manutenção",
      "Pátio de Aeronaves",
      "Terminal de Passageiros",
      "Rampa Norte",
      "Rampa Sul",
      "Área VIP",
      "Área de Carga"
    ]
  },

  // Sync Configuration
  sync: {
    enableOfflineMode: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 2000,
    maxOfflineStorage: 100 * 1024 * 1024, // 100MB
    
    // Conflict resolution
    conflictResolution: "last-write-wins",
    enableChangeTracking: true,
    keepHistoryDays: 30
  },

  // Development Configuration
  development: {
    enableDebugMode: import.meta.env.DEV,
    showSyncStatus: true,
    enableConsoleLogs: import.meta.env.DEV,
    mockData: false,
    enableHotReload: import.meta.env.DEV
  }
};

// Export specific configurations
export const {
  company,
  app,
  supabase,
  mobile,
  pdf,
  security,
  ui,
  business,
  sync,
  development
} = airPlusConfig;

// Validation functions
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!supabase.url || supabase.url.includes("demo")) {
    errors.push("Valid Supabase URL required for production");
  }
  
  if (!supabase.anonKey || supabase.anonKey.includes("demo")) {
    errors.push("Valid Supabase anon key required for production");
  }
  
  if (app.environment === "production" && app.features.demoMode) {
    errors.push("Demo mode should be disabled in production");
  }
  
  if (errors.length > 0) {
    console.error("❌ Configuration validation failed:", errors);
    return false;
  }
  
  console.log("✅ AirPlus configuration validated successfully");
  return true;
};

// Initialize configuration
if (app.environment === "production") {
  validateConfig();
}

export default airPlusConfig;
