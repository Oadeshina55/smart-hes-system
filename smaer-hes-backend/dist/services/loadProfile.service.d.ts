import { ILoadProfile } from '../models/LoadProfile.model';
declare class LoadProfileService {
    /**
     * Request load profile from meter
     */
    requestLoadProfile(meterId: string, startTime: Date, endTime: Date, profileType?: 'hourly' | 'daily' | 'instantaneous' | 'billing' | 'custom', captureInterval?: number): Promise<ILoadProfile>;
    /**
     * Read load profile data from meter (background process)
     */
    private readLoadProfileFromMeter;
    /**
     * Parse raw load profile data from meter
     */
    private parseLoadProfileData;
    /**
     * Get load profiles for a meter
     */
    getLoadProfiles(meterId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        profileType?: string;
        status?: string;
        limit?: number;
        skip?: number;
    }): Promise<{
        loadProfiles: ILoadProfile[];
        total: number;
    }>;
    /**
     * Get load profile by ID
     */
    getLoadProfile(loadProfileId: string): Promise<ILoadProfile | null>;
    /**
     * Get load profile statistics
     */
    getLoadProfileStatistics(loadProfileId: string): Promise<any>;
    /**
     * Calculate min, max, average for a dataset
     */
    private calculateStats;
    /**
     * Delete load profile
     */
    deleteLoadProfile(loadProfileId: string): Promise<void>;
}
export declare const loadProfileService: LoadProfileService;
export default loadProfileService;
//# sourceMappingURL=loadProfile.service.d.ts.map