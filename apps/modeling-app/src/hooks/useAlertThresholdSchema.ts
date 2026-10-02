import { useQuery } from '@tanstack/react-query';
import { getChapOpenApiSchema } from '@dhis2-chap/ui';
import { readThresholdStrategies } from '@/utils/thresholdParameterSchema';

export const useAlertThresholdSchema = () => useQuery({
    queryKey: ['alert-threshold-schema'],
    queryFn: async () => readThresholdStrategies(await getChapOpenApiSchema()),
    staleTime: Infinity,
    retry: false,
});
