import { advancedFeaturesService, AnalyticsConfig } from "./advanced-features-service";

export interface MetricData {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend: "up" | "down" | "stable";
  category: "performance" | "efficiency" | "quality" | "compliance";
  timestamp: string;
}

export interface PerformanceMetric {
  employeeId: string;
  employeeName: string;
  completedForms: number;
  averageTime: number; // in minutes
  qualityScore: number; // 0-100
  efficiency: number; // 0-100
  period: string;
  trends: {
    completionRate: "up" | "down" | "stable";
    qualityTrend: "up" | "down" | "stable";
    efficiencyTrend: "up" | "down" | "stable";
  };
}

export interface TeamMetric {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalCompletedForms: number;
  averageQualityScore: number;
  averageEfficiency: number;
  slaCompliance: number;
  period: string;
}

export interface LocationMetric {
  locationId: string;
  locationName: string;
  totalActivities: number;
  averageCompletionTime: number;
  utilizationRate: number;
  maintenanceAlerts: number;
  period: string;
}

export interface ComplianceAlert {
  id: string;
  type: "SLA_BREACH" | "QUALITY_THRESHOLD" | "RESPONSE_TIME" | "COMPLETION_OVERDUE";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  entityId: string;
  entityType: "employee" | "form" | "location" | "aircraft";
  threshold: number;
  actualValue: number;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  format: "PDF" | "CSV" | "EXCEL" | "JSON";
  sections: string[];
  filters: Record<string, any>;
  recipients: string[];
  schedule?: {
    enabled: boolean;
    frequency: string; // cron expression
    timezone: string;
  };
  lastGenerated?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AnalyticsService {
  private readonly metricsStorageKey = "aviation_analytics_metrics";
  private readonly reportsStorageKey = "aviation_reports";
  private readonly alertsStorageKey = "aviation_compliance_alerts";

  async isAnalyticsEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAnalyticsFeatureEnabled('executiveDashboard');
  }

