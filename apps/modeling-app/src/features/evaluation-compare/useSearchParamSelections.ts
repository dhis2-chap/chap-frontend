import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { BackTestRead } from '@dhis2-chap/ui'
import { useBacktests } from '../../hooks/useBacktests'

const evaluationParamsSchema = z.object({
    baseEvaluation: z.string().optional(),
    /* May want multiple comparisons in the future, so we use a list 
     Note that this is singular, because useSearchParams will list the same key multiple times when used as a list
     */

    comparisonEvaluation: z.array(z.string()).optional().default([]),
})

const PARAMS_KEYS = {
    baseEvaluation: 'baseEvaluation',
    comparisonEvaluation: 'comparisonEvaluation',
    splitPeriod: 'splitPeriod',
    orgUnit: 'orgUnit',
}

const getParams = (searchParams: URLSearchParams) => {
    return {
        baseEvaluation: searchParams.get(PARAMS_KEYS.baseEvaluation),
        comparisonEvaluation: searchParams.getAll(
            PARAMS_KEYS.comparisonEvaluation
        ),
    }
}

export type EvaluationParams = z.infer<typeof evaluationParamsSchema>

export type Updater<TInput, TOutput = TInput> =
    | TOutput
    | ((input: TInput) => TOutput)

function functionalUpdate<TInput, TOutput = TInput>(
    updater: Updater<TInput, TOutput>,
    input: TInput
): TOutput {
    return typeof updater === 'function'
        ? (updater as (_: TInput) => TOutput)(input)
        : updater
}

const createSearchParamsListUpdater =
    (key: string, valueOrUpdate: Updater<string[] | undefined>) =>
        (prev: URLSearchParams) => {
            const updatedParams = new URLSearchParams(prev)

            const newItems = functionalUpdate(valueOrUpdate, prev.getAll(key))

            updatedParams.delete(key)
            newItems?.forEach((value) => {
                updatedParams.append(key, value)
            })

            return updatedParams
        }

export const useSelectedEvaluations = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    const params: EvaluationParams = useMemo(() => {
        const params = getParams(searchParams)

        const validated = evaluationParamsSchema.safeParse(params)

        if (validated.success) {
            return validated.data
        }
        return {
            baseEvalation: undefined,
            comparisonEvaluation: [],
        }
    }, [searchParams])

    const setBaseEvaluation = useCallback(
        (baseEvaluationId: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev)
                if (baseEvaluationId) {
                    updatedParams.set(
                        PARAMS_KEYS.baseEvaluation,
                        baseEvaluationId
                    )
                } else {
                    updatedParams.delete(PARAMS_KEYS.baseEvaluation)
                }
                return updatedParams
            })
        },
        [setSearchParams]
    )

    const setComparisonEvaluations = useCallback(
        (valueOrUpdater: Updater<string[] | undefined>) => {
            setSearchParams(
                createSearchParamsListUpdater(
                    PARAMS_KEYS.comparisonEvaluation,
                    valueOrUpdater
                )
            )
        },
        [setSearchParams]
    )

    const setComparisonEvaluation = useCallback(
        (comparisonEvaluationId: string | undefined) =>
            setComparisonEvaluations(
                comparisonEvaluationId ? [comparisonEvaluationId] : []
            ),
        [setComparisonEvaluations]
    )
    const comparisonEvaluation: string | undefined =
        params.comparisonEvaluation[0]

    return {
        baseEvaluation: params.baseEvaluation,
        comparisonEvaluations: params.comparisonEvaluation,
        comparisonEvaluation: comparisonEvaluation,
        setBaseEvaluation,
        setComparisonEvaluations,
        setComparisonEvaluation,
    }
}

// not that we do not expose comparisonEvaluations here,
// if we want to support more - implement here
export type EvaluationControllerResult = {
    baseEvaluation: BackTestRead | undefined
    comparisonEvaluation: BackTestRead | undefined
    evaluations: BackTestRead[] | undefined
} & Pick<
    ReturnType<typeof useSelectedEvaluations>,
    'setBaseEvaluation' | 'setComparisonEvaluation'
>

export const useSelectedEvaluationsController =
    (): EvaluationControllerResult => {
        const { backtests } = useBacktests()
        const {
            baseEvaluation,
            comparisonEvaluation,
            setBaseEvaluation,
            setComparisonEvaluation,
        } = useSelectedEvaluations()

        // map selected evaluationIds to the actual evaluations
        const mappedEvaluations = useMemo(() => {
            if (!backtests || backtests.length === 0) {
                return {
                    baseEvaluation: undefined,
                    comparisonEvaluation: undefined,
                    comparisonEvaluations: [],
                }
            }
            const backTestMap = new Map(
                backtests.map((bt) => [bt.id.toString(), bt])
            )
            return {
                baseEvaluation: baseEvaluation
                    ? backTestMap.get(baseEvaluation)
                    : undefined,
                comparisonEvaluation: comparisonEvaluation
                    ? backTestMap.get(comparisonEvaluation)
                    : undefined,
            }
        }, [backtests, baseEvaluation, comparisonEvaluation])

        return {
            ...mappedEvaluations,
            setBaseEvaluation,
            setComparisonEvaluation,
            evaluations: backtests,
        }
    }

export const useSelectedSplitPeriod = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    const splitPeriod = searchParams.get(PARAMS_KEYS.splitPeriod)
    const setSplitPeriod = useCallback(
        (newSplitPeriod: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev)
                if (newSplitPeriod) {
                    updatedParams.set(PARAMS_KEYS.splitPeriod, newSplitPeriod)
                } else {
                    updatedParams.delete(PARAMS_KEYS.splitPeriod)
                }
                return updatedParams
            })
        },
        [setSearchParams]
    )
    return [splitPeriod, setSplitPeriod] as const
}

export const useSelectedOrgUnits = ({
    initialValue,
}: { initialValue?: string[] } = {}) => {
    // we cant use useSearchParams's initialValue, because initialValue is async, and
    // thus empty on first render which is passed to useSearchParams, and wont update after the fact
    const [searchParams, setSearchParams] = useSearchParams()
    const [hasSetSearchParams, setHasSetSearchParams] = useState(false)

    const hasParamSelection = searchParams.has(PARAMS_KEYS.orgUnit)
    const resolvedValue =
        !hasSetSearchParams && initialValue && !hasParamSelection
            ? initialValue
            : searchParams.getAll(PARAMS_KEYS.orgUnit)

    const setOrgUnits = useCallback(
        (valueOrUpdater: Updater<string[] | undefined>) => {
            setHasSetSearchParams(true)
            return setSearchParams(
                createSearchParamsListUpdater(
                    PARAMS_KEYS.orgUnit,
                    valueOrUpdater
                )
            )
        },
        [setSearchParams, setHasSetSearchParams]
    )

    return [resolvedValue, setOrgUnits] as const
}
