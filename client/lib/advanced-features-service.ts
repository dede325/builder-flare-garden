import { z } from "zod";

// Mobile Features Configuration
export const MobileFeaturesSchema = z.object({
  pushNotifications: z.object({
    enabled: z.boolean(),
    newForms: z.boolean(),
    statusUpdates: z.boolean(),
    urgentAlerts: z.boolean(),
    endpoint: z.string().optional(),
    vapidKey: z.string().optional(),
  }),
  offlineMode: z.object({
    enabled: z.boolean(),
    maxStorageMB: z.number().min(10).max(1000),
    syncInterval: z.number().min(5).max(60), // minutes
    autoSync: z.boolean(),
    backgroundSync: z.boolean(),
  }),
  qrCodeScanning: z.object({
    enabled: z.boolean(),
    aircraftCode: z.boolean(),
    employeeCode: z.boolean(),
    customCodes: z.boolean(),
  }),
  biometricAuth: z.object({
    enabled: z.boolean(),
    fingerprint: z.boolean(),
    faceRecognition: z.boolean(),
    mandatory: z.boolean(),
  }),
});

// Analytics Configuration
export const AnalyticsConfigSchema = z.object({
  executiveDashboard: z.object({
    enabled: z.boolean(),
    metrics: z.array(z.string()),
    refreshInterval: z.number().min(1).max(60), // minutes
    realTimeUpdates: z.boolean(),
  }),
  automaticReports: z.object({
    enabled: z.boolean(),
    monthly: z.boolean(),
    weekly: z.boolean(),
    daily: z.boolean(),
    emailRecipients: z.array(z.string().email()),
    format: z.enum(["PDF", "CSV", "BOTH"]),
  }),
  performanceTracking: z.object({
    enabled: z.boolean(),
    employeeMetrics: z.boolean(),
    teamMetrics: z.boolean(),
    locationMetrics: z.boolean(),
    timeTracking: z.boolean(),
  }),
  slaAlerts: z.object({
    enabled: z.boolean(),
    thresholds: z.object({
      completion: z.number().min(0).max(100),
      quality: z.number().min(0).max(100),
      response: z.number().min(0).max(24), // hours
    }),
    recipients: z.array(z.string().email()),
  }),
});

// Smart Automation Configuration
export const SmartAutomationSchema = z.object({
  autoScheduling: z.object({
    enabled: z.boolean(),
    algorithm: z.enum(["EFFICIENCY", "BALANCED", "QUALITY"]),
    lookAhead: z.number().min(1).max(30), // days
    considerWeather: z.boolean(),
    considerMaintenance: z.boolean(),
  }),
  timePrediction: z.object({
    enabled: z.boolean(),
    useHistoricalData: z.boolean(),
    aircraftFactors: z.boolean(),
    weatherFactors: z.boolean(),
    teamFactors: z.boolean(),
  }),
  routeOptimization: z.object({
    enabled: z.boolean(),
    minimizeTravel: z.boolean(),
    balanceWorkload: z.boolean(),
    priorityHandling: z.boolean(),
  }),
  flightIntegration: z.object({
    enabled: z.boolean(),
    apiEndpoint: z.string().optional(),
    apiKey: z.string().optional(),
    autoUpdate: z.boolean(),
    realTimeSync: z.boolean(),
  }),
});

// Advanced Security Configuration
export const AdvancedSecuritySchema = z.object({
  twoFactorAuth: z.object({
    enabled: z.boolean(),
    mandatory: z.boolean(),
    methods: z.array(z.enum(["SMS", "EMAIL", "AUTHENTICATOR", "BIOMETRIC"])),
    sessionTimeout: z.number().min(5).max(480), // minutes
  }),
  singleSignOn: z.object({
    enabled: z.boolean(),
    provider: z.enum(["SAML", "OAuth2", "OpenID"]).optional(),
    endpoint: z.string().optional(),
    clientId: z.string().optional(),
    domain: z.string().optional(),
  }),
  auditLogging: z.object({
    enabled: z.boolean(),
    blockchain: z.boolean(),
    detailLevel: z.enum(["BASIC", "DETAILED", "COMPREHENSIVE"]),
    retention: z.number().min(30).max(2555), // days
    encryption: z.boolean(),
  }),
  backupStrategy: z.object({
    enabled: z.boolean(),
    frequency: z.enum(["HOURLY", "DAILY", "WEEKLY"]),
    regions: z.array(z.string()),
    encryption: z.boolean(),
    verification: z.boolean(),
  }),
});

export type MobileFeaturesConfig = z.infer<typeof MobileFeaturesSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
export type SmartAutomationConfig = z.infer<typeof SmartAutomationSchema>;
export type AdvancedSecurityConfig = z.infer<typeof AdvancedSecuritySchema>;

