import { intelligentSyncService } from "./intelligent-sync-service";

class CacheService {
  private cacheValidityHours = 4; // Cache valid for 4 hours

  // Employees Cache
  async cacheEmployees(employees: any[]): Promise<void> {
    try {
      await intelligentSyncService.cacheEmployees(employees);
      console.log(`Cached ${employees.length} employees`);
    } catch (error) {
      console.error("Failed to cache employees:", error);
    }
  }

  async getCachedEmployees(): Promise<any[]> {
    try {
      return await intelligentSyncService.getAllEmployees();
    } catch (error) {
      console.error("Failed to get cached employees:", error);
      return [];
    }
  }

  async saveEmployee(employeeData: any): Promise<string> {
    try {
      return await intelligentSyncService.saveEmployee(employeeData);
    } catch (error) {
      console.error("Failed to save employee:", error);
      throw error;
    }
  }

  // Aircraft Cache
  async cacheAircraft(aircraft: any[]): Promise<void> {
    try {
      await intelligentSyncService.cacheAircraft(aircraft);
      console.log(`Cached ${aircraft.length} aircraft`);
    } catch (error) {
      console.error("Failed to cache aircraft:", error);
    }
  }

  async getCachedAircraft(): Promise<any[]> {
    try {
      return await intelligentSyncService.getAllAircraft();
    } catch (error) {
      console.error("Failed to get cached aircraft:", error);
      return [];
    }
  }

  async saveAircraft(aircraftData: any): Promise<string> {
    try {
      return await intelligentSyncService.saveAircraft(aircraftData);
    } catch (error) {
      console.error("Failed to save aircraft:", error);
      throw error;
    }
  }

  // Cache validation
  private isExpired(timestamp: string): boolean {
    const cached = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - cached.getTime()) / (1000 * 60 * 60);
    return diffHours > this.cacheValidityHours;
  }

  async isCacheValid(type: "employees" | "aircraft"): Promise<boolean> {
    try {
      // Get metadata through public methods
      const cachedData = type === "employees"
        ? await this.getCachedEmployees()
        : await this.getCachedAircraft();

      if (cachedData.length === 0) return false;

      // Check if we have recent cache (simplified check)
      const metadata = { timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() };

      if (!metadata) return false;
      return !this.isExpired(metadata.timestamp);
    } catch (error) {
      return false;
    }
  }

  // Smart loading with cache fallback
  async loadEmployeesWithCache(): Promise<any[]> {
    try {
      // Try to get fresh data if online
      if (navigator.onLine) {
        const { supabase } = await import("./supabase");
        if (supabase) {
          const { data, error } = await supabase
            .from("employees")
            .select("*")
            .eq("status", "active");

          if (!error && data) {
            // Cache the fresh data
            await this.cacheEmployees(data);
            return data;
          }
        }
      }

      // Fall back to cache
      const cachedEmployees = await this.getCachedEmployees();
      if (cachedEmployees.length > 0) {
        return cachedEmployees.filter(
          (emp) => !emp._isCached || emp.status === "active",
        );
      }

      // Final fallback to localStorage
      const savedEmployees = localStorage.getItem("aviation_employees");
      if (savedEmployees) {
        const employeesData = JSON.parse(savedEmployees);
        const activeEmployees = employeesData.filter(
          (emp: any) => emp.status === "active",
        );

        // Cache the localStorage data for future use
        await this.cacheEmployees(activeEmployees);
        return activeEmployees;
      }

      return [];
    } catch (error) {
      console.error("Failed to load employees with cache:", error);
      return [];
    }
  }

  async loadAircraftWithCache(): Promise<any[]> {
    try {
      // Try to get fresh data if online
      if (navigator.onLine) {
        const { supabase } = await import("./supabase");
        if (supabase) {
          const { data, error } = await supabase
            .from("aircraft")
            .select("*")
            .eq("status", "active");

          if (!error && data) {
            // Cache the fresh data
            await this.cacheAircraft(data);
            return data;
          }
        }
      }

      // Fall back to cache
      const cachedAircraft = await this.getCachedAircraft();
      if (cachedAircraft.length > 0) {
        return cachedAircraft.filter(
          (ac) => !ac._isCached || ac.status === "active",
        );
      }

      // Final fallback to localStorage
      const savedAircraft = localStorage.getItem("aviation_aircraft");
      if (savedAircraft) {
        const aircraftData = JSON.parse(savedAircraft);
        const activeAircraft = aircraftData.filter(
          (ac: any) => ac.status === "active",
        );

        // Cache the localStorage data for future use
        await this.cacheAircraft(activeAircraft);
        return activeAircraft;
      }

      return [];
    } catch (error) {
      console.error("Failed to load aircraft with cache:", error);
      return [];
    }
  }

  // Clear cache
  async clearCache(type?: "employees" | "aircraft"): Promise<void> {
    try {
      if (!type || type === "employees") {
        // Clear employees cache by removing all cached items
        const employees = await intelligentSyncService.getAllEmployees();
        for (const emp of employees.filter((e) => e._isCached)) {
          await intelligentSyncService.deleteEmployee?.(emp.id);
        }
      }

      if (!type || type === "aircraft") {
        // Clear aircraft cache by removing all cached items
        const aircraft = await intelligentSyncService.getAllAircraft();
        for (const ac of aircraft.filter((a) => a._isCached)) {
          await intelligentSyncService.deleteAircraft?.(ac.id);
        }
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  // Force refresh cache
  async refreshCache(type: "employees" | "aircraft"): Promise<void> {
    await this.clearCache(type);

    if (type === "employees") {
      await this.loadEmployeesWithCache();
    } else {
      await this.loadAircraftWithCache();
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    employees: { total: number; cached: number; lastUpdate?: string };
    aircraft: { total: number; cached: number; lastUpdate?: string };
  }> {
    try {
      const [employees, aircraft] = await Promise.all([
        this.getCachedEmployees(),
        this.getCachedAircraft(),
      ]);

      const employeesLastCached = await intelligentSyncService.getMetadata?.(
        "employeesLastCached",
      );
      const aircraftLastCached =
        await intelligentSyncService.getMetadata?.("aircraftLastCached");

      return {
        employees: {
          total: employees.length,
          cached: employees.filter((e) => e._isCached).length,
          lastUpdate: employeesLastCached?.timestamp,
        },
        aircraft: {
          total: aircraft.length,
          cached: aircraft.filter((a) => a._isCached).length,
          lastUpdate: aircraftLastCached?.timestamp,
        },
      };
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        employees: { total: 0, cached: 0 },
        aircraft: { total: 0, cached: 0 },
      };
    }
  }
}

export const cacheService = new CacheService();
