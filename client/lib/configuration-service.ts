import { supabase } from "./supabase";

export interface InterventionType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftConfig {
  id: string;
  name: string;
  displayName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfiguration {
  interventionTypes: InterventionType[];
  shifts: ShiftConfig[];
  locations: LocationConfig[];
}

class ConfigurationService {
  private readonly STORAGE_KEYS = {
    INTERVENTION_TYPES: "intervention_types",
    SHIFTS: "shift_configs",
    LOCATIONS: "location_configs",
    LAST_SYNC: "config_last_sync",
  };

  // Default configurations
  private getDefaultInterventionTypes(): InterventionType[] {
    return [
      {
        id: "1",
        name: "Limpeza Exterior",
        description: "Limpeza completa da parte externa da aeronave",
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Limpeza Interior",
        description: "Limpeza completa da cabine e interior da aeronave",
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Polimento",
        description: "Polimento da fuselagem e superfícies metálicas",
        isActive: true,
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Lavagem Profunda Durante a Manutenção de Base",
        description: "Limpeza detalhada realizada durante check de manutenção",
        isActive: true,
        order: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getDefaultShifts(): ShiftConfig[] {
    return [
      {
        id: "morning",
        name: "morning",
        displayName: "Manhã",
        startTime: "06:00",
        endTime: "14:00",
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "afternoon",
        name: "afternoon",
        displayName: "Tarde",
        startTime: "14:00",
        endTime: "22:00",
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "night",
        name: "night",
        displayName: "Noite",
        startTime: "22:00",
        endTime: "06:00",
        isActive: true,
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getDefaultLocations(): LocationConfig[] {
    return [
      {
        id: "1",
        name: "Hangar Principal",
        description: "Hangar principal para manutenção e limpeza",
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Pátio de Aeronaves",
        description: "Área externa para estacionamento de aeronaves",
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Terminal de Passageiros",
        description: "Área próxima ao terminal para limpeza rápida",
        isActive: true,
        order: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Área de Manutenção",
        description: "Área específica para manutenção programada",
        isActive: true,
        order: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "5",
        name: "Rampa Norte",
        description: "Rampa norte do aeroporto",
        isActive: true,
        order: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "6",
        name: "Rampa Sul",
        description: "Rampa sul do aeroporto",
        isActive: true,
        order: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "7",
        name: "Hangar de Manutenção",
        description: "Hangar específico para manutenção pesada",
        isActive: true,
        order: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "8",
        name: "Estacionamento VIP",
        description: "Área reservada para aeronaves VIP",
        isActive: true,
        order: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // Initialize configurations with defaults if not present
  async initializeConfigurations(): Promise<void> {
    try {
      // Check if configurations exist in localStorage
      const existingInterventionTypes = localStorage.getItem(
        this.STORAGE_KEYS.INTERVENTION_TYPES,
      );
      const existingShifts = localStorage.getItem(this.STORAGE_KEYS.SHIFTS);
      const existingLocations = localStorage.getItem(
        this.STORAGE_KEYS.LOCATIONS,
      );

      // Initialize with defaults if not present
      if (!existingInterventionTypes) {
        await this.saveInterventionTypes(this.getDefaultInterventionTypes());
      }

      if (!existingShifts) {
        await this.saveShifts(this.getDefaultShifts());
      }

      if (!existingLocations) {
        await this.saveLocations(this.getDefaultLocations());
      }

      console.log("Configuration service initialized successfully");
    } catch (error) {
      console.error("Error initializing configurations:", error);
    }
  }

  // Intervention Types Management
  async getInterventionTypes(): Promise<InterventionType[]> {
    try {
      // Try to load from Supabase first
      if (supabase) {
        const { data, error } = await supabase
          .from("intervention_types")
          .select("*")
          .eq("is_active", true)
          .order("order");

        if (!error && data) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            isActive: item.is_active,
            order: item.order,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to load intervention types from Supabase:", error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(this.STORAGE_KEYS.INTERVENTION_TYPES);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return defaults if nothing is stored
    const defaults = this.getDefaultInterventionTypes();
    await this.saveInterventionTypes(defaults);
    return defaults;
  }

  async saveInterventionTypes(types: InterventionType[]): Promise<void> {
    try {
      // Save to Supabase if available
      if (supabase) {
        const supabaseData = types.map((type) => ({
          id: type.id,
          name: type.name,
          description: type.description,
          is_active: type.isActive,
          order: type.order,
        }));

        const { error } = await supabase
          .from("intervention_types")
          .upsert(supabaseData);

        if (error) {
          console.warn("Failed to save to Supabase:", error);
        }
      }
    } catch (error) {
      console.warn("Error saving to Supabase:", error);
    }

    // Always save to localStorage as backup
    localStorage.setItem(
      this.STORAGE_KEYS.INTERVENTION_TYPES,
      JSON.stringify(types),
    );
  }

  async addInterventionType(
    type: Omit<InterventionType, "id" | "createdAt" | "updatedAt">,
  ): Promise<InterventionType> {
    const existingTypes = await this.getInterventionTypes();

    // Validate for duplicates
    const duplicate = existingTypes.find(
      (t) => t.name.toLowerCase().trim() === type.name.toLowerCase().trim(),
    );

    if (duplicate) {
      throw new Error(`Tipo de intervenção "${type.name}" já existe`);
    }

    const newType: InterventionType = {
      ...type,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTypes = [...existingTypes, newType].sort(
      (a, b) => a.order - b.order,
    );
    await this.saveInterventionTypes(updatedTypes);

    return newType;
  }

  async updateInterventionType(
    id: string,
    updates: Partial<InterventionType>,
  ): Promise<InterventionType> {
    const existingTypes = await this.getInterventionTypes();
    const typeIndex = existingTypes.findIndex((t) => t.id === id);

    if (typeIndex === -1) {
      throw new Error("Tipo de intervenção não encontrado");
    }

    // Validate for duplicates if name is being updated
    if (updates.name) {
      const duplicate = existingTypes.find(
        (t) =>
          t.id !== id &&
          t.name.toLowerCase().trim() === updates.name!.toLowerCase().trim(),
      );

      if (duplicate) {
        throw new Error(`Tipo de intervenção "${updates.name}" já existe`);
      }
    }

    const updatedType: InterventionType = {
      ...existingTypes[typeIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    existingTypes[typeIndex] = updatedType;
    await this.saveInterventionTypes(
      existingTypes.sort((a, b) => a.order - b.order),
    );

    return updatedType;
  }

  async deleteInterventionType(id: string): Promise<void> {
    const existingTypes = await this.getInterventionTypes();
    const filteredTypes = existingTypes.filter((t) => t.id !== id);

    if (filteredTypes.length === existingTypes.length) {
      throw new Error("Tipo de intervenção não encontrado");
    }

    await this.saveInterventionTypes(filteredTypes);
  }

  // Shifts Management
  async getShifts(): Promise<ShiftConfig[]> {
    try {
      // Try to load from Supabase first
      if (supabase) {
        const { data, error } = await supabase
          .from("shift_configs")
          .select("*")
          .eq("is_active", true)
          .order("order");

        if (!error && data) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            displayName: item.display_name,
            startTime: item.start_time,
            endTime: item.end_time,
            isActive: item.is_active,
            order: item.order,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to load shifts from Supabase:", error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(this.STORAGE_KEYS.SHIFTS);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return defaults if nothing is stored
    const defaults = this.getDefaultShifts();
    await this.saveShifts(defaults);
    return defaults;
  }

  async saveShifts(shifts: ShiftConfig[]): Promise<void> {
    try {
      // Save to Supabase if available
      if (supabase) {
        const supabaseData = shifts.map((shift) => ({
          id: shift.id,
          name: shift.name,
          display_name: shift.displayName,
          start_time: shift.startTime,
          end_time: shift.endTime,
          is_active: shift.isActive,
          order: shift.order,
        }));

        const { error } = await supabase
          .from("shift_configs")
          .upsert(supabaseData);

        if (error) {
          console.warn("Failed to save shifts to Supabase:", error);
        }
      }
    } catch (error) {
      console.warn("Error saving shifts to Supabase:", error);
    }

    // Always save to localStorage as backup
    localStorage.setItem(this.STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }

  // Locations Management
  async getLocations(): Promise<LocationConfig[]> {
    try {
      // Try to load from Supabase first
      if (supabase) {
        const { data, error } = await supabase
          .from("location_configs")
          .select("*")
          .eq("is_active", true)
          .order("order");

        if (!error && data) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            isActive: item.is_active,
            order: item.order,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to load locations from Supabase:", error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(this.STORAGE_KEYS.LOCATIONS);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return defaults if nothing is stored
    const defaults = this.getDefaultLocations();
    await this.saveLocations(defaults);
    return defaults;
  }

  async saveLocations(locations: LocationConfig[]): Promise<void> {
    try {
      // Save to Supabase if available
      if (supabase) {
        const supabaseData = locations.map((location) => ({
          id: location.id,
          name: location.name,
          description: location.description,
          is_active: location.isActive,
          order: location.order,
        }));

        const { error } = await supabase
          .from("location_configs")
          .upsert(supabaseData);

        if (error) {
          console.warn("Failed to save locations to Supabase:", error);
        }
      }
    } catch (error) {
      console.warn("Error saving locations to Supabase:", error);
    }

    // Always save to localStorage as backup
    localStorage.setItem(
      this.STORAGE_KEYS.LOCATIONS,
      JSON.stringify(locations),
    );
  }

  async addLocation(
    location: Omit<LocationConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<LocationConfig> {
    const existingLocations = await this.getLocations();

    // Validate for duplicates
    const duplicate = existingLocations.find(
      (l) => l.name.toLowerCase().trim() === location.name.toLowerCase().trim(),
    );

    if (duplicate) {
      throw new Error(`Local "${location.name}" já existe`);
    }

    const newLocation: LocationConfig = {
      ...location,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLocations = [...existingLocations, newLocation].sort(
      (a, b) => a.order - b.order,
    );
    await this.saveLocations(updatedLocations);

    return newLocation;
  }

  async updateLocation(
    id: string,
    updates: Partial<LocationConfig>,
  ): Promise<LocationConfig> {
    const existingLocations = await this.getLocations();
    const locationIndex = existingLocations.findIndex((l) => l.id === id);

    if (locationIndex === -1) {
      throw new Error("Local não encontrado");
    }

    // Validate for duplicates if name is being updated
    if (updates.name) {
      const duplicate = existingLocations.find(
        (l) =>
          l.id !== id &&
          l.name.toLowerCase().trim() === updates.name!.toLowerCase().trim(),
      );

      if (duplicate) {
        throw new Error(`Local "${updates.name}" já existe`);
      }
    }

    const updatedLocation: LocationConfig = {
      ...existingLocations[locationIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    existingLocations[locationIndex] = updatedLocation;
    await this.saveLocations(
      existingLocations.sort((a, b) => a.order - b.order),
    );

    return updatedLocation;
  }

  async deleteLocation(id: string): Promise<void> {
    const existingLocations = await this.getLocations();
    const filteredLocations = existingLocations.filter((l) => l.id !== id);

    if (filteredLocations.length === existingLocations.length) {
      throw new Error("Local não encontrado");
    }

    await this.saveLocations(filteredLocations);
  }

  // Get all configurations at once
  async getAllConfigurations(): Promise<SystemConfiguration> {
    const [interventionTypes, shifts, locations] = await Promise.all([
      this.getInterventionTypes(),
      this.getShifts(),
      this.getLocations(),
    ]);

    return {
      interventionTypes,
      shifts,
      locations,
    };
  }

  // Utility methods for legacy compatibility
  getInterventionTypeNames(): Promise<string[]> {
    return this.getInterventionTypes().then((types) =>
      types.filter((t) => t.isActive).map((t) => t.name),
    );
  }

  getLocationNames(): Promise<string[]> {
    return this.getLocations().then((locations) =>
      locations.filter((l) => l.isActive).map((l) => l.name),
    );
  }

  getShiftOptions(): Promise<
    Array<{ value: string; label: string; times: string }>
  > {
    return this.getShifts().then((shifts) =>
      shifts
        .filter((s) => s.isActive)
        .map((s) => ({
          value: s.name,
          label: s.displayName,
          times: `${s.startTime} - ${s.endTime}`,
        })),
    );
  }
}

export const configurationService = new ConfigurationService();

// Initialize configurations on service creation
configurationService.initializeConfigurations();
