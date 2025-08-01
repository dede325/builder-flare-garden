import { advancedFeaturesService, AdvancedSecurityConfig } from "./advanced-features-service";

export interface TwoFactorAuthConfig {
  userId: string;
  methods: ("SMS" | "EMAIL" | "AUTHENTICATOR" | "BIOMETRIC")[];
  backupCodes: string[];
  isEnabled: boolean;
  lastUsed?: string;
  setupAt: string;
}

export interface SSOConfiguration {
  provider: "SAML" | "OAuth2" | "OpenID";
  endpoint: string;
  clientId: string;
  clientSecret?: string;
  domain: string;
  metadata?: any;
  isActive: boolean;
  lastSync?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "authentication" | "authorization" | "data_access" | "data_modification" | "system" | "security";
  success: boolean;
  blockchainHash?: string;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: "failed_login" | "suspicious_activity" | "unauthorized_access" | "data_breach" | "policy_violation";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  userId?: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  actions: SecurityAction[];
}

export interface SecurityAction {
  action: "block_user" | "require_2fa" | "force_logout" | "alert_admin" | "log_event";
  timestamp: string;
  details: Record<string, any>;
  executedBy: "system" | "admin";
}

export interface BackupConfig {
  id: string;
  name: string;
  frequency: "HOURLY" | "DAILY" | "WEEKLY";
  regions: string[];
  encryption: boolean;
  verification: boolean;
  retention: number; // days
  lastBackup?: string;
  nextBackup?: string;
  status: "active" | "paused" | "error";
  isActive: boolean;
}

export interface BackupEntry {
  id: string;
  configId: string;
  timestamp: string;
  size: number; // bytes
  region: string;
  checksum: string;
  encrypted: boolean;
  verified: boolean;
  metadata: Record<string, any>;
  status: "in_progress" | "completed" | "failed" | "corrupted";
  error?: string;
}

class AdvancedSecurityService {
  private readonly auditLogKey = "aviation_audit_logs";
  private readonly securityEventsKey = "aviation_security_events";
  private readonly twoFactorKey = "aviation_2fa_configs";
  private readonly ssoConfigKey = "aviation_sso_config";
  private readonly backupConfigKey = "aviation_backup_configs";
  private readonly backupEntriesKey = "aviation_backup_entries";
  private readonly sessionKey = "aviation_user_session";

