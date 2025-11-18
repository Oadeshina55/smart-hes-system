export declare class AnomalyDetectionService {
    static detectAnomalies(): Promise<boolean>;
    static detectZeroConsumption(meter: any): Promise<void>;
    static detectConsumptionDrop(meter: any): Promise<void>;
    static detectNeighborhoodVariance(meter: any): Promise<void>;
    static detectUnusualPattern(meter: any): Promise<void>;
}
//# sourceMappingURL=anomalyDetection.service.d.ts.map