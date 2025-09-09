import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useOrgUnitsById } from '../../../hooks/useOrgUnitsById'
import { EvaluationFormValues, PERIOD_TYPES } from '../../../components/NewEvaluationForm'

const locationStateInnerSchema = z.object({
  name: z.string().optional(),
  periodType: z.enum([PERIOD_TYPES.WEEK, PERIOD_TYPES.MONTH]).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  orgUnits: z.array(z.string()).optional(),
  modelId: z.string().optional(),
})

type EvaluationFormLocationState = z.infer<typeof locationStateInnerSchema>

const evaluationFormLocationStateSchema = locationStateInnerSchema.optional()

export const useEvaluationFormState = () => {
  const location = useLocation()

  const validationResult = evaluationFormLocationStateSchema.safeParse(location.state)

  const locationState: EvaluationFormLocationState | undefined = validationResult.success
    ? validationResult.data
    : undefined

  if (!validationResult.success && location.state) {
    // eslint-disable-next-line no-console
    console.warn('Invalid location state:', validationResult.error.errors)
  }

  const { data: orgUnitsData, isInitialLoading: isOrgUnitsInitialLoading } = useOrgUnitsById(locationState?.orgUnits || [])

  const initialValues: Partial<EvaluationFormValues> = useMemo(
    () => ({
      name: locationState?.name || '',
      periodType: (locationState?.periodType as any) || PERIOD_TYPES.MONTH,
      fromDate: locationState?.fromDate || '',
      toDate: locationState?.toDate || '',
      orgUnits: (orgUnitsData as any)?.organisationUnits || [],
      modelId: locationState?.modelId || '',
    }),
    [locationState, orgUnitsData]
  )

  const isLoading =
    !!locationState?.orgUnits && locationState.orgUnits.length > 0 && isOrgUnitsInitialLoading

  return {
    initialValues,
    isLoading,
  }
}