export interface AdvancedFeaturesConfig {
  id: string;
  name: string;
  description: string;
  category: "MOBILE" | "ANALYTICS" | "AUTOMATION" | "SECURITY";
  isActive: boolean;
  config: MobileFeaturesConfig | AnalyticsConfig | SmartAutomationConfig | AdvancedSecurityConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

class AdvancedFeaturesService {
  private readonly storageKey = "aviation_advanced_features";
  private readonly defaultConfigs: AdvancedFeaturesConfig[] = [];

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    this.defaultConfigs.push(
      {
        id: "mobile-features",
        name: "Funcionalidades Móveis Avançadas",
        description: "Push notifications, modo offline, QR codes e autenticação biométrica",
        category: "MOBILE",
        isActive: false,
        config: {
          pushNotifications: {
            enabled: false,
            newForms: false,
            statusUpdates: false,
            urgentAlerts: false,
          },
          offlineMode: {
            enabled: false,
            maxStorageMB: 100,
            syncInterval: 15,
            autoSync: true,
            backgroundSync: false,
          },
          qrCodeScanning: {
            enabled: false,
            aircraftCode: false,
            employeeCode: false,
            customCodes: false,
          },
          biometricAuth: {
            enabled: false,
            fingerprint: false,
            faceRecognition: false,
            mandatory: false,
          },
        } as MobileFeaturesConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        updatedBy: "system",
      },
      {
        id: "analytics-reports",
        name: "Analytics e Relatórios",
        description: "Dashboard executivo, relatórios automáticos e tracking de performance",
        category: "ANALYTICS",
        isActive: false,
        config: {
          executiveDashboard: {
            enabled: false,
            metrics: ["completion_rate", "efficiency", "quality_score"],
            refreshInterval: 5,
            realTimeUpdates: false,
          },
          automaticReports: {
            enabled: false,
            monthly: false,
            weekly: false,
            daily: false,
            emailRecipients: [],
            format: "PDF",
          },
          performanceTracking: {
            enabled: false,
            employeeMetrics: false,
            teamMetrics: false,
            locationMetrics: false,
            timeTracking: false,
          },
          slaAlerts: {
            enabled: false,
            thresholds: {
              completion: 95,
              quality: 90,
              response: 4,
            },
            recipients: [],
          },
        } as AnalyticsConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        updatedBy: "system",
      },
      {
        id: "smart-automation",
        name: "Automação Inteligente",
        description: "Auto-agendamento, predição de tempo e otimização de rotas",
        category: "AUTOMATION",
        isActive: false,
        config: {
          autoScheduling: {
            enabled: false,
            algorithm: "BALANCED",
            lookAhead: 7,
            considerWeather: false,
            considerMaintenance: false,
          },
          timePrediction: {
            enabled: false,
            useHistoricalData: false,
            aircraftFactors: false,
            weatherFactors: false,
            teamFactors: false,
          },
          routeOptimization: {
            enabled: false,
            minimizeTravel: false,
            balanceWorkload: false,
            priorityHandling: false,
          },
          flightIntegration: {
            enabled: false,
            autoUpdate: false,
            realTimeSync: false,
          },
        } as SmartAutomationConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        updatedBy: "system",
      },
      {
        id: "advanced-security",
        name: "Segurança Avançada",
        description: "2FA, SSO, auditoria avançada e backup automático",
        category: "SECURITY",
        isActive: false,
        config: {
          twoFactorAuth: {
            enabled: false,
            mandatory: false,
            methods: [],
            sessionTimeout: 60,
          },
          singleSignOn: {
            enabled: false,
          },
          auditLogging: {
            enabled: false,
            blockchain: false,
            detailLevel: "BASIC",
            retention: 365,
            encryption: false,
          },
          backupStrategy: {
            enabled: false,
            frequency: "DAILY",
            regions: [],
            encryption: false,
            verification: false,
          },
        } as AdvancedSecurityConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        updatedBy: "system",
      }
    );
  }

