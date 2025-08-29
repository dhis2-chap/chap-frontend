import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import i18n from '@dhis2/d2-i18n'
import { OrganisationUnit } from '../../OrganisationUnitSelector'
import { PERIOD_TYPES } from '../Sections/PeriodSelector'
import { isAfter, isEqual, isFuture, parseISO } from 'date-fns'
import { useCreateNewBacktest } from './useCreateNewBacktest'

export type CovariateMapping = z.infer<typeof covariateMappingSchema>

export const dimensionItemTypeSchema = z.enum(['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR'])

export const dataItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  dimensionItemType: dimensionItemTypeSchema,
})

const orgUnitSchema = z.object({
  id: z.string().min(1, { message: i18n.t('Missing id for org unit') }),
  name: z.string().optional(),
  displayName: z.string().optional(),
  path: z.string().optional(),
})

const covariateMappingSchema = z.object({
  covariateName: z.string(),
  dataItem: dataItemSchema,
})

const evaluationSchema = z.object({
  name: z.string().min(1, { message: i18n.t('Name is required') }),
  periodType: z.enum(["WEEK", "MONTH"], { message: i18n.t('Period type is required') }),
  fromDate: z.string().min(1, { message: i18n.t('Start date is required') }),
  toDate: z.string().min(1, { message: i18n.t('End date is required') }).refine((data) => !isFuture(parseISO(data)), { message: i18n.t('End date cannot be in the future') }),
  orgUnits: z.array(orgUnitSchema).min(1, { message: i18n.t('At least one org unit is required') }),
  modelId: z.string().min(1, { message: i18n.t('Please select a model') }),
  covariateMappings: z.array(covariateMappingSchema).min(1, { message: i18n.t('Please map the covariates to valid data items') }),
  targetMapping: z.object({
    covariateName: z.string(),
    dataItem: dataItemSchema,
  }, { message: i18n.t('Please map the target to a valid data item') }),
})
  .refine((data) => {
    const fromDate = parseISO(data.fromDate)
    const toDate = parseISO(data.toDate)
    return isAfter(toDate, fromDate) || isEqual(toDate, fromDate)
  }, { path: ['toDate'], message: i18n.t('End period must be after start period') })

export type EvaluationFormValues = z.infer<typeof evaluationSchema>

export const useFormController = () => {
  const methods = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      name: '',
      periodType: PERIOD_TYPES.MONTH,
      fromDate: '',
      toDate: '',
      orgUnits: [],
      modelId: '',
      covariateMappings: [],
      targetMapping: undefined,
    },
    shouldFocusError: false,
  })

  const {
    createNewBacktest,
    isSubmitting,
    importSummary,
    error,
    summaryModalOpen,
    closeSummaryModal,
    validateAndDryRun,
    isValidationLoading,
  } = useCreateNewBacktest({
    onSuccess: () => {
      methods.reset()
    }
  })

  const onUpdateOrgUnits = (orgUnits: OrganisationUnit[]) => {
    methods.setValue('orgUnits', orgUnits, { shouldValidate: true, shouldDirty: true });
  }

  const handleSubmit = (data: EvaluationFormValues) => createNewBacktest(data)
  const handleDryRunSubmit = (data: EvaluationFormValues) => validateAndDryRun(data)

  const handleStartJob = () => {
    methods.handleSubmit(handleSubmit)()
  }

  const handleDryRun = () => {
    methods.handleSubmit(handleDryRunSubmit)()
  }

  return {
    methods,
    onUpdateOrgUnits,
    handleSubmit,
    handleStartJob,
    isSubmitting,
    error,
    importSummary,
    summaryModalOpen,
    closeSummaryModal,
    handleDryRun,
    isValidationLoading,
  }
}