  // Two-Factor Authentication
  async isTwoFactorEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isSecurityFeatureEnabled('twoFactorAuth');
  }

  async setupTwoFactor(
    userId: string,
    methods: ("SMS" | "EMAIL" | "AUTHENTICATOR" | "BIOMETRIC")[]
  ): Promise<{
    qrCode?: string;
    backupCodes: string[];
    secret?: string;
  }> {
    const config = await this.getSecurityConfig();
    if (!config?.twoFactorAuth.enabled) {
      throw new Error('Two-factor authentication is not enabled');
    }

    const backupCodes = this.generateBackupCodes();
    const secret = this.generateTOTPSecret();
    const qrCode = this.generateQRCode(userId, secret);

    const twoFactorConfig: TwoFactorAuthConfig = {
      userId,
      methods,
      backupCodes,
      isEnabled: true,
      setupAt: new Date().toISOString(),
    };

    this.storeTwoFactorConfig(twoFactorConfig);

    await this.logAuditEvent({
      userId,
      action: "setup_2fa",
      resource: "authentication",
      details: { methods },
      severity: "medium",
      category: "security",
      success: true,
    });

    return {
      qrCode: methods.includes("AUTHENTICATOR") ? qrCode : undefined,
      backupCodes,
      secret: methods.includes("AUTHENTICATOR") ? secret : undefined,
    };
  }

  async verifyTwoFactor(
    userId: string,
    code: string,
    method: "SMS" | "EMAIL" | "AUTHENTICATOR" | "BIOMETRIC" | "BACKUP"
  ): Promise<boolean> {
    const config = this.getTwoFactorConfig(userId);
    if (!config?.isEnabled) {
      return false;
    }

    let isValid = false;

    switch (method) {
      case "AUTHENTICATOR":
        isValid = this.verifyTOTP(code);
        break;
      case "BACKUP":
        isValid = config.backupCodes.includes(code);
        if (isValid) {
          // Remove used backup code
          config.backupCodes = config.backupCodes.filter(c => c !== code);
          this.storeTwoFactorConfig(config);
        }
        break;
      case "SMS":
      case "EMAIL":
        isValid = this.verifyOTPCode(code, method);
        break;
      case "BIOMETRIC":
        isValid = await this.verifyBiometric(userId);
        break;
    }

    if (isValid) {
      config.lastUsed = new Date().toISOString();
      this.storeTwoFactorConfig(config);
    }

    await this.logAuditEvent({
      userId,
      action: "verify_2fa",
      resource: "authentication",
      details: { method, success: isValid },
      severity: isValid ? "low" : "high",
      category: "authentication",
      success: isValid,
    });

    if (!isValid) {
      await this.createSecurityEvent({
        type: "failed_login",
        severity: "medium",
        userId,
        description: "Failed 2FA verification",
        details: { method },
      });
    }

    return isValid;
  }

  async disableTwoFactor(userId: string, adminUserId?: string): Promise<boolean> {
    const config = this.getTwoFactorConfig(userId);
    if (!config) return false;

    config.isEnabled = false;
    this.storeTwoFactorConfig(config);

    await this.logAuditEvent({
      userId: adminUserId || userId,
      action: "disable_2fa",
      resource: "authentication",
      resourceId: userId,
      details: { targetUser: userId },
      severity: "high",
      category: "security",
      success: true,
    });

    return true;
  }

  // Single Sign-On
  async isSSOEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isSecurityFeatureEnabled('singleSignOn');
  }

  async configurSSO(config: Omit<SSOConfiguration, "isActive" | "lastSync">): Promise<SSOConfiguration> {
    const ssoConfig: SSOConfiguration = {
      ...config,
      isActive: true,
      lastSync: new Date().toISOString(),
    };

    localStorage.setItem(this.ssoConfigKey, JSON.stringify(ssoConfig));

    await this.logAuditEvent({
      userId: "system",
      action: "configure_sso",
      resource: "authentication",
      details: { provider: config.provider, domain: config.domain },
      severity: "high",
      category: "system",
      success: true,
    });

    return ssoConfig;
  }

  async authenticateSSO(token: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    const ssoConfig = this.getSSOConfig();
    if (!ssoConfig?.isActive) {
      return { success: false, error: "SSO not configured" };
    }

    try {
      // This would integrate with actual SSO provider
      const userInfo = await this.validateSSOToken(token, ssoConfig);
      
      if (userInfo) {
        await this.logAuditEvent({
          userId: userInfo.id,
          action: "sso_login",
          resource: "authentication",
          details: { provider: ssoConfig.provider },
          severity: "low",
          category: "authentication",
          success: true,
        });

        return { success: true, user: userInfo };
      } else {
        await this.createSecurityEvent({
          type: "failed_login",
          severity: "medium",
          description: "SSO authentication failed",
          details: { provider: ssoConfig.provider, token: token.substring(0, 10) + "..." },
        });

        return { success: false, error: "Invalid token" };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Audit Logging
  async isAuditLoggingEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isSecurityFeatureEnabled('auditLogging');
  }

  async logAuditEvent(event: Omit<AuditLogEntry, "id" | "timestamp" | "ipAddress" | "userAgent" | "sessionId" | "blockchainHash">): Promise<void> {
    const config = await this.getSecurityConfig();
    if (!config?.auditLogging.enabled) return;

    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      sessionId: this.getCurrentSessionId(),
      blockchainHash: config.auditLogging.blockchain ? this.generateBlockchainHash() : undefined,
      ...event,
    };

    this.storeAuditLog(auditEntry);

    // Create blockchain entry if enabled
    if (config.auditLogging.blockchain) {
      await this.addToBlockchain(auditEntry);
    }
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const logs = this.getStoredAuditLogs();
    
    if (!filters) return logs;

    return logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.resource && log.resource !== filters.resource) return false;
      if (filters.severity && log.severity !== filters.severity) return false;
      if (filters.startDate && log.timestamp < filters.startDate) return false;
      if (filters.endDate && log.timestamp > filters.endDate) return false;
      return true;
    }).slice(0, filters.limit || 100);
  }

  async exportAuditLogs(format: "JSON" | "CSV" = "JSON"): Promise<string> {
    const logs = this.getStoredAuditLogs();
    
    if (format === "CSV") {
      const headers = ["timestamp", "userId", "action", "resource", "severity", "success", "ipAddress"];
      const csvData = [
        headers.join(","),
        ...logs.map(log => [
          log.timestamp,
          log.userId,
          log.action,
          log.resource,
          log.severity,
          log.success.toString(),
          log.ipAddress,
        ].join(","))
      ].join("\n");
      
      return csvData;
    }

    return JSON.stringify(logs, null, 2);
  }

  // Security Event Management
  async createSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp" | "ipAddress" | "resolved" | "actions">): Promise<SecurityEvent> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ipAddress: this.getCurrentIPAddress(),
      resolved: false,
      actions: [],
      ...event,
    };

    this.storeSecurityEvent(securityEvent);

    // Auto-response based on severity
    await this.handleSecurityEventResponse(securityEvent);

    await this.logAuditEvent({
      userId: event.userId || "system",
      action: "security_event_created",
      resource: "security",
      details: { eventType: event.type, severity: event.severity },
      severity: event.severity,
      category: "security",
      success: true,
    });

    return securityEvent;
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    const events = this.getStoredSecurityEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error("Security event not found");
    }

    events[eventIndex].resolved = true;
    events[eventIndex].resolvedAt = new Date().toISOString();
    events[eventIndex].resolvedBy = resolvedBy;

    this.storeSecurityEvents(events);

    await this.logAuditEvent({
      userId: resolvedBy,
      action: "resolve_security_event",
      resource: "security",
      resourceId: eventId,
      details: { eventType: events[eventIndex].type },
      severity: "medium",
      category: "security",
      success: true,
    });
  }

  // Backup Management
  async isBackupEnabled(): Promise<boolean> {
    return await advancedFeaturesService.isSecurityFeatureEnabled('backupStrategy');
  }

  async createBackupConfig(config: Omit<BackupConfig, "id" | "lastBackup" | "nextBackup" | "status">): Promise<BackupConfig> {
    const backupConfig: BackupConfig = {
      id: crypto.randomUUID(),
      lastBackup: undefined,
      nextBackup: this.calculateNextBackup(config.frequency),
      status: "active",
      ...config,
    };

    this.storeBackupConfig(backupConfig);
    
    // Schedule first backup
    await this.scheduleBackup(backupConfig.id);

    await this.logAuditEvent({
      userId: "system",
      action: "create_backup_config",
      resource: "backup",
      details: { frequency: config.frequency, regions: config.regions },
      severity: "medium",
      category: "system",
      success: true,
    });

    return backupConfig;
  }

  async executeBackup(configId: string): Promise<BackupEntry> {
    const config = this.getBackupConfig(configId);
    if (!config || !config.isActive) {
      throw new Error("Backup configuration not found or inactive");
    }

    const backupEntry: BackupEntry = {
      id: crypto.randomUUID(),
      configId,
      timestamp: new Date().toISOString(),
      size: 0,
      region: config.regions[0] || "default",
      checksum: "",
      encrypted: config.encryption,
      verified: false,
      metadata: {},
      status: "in_progress",
    };

    this.storeBackupEntry(backupEntry);

    try {
      // Simulate backup process
      const data = await this.gatherBackupData();
      const compressedData = this.compressData(data);
      const encryptedData = config.encryption ? this.encryptData(compressedData) : compressedData;
      const checksum = this.generateChecksum(encryptedData);

      // Upload to backup regions
      for (const region of config.regions) {
        await this.uploadToRegion(encryptedData, region);
      }

      // Update backup entry
      backupEntry.size = encryptedData.length;
      backupEntry.checksum = checksum;
      backupEntry.status = "completed";

      if (config.verification) {
        backupEntry.verified = await this.verifyBackup(backupEntry);
      }

      this.storeBackupEntry(backupEntry);

      // Update config
      config.lastBackup = new Date().toISOString();
      config.nextBackup = this.calculateNextBackup(config.frequency);
      this.storeBackupConfig(config);

      await this.logAuditEvent({
        userId: "system",
        action: "execute_backup",
        resource: "backup",
        resourceId: configId,
        details: { size: backupEntry.size, regions: config.regions },
        severity: "low",
        category: "system",
        success: true,
      });

      return backupEntry;
    } catch (error) {
      backupEntry.status = "failed";
      backupEntry.error = (error as Error).message;
      this.storeBackupEntry(backupEntry);

      await this.createSecurityEvent({
        type: "data_breach", // Using this as closest match for backup failure
        severity: "high",
        description: "Backup execution failed",
        details: { configId, error: (error as Error).message },
      });

      throw error;
    }
  }

  async restoreFromBackup(backupId: string): Promise<boolean> {
    const backup = this.getBackupEntry(backupId);
    if (!backup || backup.status !== "completed") {
      throw new Error("Backup not found or not completed");
    }

    try {
      // Verify backup integrity
      if (!await this.verifyBackup(backup)) {
        throw new Error("Backup integrity check failed");
      }

      // Download and restore data
      const encryptedData = await this.downloadFromRegion(backup.region, backupId);
      const data = backup.encrypted ? this.decryptData(encryptedData) : encryptedData;
      const decompressedData = this.decompressData(data);
      
      await this.restoreData(decompressedData);

      await this.logAuditEvent({
        userId: "system",
        action: "restore_backup",
        resource: "backup",
        resourceId: backupId,
        details: { size: backup.size, region: backup.region },
        severity: "high",
        category: "system",
        success: true,
      });

      return true;
    } catch (error) {
      await this.logAuditEvent({
        userId: "system",
        action: "restore_backup",
        resource: "backup",
        resourceId: backupId,
        details: { error: (error as Error).message },
        severity: "critical",
        category: "system",
        success: false,
      });

      throw error;
    }
  }

  // Session Management
  async createSecureSession(userId: string, ipAddress: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId,
      ipAddress,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
    };

    localStorage.setItem(`${this.sessionKey}_${sessionId}`, JSON.stringify(session));

    await this.logAuditEvent({
      userId,
      action: "create_session",
      resource: "authentication",
      details: { sessionId },
      severity: "low",
      category: "authentication",
      success: true,
    });

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session || !session.isActive) return false;

    const config = await this.getSecurityConfig();
    const sessionTimeout = config?.twoFactorAuth.sessionTimeout || 60; // minutes

    const lastActivity = new Date(session.lastActivity);
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    if (minutesSinceActivity > sessionTimeout) {
      await this.invalidateSession(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = now.toISOString();
    localStorage.setItem(`${this.sessionKey}_${sessionId}`, JSON.stringify(session));

    return true;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (session) {
      session.isActive = false;
      localStorage.setItem(`${this.sessionKey}_${sessionId}`, JSON.stringify(session));

      await this.logAuditEvent({
        userId: session.userId,
        action: "invalidate_session",
        resource: "authentication",
        details: { sessionId },
        severity: "low",
        category: "authentication",
        success: true,
      });
    }
  }

  // Helper Methods
  private async getSecurityConfig(): Promise<AdvancedSecurityConfig | null> {
    const config = await advancedFeaturesService.getConfigurationById('advanced-security');
    return config?.isActive ? (config.config as AdvancedSecurityConfig) : null;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return Array.from({ length: 32 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private generateQRCode(userId: string, secret: string): string {
    const issuer = "Aviation Cleaning System";
    const otpauth = `otpauth://totp/${issuer}:${userId}?secret=${secret}&issuer=${issuer}`;
    // In a real implementation, this would generate an actual QR code
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-size="8">${otpauth}</text></svg>`;
  }

  private verifyTOTP(code: string): boolean {
    // In a real implementation, this would verify against the actual TOTP algorithm
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  private verifyOTPCode(code: string, method: "SMS" | "EMAIL"): boolean {
    // Mock verification - in real implementation, this would verify against sent code
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  private async verifyBiometric(userId: string): Promise<boolean> {
    // This would integrate with the biometric authentication service
    return Math.random() > 0.1; // 90% success rate for demo
  }

  private getSSOConfig(): SSOConfiguration | null {
    const stored = localStorage.getItem(this.ssoConfigKey);
    return stored ? JSON.parse(stored) : null;
  }

  private async validateSSOToken(token: string, config: SSOConfiguration): Promise<any | null> {
    // Mock SSO validation - real implementation would validate with provider
    if (token.startsWith("valid_")) {
      return {
        id: token.replace("valid_", ""),
        email: `${token.replace("valid_", "")}@company.com`,
        name: "SSO User",
      };
    }
    return null;
  }

  private getCurrentIPAddress(): string {
    // In a real implementation, this would get the actual IP
    return "127.0.0.1";
  }

  private getCurrentSessionId(): string {
    return crypto.randomUUID();
  }

  private generateBlockchainHash(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }

  private async addToBlockchain(entry: AuditLogEntry): Promise<void> {
    // Mock blockchain implementation
    console.log('Adding to blockchain:', entry.id);
  }

  private async handleSecurityEventResponse(event: SecurityEvent): Promise<void> {
    const actions: SecurityAction[] = [];

    switch (event.severity) {
      case "critical":
        actions.push({
          action: "alert_admin",
          timestamp: new Date().toISOString(),
          details: { message: "Critical security event detected" },
          executedBy: "system",
        });
        if (event.userId) {
          actions.push({
            action: "force_logout",
            timestamp: new Date().toISOString(),
            details: { userId: event.userId },
            executedBy: "system",
          });
        }
        break;
      case "high":
        if (event.userId) {
          actions.push({
            action: "require_2fa",
            timestamp: new Date().toISOString(),
            details: { userId: event.userId },
            executedBy: "system",
          });
        }
        break;
    }

    event.actions = actions;
    this.storeSecurityEvent(event);
  }

  private calculateNextBackup(frequency: "HOURLY" | "DAILY" | "WEEKLY"): string {
    const now = new Date();
    switch (frequency) {
      case "HOURLY":
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case "DAILY":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case "WEEKLY":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private async scheduleBackup(configId: string): Promise<void> {
    // Mock scheduling - real implementation would use actual scheduler
    console.log('Backup scheduled for config:', configId);
  }

  private async gatherBackupData(): Promise<string> {
    // Gather all application data for backup
    const data = {
      forms: localStorage.getItem("cleaningForms") || "[]",
      employees: localStorage.getItem("aviation_employees") || "[]",
      aircraft: localStorage.getItem("aviation_aircraft") || "[]",
      configurations: localStorage.getItem("aviation_advanced_features") || "[]",
      auditLogs: localStorage.getItem(this.auditLogKey) || "[]",
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(data);
  }

  private compressData(data: string): string {
    // Mock compression - real implementation would use actual compression
    return data;
  }

  private encryptData(data: string): string {
    // Mock encryption - real implementation would use actual encryption
    return btoa(data);
  }

  private decryptData(data: string): string {
    // Mock decryption
    return atob(data);
  }

  private decompressData(data: string): string {
    // Mock decompression
    return data;
  }

  private generateChecksum(data: string): string {
    // Simple checksum - real implementation would use proper hashing
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private async uploadToRegion(data: string, region: string): Promise<void> {
    // Mock upload - real implementation would upload to cloud storage
    console.log(`Uploading ${data.length} bytes to region ${region}`);
  }

  private async downloadFromRegion(region: string, backupId: string): Promise<string> {
    // Mock download - real implementation would download from cloud storage
    return "mock_backup_data";
  }

  private async verifyBackup(backup: BackupEntry): Promise<boolean> {
    // Mock verification - real implementation would verify checksum and integrity
    return Math.random() > 0.05; // 95% success rate
  }

  private async restoreData(data: string): Promise<void> {
    // Mock restoration - real implementation would restore data to application
    console.log('Restoring data:', data.substring(0, 100) + "...");
  }

  // Storage methods
  private storeTwoFactorConfig(config: TwoFactorAuthConfig): void {
    const stored = localStorage.getItem(this.twoFactorKey);
    const configs = stored ? JSON.parse(stored) : [];
    
    const existingIndex = configs.findIndex((c: TwoFactorAuthConfig) => c.userId === config.userId);
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    localStorage.setItem(this.twoFactorKey, JSON.stringify(configs));
  }

  private getTwoFactorConfig(userId: string): TwoFactorAuthConfig | null {
    const stored = localStorage.getItem(this.twoFactorKey);
    if (!stored) return null;
    
    const configs = JSON.parse(stored);
    return configs.find((c: TwoFactorAuthConfig) => c.userId === userId) || null;
  }

  private storeAuditLog(entry: AuditLogEntry): void {
    const stored = localStorage.getItem(this.auditLogKey);
    const logs = stored ? JSON.parse(stored) : [];
    
    logs.push(entry);
    
    // Keep only last 10000 entries
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    localStorage.setItem(this.auditLogKey, JSON.stringify(logs));
  }

  private getStoredAuditLogs(): AuditLogEntry[] {
    const stored = localStorage.getItem(this.auditLogKey);
    return stored ? JSON.parse(stored) : [];
  }

  private storeSecurityEvent(event: SecurityEvent): void {
    const stored = localStorage.getItem(this.securityEventsKey);
    const events = stored ? JSON.parse(stored) : [];
    
    events.push(event);
    localStorage.setItem(this.securityEventsKey, JSON.stringify(events));
  }

  private storeSecurityEvents(events: SecurityEvent[]): void {
    localStorage.setItem(this.securityEventsKey, JSON.stringify(events));
  }

  private getStoredSecurityEvents(): SecurityEvent[] {
    const stored = localStorage.getItem(this.securityEventsKey);
    return stored ? JSON.parse(stored) : [];
  }

  private storeBackupConfig(config: BackupConfig): void {
    const stored = localStorage.getItem(this.backupConfigKey);
    const configs = stored ? JSON.parse(stored) : [];
    
    const existingIndex = configs.findIndex((c: BackupConfig) => c.id === config.id);
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    localStorage.setItem(this.backupConfigKey, JSON.stringify(configs));
  }

  private getBackupConfig(id: string): BackupConfig | null {
    const stored = localStorage.getItem(this.backupConfigKey);
    if (!stored) return null;
    
    const configs = JSON.parse(stored);
    return configs.find((c: BackupConfig) => c.id === id) || null;
  }

  private storeBackupEntry(entry: BackupEntry): void {
    const stored = localStorage.getItem(this.backupEntriesKey);
    const entries = stored ? JSON.parse(stored) : [];
    
    const existingIndex = entries.findIndex((e: BackupEntry) => e.id === entry.id);
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
    localStorage.setItem(this.backupEntriesKey, JSON.stringify(entries));
  }

  private getBackupEntry(id: string): BackupEntry | null {
    const stored = localStorage.getItem(this.backupEntriesKey);
    if (!stored) return null;
    
    const entries = JSON.parse(stored);
    return entries.find((e: BackupEntry) => e.id === id) || null;
  }

  private getSession(sessionId: string): any | null {
    const stored = localStorage.getItem(`${this.sessionKey}_${sessionId}`);
    return stored ? JSON.parse(stored) : null;
  }
}

export const advancedSecurityService = new AdvancedSecurityService();
