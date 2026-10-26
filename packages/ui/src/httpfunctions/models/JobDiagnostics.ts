/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatasetDiagnostics } from './DatasetDiagnostics';
import type { DiagnosticLogs } from './DiagnosticLogs';
import type { JobDescription } from './JobDescription';
import type { ModelDiagnostics } from './ModelDiagnostics';
export type JobDiagnostics = {
    job: JobDescription;
    /**
     * Stored failure traceback; may include values printed by the model.
     */
    traceback: (string | null);
    model: (ModelDiagnostics | null);
    /**
     * Aggregate metadata only; never observation values or geometry.
     */
    dataset: (DatasetDiagnostics | null);
    /**
     * Current API runtime versions, not a snapshot of the worker environment.
     */
    environment: Record<string, string>;
    logs: DiagnosticLogs;
};

