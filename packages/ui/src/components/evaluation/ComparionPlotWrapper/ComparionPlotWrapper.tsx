import { useMemo, useState } from 'react';
import { ComparisonPlotList } from '../ComparisonPlotList/ComparisonPlotList';
import {
    EvaluationForSplitPoint,
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

export const ComparionPlotWrapper = (props: ComparionPlotWrapperProps) => {
    const resetKey = [
        props.evaluationName,
        props.modelName,
        props.splitPeriods.join('|'),
        props.evaluations.map(evaluation => evaluation.splitPoint).join('|'),
    ].join('::');

    return (
        <ComparionPlotWrapperContent
            key={resetKey}
            {...props}
        />
    );
};

const ComparionPlotWrapperContent = ({
    evaluationName,
    modelName,
    evaluations,
    splitPeriods,
}: ComparionPlotWrapperProps) => {
    const defaultSplitPoint = evaluations[0];
    const [searchQuery, setSearchQuery] = useState<string | undefined>();
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>(() =>
        defaultSplitPoint?.evaluation.map(
            evaluationPerOrgUnit => evaluationPerOrgUnit.orgUnitId,
        ) ?? [],
    );
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState(
        defaultSplitPoint?.splitPoint ?? splitPeriods[0],
    );

    const allOrgUnits = useMemo(() => {
        return defaultSplitPoint?.evaluation.map((evaluationPerOrgUnit) => {
            return {
                name: evaluationPerOrgUnit.orgUnitName,
                id: evaluationPerOrgUnit.orgUnitId,
            };
        }) ?? [];
    }, [defaultSplitPoint]);

    const selectedEvaluation = useMemo(() => {
        return evaluations.find(
            evaluation => evaluation.splitPoint === selectedSplitPeriod,
        ) ?? defaultSplitPoint;
    }, [defaultSplitPoint, evaluations, selectedSplitPeriod]);

    const normalizedSearchQuery = searchQuery?.toLocaleLowerCase() ?? '';

    const filteredEvaluationPlots = useMemo(() => {
        if (!selectedEvaluation) {
            return [];
        }

        return selectedOrgUnits.flatMap((orgUnit) => {
            const match = selectedEvaluation.evaluation.find(
                evaluationPerOrgUnit =>
                    evaluationPerOrgUnit.orgUnitId === orgUnit &&
                    evaluationPerOrgUnit.orgUnitName
                        .toLocaleLowerCase()
                        .includes(normalizedSearchQuery),
            );

            return match ? [match] : [];
        });
    }, [normalizedSearchQuery, selectedEvaluation, selectedOrgUnits]);

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
