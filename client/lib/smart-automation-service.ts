import { advancedFeaturesService, SmartAutomationConfig } from "./advanced-features-service";

export interface SchedulingTask {
  id: string;
  aircraftId: string;
  aircraftCode: string;
  interventionTypes: string[];
  estimatedDuration: number; // minutes
  priority: "low" | "medium" | "high" | "urgent";
  preferredEmployees: string[];
  requiredSkills: string[];
  scheduledStart?: string;
  scheduledEnd?: string;
  location: string;
  weatherSensitive: boolean;
  maintenanceWindow?: {
    start: string;
    end: string;
  };
  status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface SchedulingConstraint {
  id: string;
  type: "employee_availability" | "location_capacity" | "equipment_requirement" | "weather" | "maintenance";
  entityId: string;
  startTime: string;
  endTime: string;
  description: string;
  severity: "hard" | "soft"; // hard constraints cannot be violated
}

export interface OptimizedSchedule {
  id: string;
  date: string;
  tasks: ScheduledTask[];
  efficiency: number; // 0-100
  utilizationRate: number; // 0-100
  totalTravelTime: number; // minutes
  constraintViolations: ConstraintViolation[];
  algorithm: "EFFICIENCY" | "BALANCED" | "QUALITY";
  generatedAt: string;
}

export interface ScheduledTask extends SchedulingTask {
  assignedEmployees: string[];
  actualStart?: string;
  actualEnd?: string;
  travelTime: number;
  sequence: number;
}

export interface ConstraintViolation {
  constraintId: string;
  taskId: string;
  severity: "warning" | "error";
  description: string;
}

export interface TimePrediction {
  taskId: string;
  aircraftType: string;
  interventionType: string;
  baselineTime: number; // minutes
  predictedTime: number; // minutes
  factors: {
    aircraftComplexity: number;
    weatherImpact: number;
    teamExperience: number;
    historicalAverage: number;
  };
  confidence: number; // 0-100
  lastUpdated: string;
}

export interface RouteOptimization {
  employeeId: string;
  tasks: ScheduledTask[];
  optimizedRoute: {
    sequence: number;
    taskId: string;
    location: string;
    travelTime: number;
    arrivalTime: string;
    departureTime: string;
  }[];
  totalDistance: number; // km
  totalTravelTime: number; // minutes
  efficiency: number; // 0-100
}

export interface FlightIntegrationData {
  flightId: string;
  aircraftId: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  turnaroundTime: number; // minutes
  cleaningRequired: boolean;
  priority: "normal" | "high" | "urgent";
  passengerCount: number;
  route: string;
  delay?: number; // minutes
  status: "scheduled" | "boarding" | "departed" | "arrived" | "cancelled" | "delayed";
}

class SmartAutomationService {
  private readonly schedulingStorageKey = "aviation_smart_scheduling";
  private readonly predictionsStorageKey = "aviation_time_predictions";
  private readonly flightDataStorageKey = "aviation_flight_integration";

  async isAutoSchedulingEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAutomationFeatureEnabled('autoScheduling');
  }

