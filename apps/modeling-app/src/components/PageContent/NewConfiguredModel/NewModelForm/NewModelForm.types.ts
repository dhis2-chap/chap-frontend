import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';

export const baseModelSchema = z.object({
    modelId: z.string().min(1, { message: i18n.t('Model template is required') }),
    name: z.string().min(1, { message: i18n.t('Name is required') }),
});

export type BaseModelFormValues = z.infer<typeof baseModelSchema>;

export type NewModelFormValues = BaseModelFormValues & {
    userOptions: Record<string, unknown>;
    additionalContinuousCovariates: string[];
};

