import React, { useEffect, useState } from 'react';
import { ComparisonPlotList } from '../ComparisonPlotList/ComparisonPlotList';
import {
    EvaluationForSplitPoint,
    EvaluationPerOrgUnit,
} from '../../../interfaces/Evaluation';
import {
    Checkbox,
    EventPayload,
    InputField,
} from '@dhis2/ui';
import SplitPeriodSelector from '../SplitPeriodSelector/SplitPeriodSelector';
import styles from './ComparionPlotWrapper.module.css';

interface ComparionPlotWrapperProps {
    evaluationName: string;
    modelName: string;
    evaluations: EvaluationForSplitPoint[];
    splitPeriods: string[];
}

export const ComparionPlotWrapper = ({
    evaluationName,
    modelName,
    evaluations,
    splitPeriods,
}: ComparionPlotWrapperProps) => {
    const [filteredEvaluationPlots, setFilteredEvaluationPlots] = useState<
        EvaluationPerOrgUnit[]
    >([]);
    const [searchQuery, setSearchQuery] = useState<string | undefined>();
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);
    const [allOrgUnits, setAllOrgUnits] = useState<
        { name: string; id: string }[]
    >([]);
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState(
        splitPeriods[0],
    );

    // on intial load
    useEffect(() => {
        const defaultSplitPoint = evaluations[0];

        setSelectedOrgUnits(
            defaultSplitPoint.evaluation.map(
                evaluationPerOrgUnit => evaluationPerOrgUnit.orgUnitId,
            ),
        );
        setAllOrgUnits(
            defaultSplitPoint.evaluation.map((evaluationPerOrgUnit) => {
                return {
                    name: evaluationPerOrgUnit.orgUnitName,
                    id: evaluationPerOrgUnit.orgUnitId,
                };
            }),
        );

        setSelectedSplitPeriod(defaultSplitPoint.splitPoint);
        setFilteredEvaluationPlots(defaultSplitPoint.evaluation);
        // setSelectedOrgUnits(evaluationPerOrgUnits.map((orgUnit) => orgUnit.orgUnitId))
    }, [evaluations, splitPeriods]);

    useEffect(() => {
        // find selected orgUnits
        const splitPoint = evaluations.find(
            evaluation => evaluation.splitPoint === selectedSplitPeriod,
        ) as EvaluationForSplitPoint;

        // match on orgUnit
        const _filteredEvaluationPlots = selectedOrgUnits?.map((orgUnit) => {
            // Use find to locate the first matching evaluation for the orgUnit
            return splitPoint.evaluation.find(
                evaluationPerOrgUnit =>
                    evaluationPerOrgUnit.orgUnitId === orgUnit &&
                    evaluationPerOrgUnit.orgUnitName
                        .toLocaleLowerCase()
                        .includes(
                            searchQuery ? searchQuery.toLocaleLowerCase() : '',
                        ),
            );
        }) as EvaluationPerOrgUnit[];

        setFilteredEvaluationPlots(_filteredEvaluationPlots);
    }, [selectedSplitPeriod, selectedOrgUnits, searchQuery]);

    const onChangeOrgUnitSelected = (e: EventPayload) => {
        const selectedOrgUnit: string[] = e.checked
            ? ([...selectedOrgUnits, e.value] as string[])
            : selectedOrgUnits.filter(orgUnit => orgUnit !== e.value);
        setSelectedOrgUnits(selectedOrgUnit);
    };

    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.filter}>
                    <div>
                        <h2>
                            Evaluation:
                            {' '}
                            {evaluationName}
                        </h2>
                    </div>
                    <div>
                        <div className={styles.filterTitle}>Split period:</div>
                        <SplitPeriodSelector
                            splitPeriods={splitPeriods}
                            setSelectedSplitPeriod={setSelectedSplitPeriod}
                            selectedSplitPeriod={selectedSplitPeriod}
                        />
                    </div>

                    <div>
                        <div className={styles.filterTitle}>
                            Organization units:
                        </div>
                        <div className={styles.filterCheckbox}>
                            {allOrgUnits.map(orgUnit => (
                                <Checkbox
                                    checked={
                                        selectedOrgUnits.filter(
                                            o => o == orgUnit.id,
                                        ).length > 0
                                    }
                                    onChange={onChangeOrgUnitSelected}
                                    label={orgUnit.name}
                                    key={orgUnit.id}
                                    value={orgUnit.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.plots}>
                    <div>
                        <h3>
                            Model:
                            {' '}
                            {modelName}
                        </h3>
                    </div>
                    <div className={styles.searchInput}>
                        <InputField
                            label="Search for organization units:"
                            placeholder={allOrgUnits[0]?.name + '..'}
                            onChange={e => setSearchQuery(e.value)}
                            value={searchQuery}
                        />
                    </div>
                    <ComparisonPlotList
                        evaluationPerOrgUnits={filteredEvaluationPlots}
                        useVirtuoso={true}
                    />
                </div>
            </div>
        </>
    );
};
