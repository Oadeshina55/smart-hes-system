export declare class AlertService {
    static getActiveAlertsCount(): Promise<{
        total: number;
        tamper: number;
        anomaly: number;
        revenue: number;
        technical: number;
        communication: number;
    }>;
    static createAlert(alertData: any): Promise<any>;
    static acknowledgeAlert(alertId: string, userId: string): Promise<any>;
    static resolveAlert(alertId: string, userId: string, resolutionNotes: string): Promise<any>;
    static escalateAlert(alertId: string, escalateToUserId: string): Promise<any>;
    static getRevenueLossSummary(startDate?: Date, endDate?: Date): Promise<any>;
    static cleanOldAlerts(): Promise<any>;
}
//# sourceMappingURL=alert.service.d.ts.map