  async isTimePredictionEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAutomationFeatureEnabled('timePrediction');
  }

  async isRouteOptimizationEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAutomationFeatureEnabled('routeOptimization');
  }

  async isFlightIntegrationEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAutomationFeatureEnabled('flightIntegration');
  }

  // Auto-Scheduling
  async generateOptimizedSchedule(
    tasks: SchedulingTask[],
    constraints: SchedulingConstraint[],
    algorithm: "EFFICIENCY" | "BALANCED" | "QUALITY" = "BALANCED"
  ): Promise<OptimizedSchedule> {
    const config = await this.getAutomationConfig();
    if (!config?.autoScheduling.enabled) {
      throw new Error('Auto-scheduling is not enabled');
    }

    const employees = this.getAvailableEmployees();
    const locations = this.getAvailableLocations();
    
    // Sort tasks by priority and constraints
    const sortedTasks = this.prioritizeTasks(tasks, algorithm);
    
    // Generate schedule
    const scheduledTasks: ScheduledTask[] = [];
    const violations: ConstraintViolation[] = [];
    let totalTravelTime = 0;

    for (const task of sortedTasks) {
      const prediction = await this.predictTaskDuration(task);
      const assignment = await this.findOptimalAssignment(
        task,
        constraints,
        scheduledTasks,
        employees,
        algorithm
      );

      if (assignment) {
        const scheduledTask: ScheduledTask = {
          ...task,
          assignedEmployees: assignment.employees,
          scheduledStart: assignment.startTime,
          scheduledEnd: assignment.endTime,
          travelTime: assignment.travelTime,
          sequence: scheduledTasks.length + 1,
          estimatedDuration: prediction.predictedTime,
        };

        scheduledTasks.push(scheduledTask);
        totalTravelTime += assignment.travelTime;
      } else {
        violations.push({
          constraintId: "assignment_failure",
          taskId: task.id,
          severity: "error",
          description: `Could not find suitable assignment for task ${task.aircraftCode}`,
        });
      }
    }

    // Calculate metrics
    const efficiency = this.calculateScheduleEfficiency(scheduledTasks, totalTravelTime);
    const utilizationRate = this.calculateUtilizationRate(scheduledTasks, employees);

    const optimizedSchedule: OptimizedSchedule = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      tasks: scheduledTasks,
      efficiency,
      utilizationRate,
      totalTravelTime,
      constraintViolations: violations,
      algorithm,
      generatedAt: new Date().toISOString(),
    };

    this.storeSchedule(optimizedSchedule);
    return optimizedSchedule;
  }

  async getSchedulingSuggestions(date: string): Promise<{
    suggestedTasks: SchedulingTask[];
    recommendations: {
      type: "efficiency" | "workload" | "priority";
      description: string;
      impact: number;
    }[];
  }> {
    const tasks = await this.getPendingTasks();
    const flightData = await this.getFlightData(date);
    
    // Generate suggestions based on flight arrivals/departures
    const suggestedTasks: SchedulingTask[] = [];
    const recommendations: any[] = [];

    for (const flight of flightData) {
      if (flight.cleaningRequired) {
        const urgency = this.calculateTaskUrgency(flight);
        const suggestedTask: SchedulingTask = {
          id: crypto.randomUUID(),
          aircraftId: flight.aircraftId,
          aircraftCode: flight.aircraftId,
          interventionTypes: this.getRequiredInterventions(flight),
          estimatedDuration: this.estimateCleaningDuration(flight),
          priority: urgency,
          preferredEmployees: [],
          requiredSkills: ["basic_cleaning"],
          location: "gate",
          weatherSensitive: false,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        suggestedTasks.push(suggestedTask);
      }
    }

    // Generate recommendations
    if (suggestedTasks.length > 0) {
      recommendations.push({
        type: "efficiency",
        description: `${suggestedTasks.length} tarefas de limpeza automáticas sugeridas baseadas nos voos`,
        impact: 85,
      });
    }

    const workloadBalance = this.analyzeWorkloadBalance();
    if (workloadBalance.imbalance > 20) {
      recommendations.push({
        type: "workload",
        description: "Redistribuir tarefas para equilibrar carga de trabalho",
        impact: workloadBalance.imbalance,
      });
    }

    return { suggestedTasks, recommendations };
  }

  // Time Prediction
  async predictTaskDuration(task: SchedulingTask): Promise<TimePrediction> {
    const config = await this.getAutomationConfig();
    if (!config?.timePrediction.enabled) {
      return {
        taskId: task.id,
        aircraftType: "unknown",
        interventionType: task.interventionTypes[0] || "general",
        baselineTime: task.estimatedDuration,
        predictedTime: task.estimatedDuration,
        factors: {
          aircraftComplexity: 1.0,
          weatherImpact: 1.0,
          teamExperience: 1.0,
          historicalAverage: 1.0,
        },
        confidence: 50,
        lastUpdated: new Date().toISOString(),
      };
    }

    const aircraft = this.getAircraftData(task.aircraftId);
    const historicalData = this.getHistoricalData(task.aircraftId, task.interventionTypes);
    const weather = await this.getWeatherData();
    const teamData = this.getTeamExperienceData(task.preferredEmployees);

    // Calculate factors
    const aircraftComplexity = this.calculateAircraftComplexity(aircraft);
    const weatherImpact = config.timePrediction.weatherFactors ? 
      this.calculateWeatherImpact(weather, task.weatherSensitive) : 1.0;
    const teamExperience = config.timePrediction.teamFactors ?
      this.calculateTeamExperience(teamData) : 1.0;
    const historicalAverage = config.timePrediction.useHistoricalData ?
      this.calculateHistoricalAverage(historicalData) : 1.0;

    // Predict time
    const baselineTime = task.estimatedDuration;
    const predictedTime = baselineTime * aircraftComplexity * weatherImpact * teamExperience * historicalAverage;
    
    // Calculate confidence based on data availability
    const confidence = this.calculatePredictionConfidence(
      historicalData.length,
      teamData.experienceLevel,
      weather.reliability
    );

    const prediction: TimePrediction = {
      taskId: task.id,
      aircraftType: aircraft?.type || "unknown",
      interventionType: task.interventionTypes[0] || "general",
      baselineTime,
      predictedTime: Math.round(predictedTime),
      factors: {
        aircraftComplexity,
        weatherImpact,
        teamExperience,
        historicalAverage,
      },
      confidence,
      lastUpdated: new Date().toISOString(),
    };

    this.storePrediction(prediction);
    return prediction;
  }

  async updatePredictionAccuracy(taskId: string, actualDuration: number): Promise<void> {
    const prediction = this.getStoredPrediction(taskId);
    if (!prediction) return;

    const accuracy = Math.abs(prediction.predictedTime - actualDuration) / actualDuration;
    
    // Store accuracy data for machine learning improvements
    this.storeAccuracyData({
      taskId,
      predictedTime: prediction.predictedTime,
      actualTime: actualDuration,
      accuracy: 1 - accuracy,
      factors: prediction.factors,
      timestamp: new Date().toISOString(),
    });
  }

  // Route Optimization
  async optimizeRoutes(scheduledTasks: ScheduledTask[]): Promise<RouteOptimization[]> {
    const config = await this.getAutomationConfig();
    if (!config?.routeOptimization.enabled) {
      return [];
    }

    // Group tasks by employee
    const tasksByEmployee = this.groupTasksByEmployee(scheduledTasks);
    const optimizations: RouteOptimization[] = [];

    for (const [employeeId, tasks] of Object.entries(tasksByEmployee)) {
      const optimization = await this.optimizeEmployeeRoute(
        employeeId,
        tasks,
        config.routeOptimization
      );
      optimizations.push(optimization);
    }

    return optimizations;
  }

  private async optimizeEmployeeRoute(
    employeeId: string,
    tasks: ScheduledTask[],
    config: any
  ): Promise<RouteOptimization> {
    // Get location coordinates
    const locations = this.getLocationCoordinates();
    
    // Calculate travel times between all locations
    const travelMatrix = this.calculateTravelMatrix(
      tasks.map(t => t.location),
      locations
    );

    // Apply optimization algorithm (simplified TSP)
    const optimizedSequence = this.solveTSP(tasks, travelMatrix, config);
    
    let totalTravelTime = 0;
    let totalDistance = 0;
    let currentTime = new Date();

    const optimizedRoute = optimizedSequence.map((task, index) => {
      const travelTime = index > 0 ? 
        travelMatrix[optimizedSequence[index - 1].location][task.location] : 0;
      
      totalTravelTime += travelTime;
      totalDistance += this.calculateDistance(
        index > 0 ? locations[optimizedSequence[index - 1].location] : locations[task.location],
        locations[task.location]
      );

      const arrivalTime = new Date(currentTime.getTime() + travelTime * 60000);
      const departureTime = new Date(arrivalTime.getTime() + task.estimatedDuration * 60000);
      currentTime = departureTime;

      return {
        sequence: index + 1,
        taskId: task.id,
        location: task.location,
        travelTime,
        arrivalTime: arrivalTime.toISOString(),
        departureTime: departureTime.toISOString(),
      };
    });

    const efficiency = this.calculateRouteEfficiency(totalTravelTime, tasks.length);

    return {
      employeeId,
      tasks,
      optimizedRoute,
      totalDistance,
      totalTravelTime,
      efficiency,
    };
  }

  // Flight Integration
  async syncFlightData(): Promise<void> {
    const config = await this.getAutomationConfig();
    if (!config?.flightIntegration.enabled || !config.flightIntegration.apiEndpoint) {
      return;
    }

    try {
      // This would integrate with real flight data API
      const mockFlightData: FlightIntegrationData[] = [
        {
          flightId: "TP1234",
          aircraftId: "CS-TNP",
          scheduledArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          scheduledDeparture: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          turnaroundTime: 120,
          cleaningRequired: true,
          priority: "normal",
          passengerCount: 180,
          route: "LIS-FRA",
          status: "scheduled",
        },
        {
          flightId: "TP5678",
          aircraftId: "CS-TOR",
          scheduledArrival: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          scheduledDeparture: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          turnaroundTime: 90,
          cleaningRequired: true,
          priority: "high",
          passengerCount: 150,
          route: "LIS-MAD",
          status: "scheduled",
        },
      ];

      this.storeFlightData(mockFlightData);

      // Auto-generate cleaning tasks if enabled
      if (config.flightIntegration.autoUpdate) {
        await this.generateTasksFromFlights(mockFlightData);
      }
    } catch (error) {
      console.error('Flight data sync failed:', error);
      throw error;
    }
  }

  private async generateTasksFromFlights(flights: FlightIntegrationData[]): Promise<void> {
    const tasks: SchedulingTask[] = [];

    for (const flight of flights) {
      if (flight.cleaningRequired && flight.status === 'scheduled') {
        const task: SchedulingTask = {
          id: crypto.randomUUID(),
          aircraftId: flight.aircraftId,
          aircraftCode: flight.aircraftId,
          interventionTypes: this.getRequiredInterventions(flight),
          estimatedDuration: this.estimateCleaningDuration(flight),
          priority: flight.priority === "high" ? "high" : "medium",
          preferredEmployees: [],
          requiredSkills: ["basic_cleaning"],
          location: "gate",
          weatherSensitive: false,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        tasks.push(task);
      }
    }

    if (tasks.length > 0) {
      await this.storeGeneratedTasks(tasks);
    }
  }

  // Helper Methods
  private async getAutomationConfig(): Promise<SmartAutomationConfig | null> {
    const config = await advancedFeaturesService.getConfigurationById('smart-automation');
    return config?.isActive ? (config.config as SmartAutomationConfig) : null;
  }

  private getAvailableEmployees(): any[] {
    const stored = localStorage.getItem("aviation_employees");
    return stored ? JSON.parse(stored).filter((e: any) => e.status === 'active') : [];
  }

  private getAvailableLocations(): any[] {
    return [
      { id: "gate_a", name: "Gate A", coordinates: { lat: 38.7742, lng: -9.1342 } },
      { id: "gate_b", name: "Gate B", coordinates: { lat: 38.7745, lng: -9.1345 } },
      { id: "hangar_1", name: "Hangar 1", coordinates: { lat: 38.7750, lng: -9.1350 } },
      { id: "maintenance", name: "Maintenance", coordinates: { lat: 38.7755, lng: -9.1355 } },
    ];
  }

  private prioritizeTasks(tasks: SchedulingTask[], algorithm: string): SchedulingTask[] {
    return tasks.sort((a, b) => {
      if (algorithm === "EFFICIENCY") {
        return a.estimatedDuration - b.estimatedDuration;
      } else if (algorithm === "QUALITY") {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        // BALANCED - combine priority and duration
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return a.estimatedDuration - b.estimatedDuration;
      }
    });
  }

  private async findOptimalAssignment(
    task: SchedulingTask,
    constraints: SchedulingConstraint[],
    existingTasks: ScheduledTask[],
    employees: any[],
    algorithm: string
  ): Promise<{
    employees: string[];
    startTime: string;
    endTime: string;
    travelTime: number;
  } | null> {
    // Simplified assignment logic
    const availableEmployees = employees.filter(emp => 
      this.isEmployeeAvailable(emp.id, task, existingTasks, constraints)
    );

    if (availableEmployees.length === 0) {
      return null;
    }

    const selectedEmployee = availableEmployees[0];
    const startTime = this.findEarliestStartTime(selectedEmployee.id, task, existingTasks);
    const endTime = new Date(new Date(startTime).getTime() + task.estimatedDuration * 60000).toISOString();
    const travelTime = this.calculateTravelTime(selectedEmployee.id, task.location, existingTasks);

    return {
      employees: [selectedEmployee.id],
      startTime,
      endTime,
      travelTime,
    };
  }

  private isEmployeeAvailable(
    employeeId: string,
    task: SchedulingTask,
    existingTasks: ScheduledTask[],
    constraints: SchedulingConstraint[]
  ): boolean {
    // Check if employee is already assigned to other tasks at the same time
    // This is a simplified check
    return true;
  }

  private findEarliestStartTime(
    employeeId: string,
    task: SchedulingTask,
    existingTasks: ScheduledTask[]
  ): string {
    // Find the earliest available time slot
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0); // 8 AM
    
    // For simplicity, return start of day plus some offset
    return new Date(startOfDay.getTime() + existingTasks.length * 2 * 60 * 60 * 1000).toISOString();
  }

  private calculateTravelTime(employeeId: string, location: string, existingTasks: ScheduledTask[]): number {
    // Simplified travel time calculation
    return Math.floor(Math.random() * 30); // 0-30 minutes
  }

  private calculateScheduleEfficiency(tasks: ScheduledTask[], totalTravelTime: number): number {
    if (tasks.length === 0) return 0;
    
    const totalWorkTime = tasks.reduce((acc, task) => acc + task.estimatedDuration, 0);
    const totalTime = totalWorkTime + totalTravelTime;
    
    return totalTime > 0 ? (totalWorkTime / totalTime) * 100 : 0;
  }

  private calculateUtilizationRate(tasks: ScheduledTask[], employees: any[]): number {
    if (employees.length === 0) return 0;
    
    const assignedEmployees = new Set(tasks.flatMap(task => task.assignedEmployees));
    return (assignedEmployees.size / employees.length) * 100;
  }

  // Storage methods
  private storeSchedule(schedule: OptimizedSchedule): void {
    const stored = localStorage.getItem(this.schedulingStorageKey);
    const schedules = stored ? JSON.parse(stored) : [];
    schedules.push(schedule);
    
    // Keep only last 30 schedules
    if (schedules.length > 30) {
      schedules.splice(0, schedules.length - 30);
    }
    
    localStorage.setItem(this.schedulingStorageKey, JSON.stringify(schedules));
  }

  private storePrediction(prediction: TimePrediction): void {
    const stored = localStorage.getItem(this.predictionsStorageKey);
    const predictions = stored ? JSON.parse(stored) : [];
    
    const existingIndex = predictions.findIndex((p: TimePrediction) => p.taskId === prediction.taskId);
    if (existingIndex >= 0) {
      predictions[existingIndex] = prediction;
    } else {
      predictions.push(prediction);
    }
    
    localStorage.setItem(this.predictionsStorageKey, JSON.stringify(predictions));
  }

  private storeFlightData(flights: FlightIntegrationData[]): void {
    localStorage.setItem(this.flightDataStorageKey, JSON.stringify(flights));
  }

  private getStoredPrediction(taskId: string): TimePrediction | null {
    const stored = localStorage.getItem(this.predictionsStorageKey);
    if (!stored) return null;
    
    const predictions = JSON.parse(stored);
    return predictions.find((p: TimePrediction) => p.taskId === taskId) || null;
  }

  // Mock data and calculations
  private getAircraftData(aircraftId: string): any {
    return { id: aircraftId, type: "A320", complexity: 1.2 };
  }

  private getHistoricalData(aircraftId: string, interventionTypes: string[]): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      duration: 90 + Math.random() * 60,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  private async getWeatherData(): Promise<any> {
    return { condition: "clear", temperature: 20, wind: 10, reliability: 0.9 };
  }

  private getTeamExperienceData(employeeIds: string[]): any {
    return { experienceLevel: 0.8, teamSize: employeeIds.length };
  }

  private calculateAircraftComplexity(aircraft: any): number {
    return aircraft?.complexity || 1.0;
  }

  private calculateWeatherImpact(weather: any, weatherSensitive: boolean): number {
    if (!weatherSensitive) return 1.0;
    return weather.condition === "clear" ? 1.0 : 1.3;
  }

  private calculateTeamExperience(teamData: any): number {
    return teamData.experienceLevel || 1.0;
  }

  private calculateHistoricalAverage(historicalData: any[]): number {
    if (historicalData.length === 0) return 1.0;
    const avgDuration = historicalData.reduce((acc, d) => acc + d.duration, 0) / historicalData.length;
    return avgDuration / 90; // Normalize to baseline of 90 minutes
  }

  private calculatePredictionConfidence(dataPoints: number, experience: number, reliability: number): number {
    const dataConfidence = Math.min(100, dataPoints * 10);
    const experienceConfidence = experience * 100;
    const weatherConfidence = reliability * 100;
    
    return Math.round((dataConfidence + experienceConfidence + weatherConfidence) / 3);
  }

  private storeAccuracyData(accuracyData: any): void {
    const stored = localStorage.getItem("aviation_prediction_accuracy");
    const data = stored ? JSON.parse(stored) : [];
    data.push(accuracyData);
    
    // Keep only last 1000 entries
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }
    
    localStorage.setItem("aviation_prediction_accuracy", JSON.stringify(data));
  }

  private async getPendingTasks(): Promise<SchedulingTask[]> {
    // Mock implementation - would fetch from real storage
    return [];
  }

  private async getFlightData(date: string): Promise<FlightIntegrationData[]> {
    const stored = localStorage.getItem(this.flightDataStorageKey);
    return stored ? JSON.parse(stored) : [];
  }

  private calculateTaskUrgency(flight: FlightIntegrationData): "low" | "medium" | "high" | "urgent" {
    const turnaroundHours = flight.turnaroundTime / 60;
    if (turnaroundHours < 1) return "urgent";
    if (turnaroundHours < 2) return "high";
    if (turnaroundHours < 3) return "medium";
    return "low";
  }

  private getRequiredInterventions(flight: FlightIntegrationData): string[] {
    const interventions = ["basic_cleaning"];
    if (flight.passengerCount > 150) {
      interventions.push("deep_cleaning");
    }
    if (flight.route.includes("international")) {
      interventions.push("security_check");
    }
    return interventions;
  }

  private estimateCleaningDuration(flight: FlightIntegrationData): number {
    let baseDuration = 60; // 1 hour
    if (flight.passengerCount > 150) baseDuration += 30;
    if (flight.route.includes("LIS")) baseDuration += 15; // International flights
    return baseDuration;
  }

  private analyzeWorkloadBalance(): { imbalance: number } {
    // Mock workload analysis
    return { imbalance: Math.random() * 50 };
  }

  private groupTasksByEmployee(tasks: ScheduledTask[]): Record<string, ScheduledTask[]> {
    return tasks.reduce((groups, task) => {
      task.assignedEmployees.forEach(employeeId => {
        if (!groups[employeeId]) {
          groups[employeeId] = [];
        }
        groups[employeeId].push(task);
      });
      return groups;
    }, {} as Record<string, ScheduledTask[]>);
  }

  private getLocationCoordinates(): Record<string, { lat: number; lng: number }> {
    return {
      "gate_a": { lat: 38.7742, lng: -9.1342 },
      "gate_b": { lat: 38.7745, lng: -9.1345 },
      "hangar_1": { lat: 38.7750, lng: -9.1350 },
      "maintenance": { lat: 38.7755, lng: -9.1355 },
    };
  }

  private calculateTravelMatrix(locations: string[], coordinates: Record<string, any>): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    locations.forEach(from => {
      matrix[from] = {};
      locations.forEach(to => {
        if (from === to) {
          matrix[from][to] = 0;
        } else {
          const distance = this.calculateDistance(coordinates[from], coordinates[to]);
          matrix[from][to] = Math.round(distance * 2); // 2 minutes per km
        }
      });
    });
    
    return matrix;
  }

  private calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private solveTSP(tasks: ScheduledTask[], travelMatrix: any, config: any): ScheduledTask[] {
    // Simplified greedy TSP solution
    if (tasks.length <= 1) return tasks;
    
    const visited = new Set<string>();
    const route: ScheduledTask[] = [];
    let current = tasks[0];
    route.push(current);
    visited.add(current.location);
    
    while (route.length < tasks.length) {
      let nextTask: ScheduledTask | null = null;
      let minTime = Infinity;
      
      for (const task of tasks) {
        if (!visited.has(task.location)) {
          const travelTime = travelMatrix[current.location][task.location];
          if (travelTime < minTime) {
            minTime = travelTime;
            nextTask = task;
          }
        }
      }
      
      if (nextTask) {
        route.push(nextTask);
        visited.add(nextTask.location);
        current = nextTask;
      } else {
        break;
      }
    }
    
    return route;
  }

  private calculateRouteEfficiency(totalTravelTime: number, taskCount: number): number {
    const maxExpectedTravel = taskCount * 30; // 30 min per task maximum
    return Math.max(0, 100 - (totalTravelTime / maxExpectedTravel) * 100);
  }

  private async storeGeneratedTasks(tasks: SchedulingTask[]): Promise<void> {
    const stored = localStorage.getItem("aviation_auto_generated_tasks");
    const existingTasks = stored ? JSON.parse(stored) : [];
    
    existingTasks.push(...tasks);
    localStorage.setItem("aviation_auto_generated_tasks", JSON.stringify(existingTasks));
  }
}

export const smartAutomationService = new SmartAutomationService();
