import React from 'react'
import { EvaluationPerOrgUnit } from '../../../interfaces/Evaluation'
import { ComparisonPlot } from '../ComparisonPlot/ComparisonPlot'
import { Virtuoso, VirtuosoProps } from 'react-virtuoso'

interface ComparisonPlotListProps {
    evaluationPerOrgUnits: EvaluationPerOrgUnit[]
    useVirtuoso?: boolean
    useVirtuosoWindowScroll?: boolean
    virtuosoProps?: VirtuosoProps<any, any>
    nameLabel?: string
}

export const ComparisonPlotList: React.FC<ComparisonPlotListProps> = ({
    evaluationPerOrgUnits,
    useVirtuoso = true,
    useVirtuosoWindowScroll = false,
    virtuosoProps,
    nameLabel,
}) => {
    if (!useVirtuoso) {
        return (
            <>
                {evaluationPerOrgUnits.map((orgUnitsData) => {
                    if (!orgUnitsData) {
                        return null
                    }

                    return (
                        <ComparisonPlot
                            key={orgUnitsData.orgUnitId}
                            orgUnitsData={orgUnitsData}
                            nameLabel={nameLabel}
                        />
                    )
                })}
            </>
        )
    }

    return (
        <Virtuoso
            {...virtuosoProps}
            style={{ height: '100%' }}
            useWindowScroll={useVirtuosoWindowScroll}
            totalCount={evaluationPerOrgUnits.length}
            itemContent={(index) => (
                <ComparisonPlot
                    orgUnitsData={evaluationPerOrgUnits[index]}
                    nameLabel={nameLabel}
                />
            )}
        />
    )
}