  async isPerformanceTrackingEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAnalyticsFeatureEnabled('performanceTracking');
  }

  async isAutomaticReportsEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAnalyticsFeatureEnabled('automaticReports');
  }

  async isSLAAlertsEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isAnalyticsFeatureEnabled('slaAlerts');
  }

  // Metrics Collection and Calculation
  async calculateExecutiveMetrics(): Promise<MetricData[]> {
    const forms = this.getStoredForms();
    const employees = this.getStoredEmployees();
    const aircraft = this.getStoredAircraft();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate completion rate
    const totalForms = forms.length;
    const completedForms = forms.filter(f => f.status === 'completed').length;
    const completionRate = totalForms > 0 ? (completedForms / totalForms) * 100 : 0;

    // Calculate average completion time
    const completedFormsWithTime = forms.filter(f => 
      f.status === 'completed' && f.completedAt && f.createdAt
    );
    const totalCompletionTime = completedFormsWithTime.reduce((acc, form) => {
      const start = new Date(form.createdAt).getTime();
      const end = new Date(form.completedAt).getTime();
      return acc + (end - start);
    }, 0);
    const averageCompletionTime = completedFormsWithTime.length > 0 
      ? totalCompletionTime / completedFormsWithTime.length / (1000 * 60) // minutes
      : 0;

    // Calculate quality score (mock implementation)
    const qualityScore = this.calculateQualityScore(forms);

    // Calculate efficiency
    const efficiency = this.calculateEfficiency(forms, employees);

    // Calculate SLA compliance
    const slaCompliance = this.calculateSLACompliance(forms);

    const metrics: MetricData[] = [
      {
        id: "completion_rate",
        name: "Taxa de Conclusão",
        value: completionRate,
        unit: "%",
        trend: "up",
        category: "performance",
        timestamp: now.toISOString(),
      },
      {
        id: "avg_completion_time",
        name: "Tempo Médio de Conclusão",
        value: averageCompletionTime,
        unit: "min",
        trend: "down",
        category: "efficiency",
        timestamp: now.toISOString(),
      },
      {
        id: "quality_score",
        name: "Pontuação de Qualidade",
        value: qualityScore,
        unit: "%",
        trend: "stable",
        category: "quality",
        timestamp: now.toISOString(),
      },
      {
        id: "efficiency",
        name: "Eficiência Geral",
        value: efficiency,
        unit: "%",
        trend: "up",
        category: "efficiency",
        timestamp: now.toISOString(),
      },
      {
        id: "sla_compliance",
        name: "Conformidade SLA",
        value: slaCompliance,
        unit: "%",
        trend: "stable",
        category: "compliance",
        timestamp: now.toISOString(),
      },
      {
        id: "active_forms",
        name: "Formulários Ativos",
        value: forms.filter(f => f.status !== 'completed').length,
        unit: "forms",
        trend: "stable",
        category: "performance",
        timestamp: now.toISOString(),
      },
      {
        id: "total_employees",
        name: "Funcionários Ativos",
        value: employees.filter(e => e.status === 'active').length,
        unit: "people",
        trend: "stable",
        category: "performance",
        timestamp: now.toISOString(),
      },
      {
        id: "total_aircraft",
        name: "Aeronaves Ativas",
        value: aircraft.filter(a => a.status === 'active').length,
        unit: "aircraft",
        trend: "stable",
        category: "performance",
        timestamp: now.toISOString(),
      },
    ];

    // Store metrics
    this.storeMetrics(metrics);
    return metrics;
  }

  async calculateEmployeePerformance(): Promise<PerformanceMetric[]> {
    const forms = this.getStoredForms();
    const employees = this.getStoredEmployees();

    const employeeMetrics: PerformanceMetric[] = employees
      .filter(emp => emp.status === 'active')
      .map(employee => {
        const employeeForms = forms.filter(form => 
          form.employeeSignature?.employeeId === employee.id
        );

        const completedForms = employeeForms.filter(f => f.status === 'completed');
        
        // Calculate average completion time
        const completionTimes = completedForms
          .filter(f => f.completedAt && f.createdAt)
          .map(f => {
            const start = new Date(f.createdAt).getTime();
            const end = new Date(f.completedAt).getTime();
            return (end - start) / (1000 * 60); // minutes
          });

        const averageTime = completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

        // Mock quality score calculation
        const qualityScore = Math.min(100, Math.max(0, 
          85 + Math.random() * 15 - (averageTime > 120 ? 10 : 0)
        ));

        // Mock efficiency calculation
        const efficiency = Math.min(100, Math.max(0,
          80 + Math.random() * 20 - (averageTime > 90 ? 15 : 0)
        ));

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          completedForms: completedForms.length,
          averageTime,
          qualityScore,
          efficiency,
          period: "30 days",
          trends: {
            completionRate: Math.random() > 0.5 ? "up" : "stable",
            qualityTrend: Math.random() > 0.5 ? "up" : "stable",
            efficiencyTrend: Math.random() > 0.5 ? "up" : "stable",
          },
        };
      });

    return employeeMetrics;
  }

  async calculateTeamMetrics(): Promise<TeamMetric[]> {
    const employees = this.getStoredEmployees();
    const forms = this.getStoredForms();

    // Group employees by team/location
    const teams = this.groupEmployeesByTeam(employees);

    const teamMetrics: TeamMetric[] = Object.entries(teams).map(([teamName, teamEmployees]) => {
      const teamEmployeeIds = teamEmployees.map(emp => emp.id);
      const teamForms = forms.filter(form =>
        teamEmployeeIds.includes(form.employeeSignature?.employeeId || "")
      );

      const completedForms = teamForms.filter(f => f.status === 'completed');
      const totalCompletedForms = completedForms.length;

      // Calculate average quality score for the team
      const averageQualityScore = 85 + Math.random() * 15;

      // Calculate average efficiency for the team
      const averageEfficiency = 80 + Math.random() * 20;

      // Calculate SLA compliance
      const slaCompliance = this.calculateSLACompliance(teamForms);

      return {
        teamId: teamName.toLowerCase().replace(/\s+/g, '-'),
        teamName,
        memberCount: teamEmployees.length,
        totalCompletedForms,
        averageQualityScore,
        averageEfficiency,
        slaCompliance,
        period: "30 days",
      };
    });

    return teamMetrics;
  }

  async calculateLocationMetrics(): Promise<LocationMetric[]> {
    const forms = this.getStoredForms();
    const locations = this.getStoredLocations();

    const locationMetrics: LocationMetric[] = locations.map(location => {
      const locationForms = forms.filter(form => 
        form.location === location.name
      );

      const completedForms = locationForms.filter(f => f.status === 'completed');
      
      // Calculate average completion time for this location
      const completionTimes = completedForms
        .filter(f => f.completedAt && f.createdAt)
        .map(f => {
          const start = new Date(f.createdAt).getTime();
          const end = new Date(f.completedAt).getTime();
          return (end - start) / (1000 * 60); // minutes
        });

      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

      // Mock utilization rate
      const utilizationRate = Math.min(100, Math.max(0, 60 + Math.random() * 40));

      // Mock maintenance alerts
      const maintenanceAlerts = Math.floor(Math.random() * 5);

      return {
        locationId: location.id,
        locationName: location.name,
        totalActivities: locationForms.length,
        averageCompletionTime,
        utilizationRate,
        maintenanceAlerts,
        period: "30 days",
      };
    });

    return locationMetrics;
  }

  // Compliance and Alerting
  async generateComplianceAlerts(): Promise<ComplianceAlert[]> {
    const config = await advancedFeaturesService.getConfigurationById('analytics-reports');
    if (!config?.isActive) return [];

    const analyticsConfig = config.config as AnalyticsConfig;
    if (!analyticsConfig.slaAlerts.enabled) return [];

    const alerts: ComplianceAlert[] = [];
    const forms = this.getStoredForms();
    const thresholds = analyticsConfig.slaAlerts.thresholds;

    // Check SLA breaches
    forms.forEach(form => {
      if (form.status === 'completed' && form.createdAt && form.completedAt) {
        const completionTime = (new Date(form.completedAt).getTime() - new Date(form.createdAt).getTime()) / (1000 * 60 * 60); // hours
        
        if (completionTime > thresholds.response) {
          alerts.push({
            id: crypto.randomUUID(),
            type: "RESPONSE_TIME",
            severity: completionTime > thresholds.response * 2 ? "critical" : "high",
            title: "Tempo de Resposta Excedido",
            description: `Formulário ${form.code} levou ${completionTime.toFixed(1)}h para ser concluído (limite: ${thresholds.response}h)`,
            entityId: form.id,
            entityType: "form",
            threshold: thresholds.response,
            actualValue: completionTime,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          });
        }
      }
    });

    // Check quality thresholds
    const employeePerformance = await this.calculateEmployeePerformance();
    employeePerformance.forEach(perf => {
      if (perf.qualityScore < thresholds.quality) {
        alerts.push({
          id: crypto.randomUUID(),
          type: "QUALITY_THRESHOLD",
          severity: perf.qualityScore < thresholds.quality * 0.8 ? "high" : "medium",
          title: "Qualidade Abaixo do Limite",
          description: `${perf.employeeName} tem pontuação de qualidade de ${perf.qualityScore.toFixed(1)}% (limite: ${thresholds.quality}%)`,
          entityId: perf.employeeId,
          entityType: "employee",
          threshold: thresholds.quality,
          actualValue: perf.qualityScore,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      }
    });

    // Store alerts
    this.storeAlerts(alerts);
    return alerts;
  }

  // Report Generation
  async generateReport(templateId: string, customFilters?: Record<string, any>): Promise<{
    id: string;
    templateId: string;
    title: string;
    generatedAt: string;
    format: string;
    data: any;
    downloadUrl?: string;
  }> {
    const template = await this.getReportTemplate(templateId);
    if (!template) {
      throw new Error(`Report template ${templateId} not found`);
    }

    const reportData = await this.collectReportData(template, customFilters);
    
    const report = {
      id: crypto.randomUUID(),
      templateId,
      title: template.name,
      generatedAt: new Date().toISOString(),
      format: template.format,
      data: reportData,
    };

    // Store report metadata
    this.storeGeneratedReport(report);

    return report;
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    const stored = localStorage.getItem(this.reportsStorageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default templates
    const defaultTemplates: ReportTemplate[] = [
      {
        id: "daily-summary",
        name: "Relatório Diário",
        description: "Resumo das atividades do dia",
        type: "daily",
        format: "PDF",
        sections: ["metrics", "completed_forms", "alerts"],
        filters: { period: "today" },
        recipients: [],
        schedule: {
          enabled: false,
          frequency: "0 8 * * *", // 8 AM every day
          timezone: "America/Sao_Paulo",
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "monthly-performance",
        name: "Relatório Mensal de Performance",
        description: "Análise de performance mensal",
        type: "monthly",
        format: "PDF",
        sections: ["metrics", "employee_performance", "team_metrics", "trends"],
        filters: { period: "monthly" },
        recipients: [],
        schedule: {
          enabled: false,
          frequency: "0 9 1 * *", // 9 AM on first day of month
          timezone: "America/Sao_Paulo",
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(this.reportsStorageKey, JSON.stringify(defaultTemplates));
    return defaultTemplates;
  }

  async createReportTemplate(template: Omit<ReportTemplate, "id" | "createdAt" | "updatedAt">): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const templates = await this.getReportTemplates();
    templates.push(newTemplate);
    localStorage.setItem(this.reportsStorageKey, JSON.stringify(templates));

    return newTemplate;
  }

  async updateReportTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const templates = await this.getReportTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error(`Report template ${id} not found`);
    }

    const updatedTemplate = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    templates[index] = updatedTemplate;
    localStorage.setItem(this.reportsStorageKey, JSON.stringify(templates));

    return updatedTemplate;
  }

  async deleteReportTemplate(id: string): Promise<boolean> {
    const templates = await this.getReportTemplates();
    const filteredTemplates = templates.filter(t => t.id !== id);
    
    if (filteredTemplates.length === templates.length) {
      throw new Error(`Report template ${id} not found`);
    }

    localStorage.setItem(this.reportsStorageKey, JSON.stringify(filteredTemplates));
    return true;
  }

  // Helper methods
  private getStoredForms(): any[] {
    const stored = localStorage.getItem("cleaningForms");
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredEmployees(): any[] {
    const stored = localStorage.getItem("aviation_employees");
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredAircraft(): any[] {
    const stored = localStorage.getItem("aviation_aircraft");
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredLocations(): any[] {
    // Mock locations for now
    return [
      { id: "hangar-a", name: "Hangar A" },
      { id: "hangar-b", name: "Hangar B" },
      { id: "pista-1", name: "Pista 1" },
      { id: "pista-2", name: "Pista 2" },
    ];
  }

  private calculateQualityScore(forms: any[]): number {
    const completedForms = forms.filter(f => f.status === 'completed');
    if (completedForms.length === 0) return 0;

    // Mock quality calculation based on various factors
    const baseScore = 85;
    const randomVariation = Math.random() * 15; // 0-15
    return Math.min(100, baseScore + randomVariation);
  }

  private calculateEfficiency(forms: any[], employees: any[]): number {
    const completedForms = forms.filter(f => f.status === 'completed');
    const activeEmployees = employees.filter(e => e.status === 'active');
    
    if (activeEmployees.length === 0) return 0;

    const formsPerEmployee = completedForms.length / activeEmployees.length;
    const expectedFormsPerEmployee = 2; // Expected forms per employee in the period
    
    return Math.min(100, (formsPerEmployee / expectedFormsPerEmployee) * 100);
  }

  private calculateSLACompliance(forms: any[]): number {
    const completedForms = forms.filter(f => f.status === 'completed' && f.createdAt && f.completedAt);
    if (completedForms.length === 0) return 100;

    const slaThreshold = 4 * 60; // 4 hours in minutes
    const compliantForms = completedForms.filter(form => {
      const completionTime = (new Date(form.completedAt).getTime() - new Date(form.createdAt).getTime()) / (1000 * 60);
      return completionTime <= slaThreshold;
    });

    return (compliantForms.length / completedForms.length) * 100;
  }

  private groupEmployeesByTeam(employees: any[]): Record<string, any[]> {
    return employees.reduce((teams, employee) => {
      const team = employee.team || employee.location || "Equipe Geral";
      if (!teams[team]) {
        teams[team] = [];
      }
      teams[team].push(employee);
      return teams;
    }, {} as Record<string, any[]>);
  }

  private storeMetrics(metrics: MetricData[]): void {
    const stored = localStorage.getItem(this.metricsStorageKey);
    const allMetrics = stored ? JSON.parse(stored) : [];
    
    // Add new metrics and keep only last 100 entries per metric
    metrics.forEach(metric => {
      const existingIndex = allMetrics.findIndex((m: MetricData) => m.id === metric.id);
      if (existingIndex >= 0) {
        allMetrics[existingIndex] = metric;
      } else {
        allMetrics.push(metric);
      }
    });

    localStorage.setItem(this.metricsStorageKey, JSON.stringify(allMetrics));
  }

  private storeAlerts(alerts: ComplianceAlert[]): void {
    const stored = localStorage.getItem(this.alertsStorageKey);
    const existingAlerts = stored ? JSON.parse(stored) : [];
    
    const updatedAlerts = [...existingAlerts, ...alerts];
    localStorage.setItem(this.alertsStorageKey, JSON.stringify(updatedAlerts));
  }

  private async getReportTemplate(id: string): Promise<ReportTemplate | null> {
    const templates = await this.getReportTemplates();
    return templates.find(t => t.id === id) || null;
  }

  private async collectReportData(template: ReportTemplate, customFilters?: Record<string, any>): Promise<any> {
    const data: any = {
      template: template.name,
      generatedAt: new Date().toISOString(),
      filters: { ...template.filters, ...customFilters },
      sections: {},
    };

    if (template.sections.includes("metrics")) {
      data.sections.metrics = await this.calculateExecutiveMetrics();
    }

    if (template.sections.includes("employee_performance")) {
      data.sections.employeePerformance = await this.calculateEmployeePerformance();
    }

    if (template.sections.includes("team_metrics")) {
      data.sections.teamMetrics = await this.calculateTeamMetrics();
    }

    if (template.sections.includes("location_metrics")) {
      data.sections.locationMetrics = await this.calculateLocationMetrics();
    }

    if (template.sections.includes("alerts")) {
      data.sections.alerts = await this.generateComplianceAlerts();
    }

    if (template.sections.includes("completed_forms")) {
      const forms = this.getStoredForms();
      data.sections.completedForms = forms.filter(f => f.status === 'completed');
    }

    return data;
  }

  private storeGeneratedReport(report: any): void {
    const reportsKey = "aviation_generated_reports";
    const stored = localStorage.getItem(reportsKey);
    const reports = stored ? JSON.parse(stored) : [];
    
    reports.push(report);
    // Keep only last 50 reports
    if (reports.length > 50) {
      reports.splice(0, reports.length - 50);
    }
    
    localStorage.setItem(reportsKey, JSON.stringify(reports));
  }
}

export const analyticsService = new AnalyticsService();
