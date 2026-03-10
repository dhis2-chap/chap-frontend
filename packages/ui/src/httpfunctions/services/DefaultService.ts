import type { HealthResponse } from '../models/HealthResponse';
import type { SystemInfoResponse } from '../models/SystemInfoResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { SystemService } from './SystemService';

export class DefaultService {
    public static healthHealthGet(): CancelablePromise<HealthResponse> {
        return SystemService.healthHealthGet();
    }

    public static systemInfoSystemInfoGet(): CancelablePromise<SystemInfoResponse> {
        return SystemService.systemInfoSystemInfoGet();
    }
}