  async getAllConfigurations(): Promise<AdvancedFeaturesConfig[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const configs = JSON.parse(stored);
        return configs.length > 0 ? configs : this.defaultConfigs;
      }
      return this.defaultConfigs;
    } catch (error) {
      console.error("Error loading advanced features configurations:", error);
      return this.defaultConfigs;
    }
  }

  async getConfigurationById(id: string): Promise<AdvancedFeaturesConfig | null> {
    const configs = await this.getAllConfigurations();
    return configs.find(config => config.id === id) || null;
  }

  async getConfigurationsByCategory(category: AdvancedFeaturesConfig["category"]): Promise<AdvancedFeaturesConfig[]> {
    const configs = await this.getAllConfigurations();
    return configs.filter(config => config.category === category);
  }

  async getActiveConfigurations(): Promise<AdvancedFeaturesConfig[]> {
    const configs = await this.getAllConfigurations();
    return configs.filter(config => config.isActive);
  }

  async updateConfiguration(
    id: string, 
    updates: Partial<AdvancedFeaturesConfig>,
    updatedBy: string = "user"
  ): Promise<AdvancedFeaturesConfig> {
    const configs = await this.getAllConfigurations();
    const index = configs.findIndex(config => config.id === id);
    
    if (index === -1) {
      throw new Error(`Configuration with ID "${id}" not found`);
    }

    // Validate config based on category
    if (updates.config) {
      const category = configs[index].category;
      try {
        switch (category) {
          case "MOBILE":
            MobileFeaturesSchema.parse(updates.config);
            break;
          case "ANALYTICS":
            AnalyticsConfigSchema.parse(updates.config);
            break;
          case "AUTOMATION":
            SmartAutomationSchema.parse(updates.config);
            break;
          case "SECURITY":
            AdvancedSecuritySchema.parse(updates.config);
            break;
        }
      } catch (error) {
        throw new Error(`Invalid configuration: ${error}`);
      }
    }

    const updatedConfig = {
      ...configs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    configs[index] = updatedConfig;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return updatedConfig;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  async toggleConfiguration(id: string, updatedBy: string = "user"): Promise<AdvancedFeaturesConfig> {
    const config = await this.getConfigurationById(id);
    if (!config) {
      throw new Error(`Configuration with ID "${id}" not found`);
    }

    return this.updateConfiguration(id, { isActive: !config.isActive }, updatedBy);
  }

  async createConfiguration(
    config: Omit<AdvancedFeaturesConfig, "id" | "createdAt" | "updatedAt">,
    createdBy: string = "user"
  ): Promise<AdvancedFeaturesConfig> {
    // Validate config based on category
    try {
      switch (config.category) {
        case "MOBILE":
          MobileFeaturesSchema.parse(config.config);
          break;
        case "ANALYTICS":
          AnalyticsConfigSchema.parse(config.config);
          break;
        case "AUTOMATION":
          SmartAutomationSchema.parse(config.config);
          break;
        case "SECURITY":
          AdvancedSecuritySchema.parse(config.config);
          break;
      }
    } catch (error) {
      throw new Error(`Invalid configuration: ${error}`);
    }

    const newConfig: AdvancedFeaturesConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      updatedBy: createdBy,
    };

    const configs = await this.getAllConfigurations();
    configs.push(newConfig);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return newConfig;
    } catch (error) {
      throw new Error(`Failed to create configuration: ${error}`);
    }
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    const configs = await this.getAllConfigurations();
    const index = configs.findIndex(config => config.id === id);
    
    if (index === -1) {
      throw new Error(`Configuration with ID "${id}" not found`);
    }

    configs.splice(index, 1);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return true;
    } catch (error) {
      throw new Error(`Failed to delete configuration: ${error}`);
    }
  }

  async resetToDefaults(): Promise<AdvancedFeaturesConfig[]> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.defaultConfigs));
      return this.defaultConfigs;
    } catch (error) {
      throw new Error(`Failed to reset configurations: ${error}`);
    }
  }

  async exportConfiguration(): Promise<string> {
    const configs = await this.getAllConfigurations();
    return JSON.stringify(configs, null, 2);
  }

  async importConfiguration(configData: string, importedBy: string = "user"): Promise<AdvancedFeaturesConfig[]> {
    try {
      const importedConfigs = JSON.parse(configData) as AdvancedFeaturesConfig[];
      
      // Validate each configuration
      for (const config of importedConfigs) {
        switch (config.category) {
          case "MOBILE":
            MobileFeaturesSchema.parse(config.config);
            break;
          case "ANALYTICS":
            AnalyticsConfigSchema.parse(config.config);
            break;
          case "AUTOMATION":
            SmartAutomationSchema.parse(config.config);
            break;
          case "SECURITY":
            AdvancedSecuritySchema.parse(config.config);
            break;
        }
      }

      // Update timestamps and user info
      const processedConfigs = importedConfigs.map(config => ({
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: importedBy,
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(processedConfigs));
      return processedConfigs;
    } catch (error) {
      throw new Error(`Failed to import configurations: ${error}`);
    }
  }

  // Feature-specific helper methods
  async isMobileFeatureEnabled(feature: keyof MobileFeaturesConfig): Promise<boolean> {
    const config = await this.getConfigurationById("mobile-features");
    return config?.isActive && (config.config as MobileFeaturesConfig)[feature]?.enabled === true;
  }

  async isAnalyticsFeatureEnabled(feature: keyof AnalyticsConfig): Promise<boolean> {
    const config = await this.getConfigurationById("analytics-reports");
    return config?.isActive && (config.config as AnalyticsConfig)[feature]?.enabled === true;
  }

  async isAutomationFeatureEnabled(feature: keyof SmartAutomationConfig): Promise<boolean> {
    const config = await this.getConfigurationById("smart-automation");
    return config?.isActive && (config.config as SmartAutomationConfig)[feature]?.enabled === true;
  }

  async isSecurityFeatureEnabled(feature: keyof AdvancedSecurityConfig): Promise<boolean> {
    const config = await this.getConfigurationById("advanced-security");
    return config?.isActive && (config.config as AdvancedSecurityConfig)[feature]?.enabled === true;
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();
