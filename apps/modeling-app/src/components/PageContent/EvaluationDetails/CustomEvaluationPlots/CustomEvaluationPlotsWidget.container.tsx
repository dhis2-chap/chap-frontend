import { useEffect, useState } from 'react'
import {
    CircularLoader,
    IconInfo16,
    MenuItem,
    NoticeBox,
    SingleSelect,
    Tooltip,
} from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import styles from './CustomEvaluationPlotsWidget.module.css'
import { CustomEvaluationPlotsWidgetComponent } from './CustomEvaluationPlotsWidget.component'
import { useCustomEvaluationPlotTypes } from './hooks/useCustomEvaluationPlotTypes'
import { Widget } from '@dhis2-chap/ui'
import { useFacetCoordinates } from '../../../BacktestsTable/hooks/useFacetCoordinates'
import { BackTestFilter } from './BackTestFilter'

type Props = {
    evaluationId: number
}

type WidgetWrapperProps = {
    children: React.ReactNode
    open: boolean
    onOpen: () => void
    onClose: () => void
    className?: string
}

const WidgetWrapper = ({
    children,
    open,
    onOpen,
    onClose,
}: WidgetWrapperProps) => {
    return (
        <Widget
            header={
                <div className={styles.header}>
                    <span>{i18n.t('Evaluation plots')}</span>
                    <Tooltip
                        content={i18n.t(
                            'Evaluation plots are configured system-wide and defined by system administrators / model developers. If you experience issues, please contact your system administrator.'
                        )}
                        placement="top"
                    >
                        <span className={styles.tooltip}>
                            <IconInfo16 />
                        </span>
                    </Tooltip>
                </div>
            }
            open={open}
            onOpen={onOpen}
            onClose={onClose}
        >
            <div className={styles.content}>{children}</div>
        </Widget>
    )
}

export const CustomEvaluationPlotsWidget = ({ evaluationId }: Props) => {
    const [open, setOpen] = useState(false)
    const [filterLocation, setFilterLocation] = useState<string | undefined>(undefined);
    const [filterSplitPeriod, setFilterSplitPeriod] = useState<string | undefined>(undefined);
    const [filterHorizonPeriod, setFilterHorizonPeriod] = useState<string | undefined>(undefined);
    const {
        customEvaluationPlotTypes,
        isLoading: isTypesLoading,
        error: typesError,
    } = useCustomEvaluationPlotTypes()

    const [selectedVisualizationId, setVisualizationId] = useState<
        string | undefined
    >(undefined)

    const { facetCoordinates } = useFacetCoordinates({
        backtestId: evaluationId,
        visualizationName: selectedVisualizationId,
    })

    useEffect(() => {
        console.log('Facet coordinates updated:', facetCoordinates);
    }, [facetCoordinates]) 

    const handleOnChangeVisualization = (visualizationId: string) => {
        setVisualizationId(visualizationId)
        setFilterLocation(undefined)
        setFilterSplitPeriod(undefined)
        setFilterHorizonPeriod(undefined)
    }
    
    if (isTypesLoading) {
        return (
            <div className={styles.container}>
                <WidgetWrapper
                    open={open}
                    onOpen={() => setOpen(true)}
                    onClose={() => setOpen(false)}
                >
                    <div className={styles.loadingContainer}>
                        <CircularLoader />
                    </div>
                </WidgetWrapper>
            </div>
        )
    }

    if (typesError) {
        return (
            <div className={styles.container}>
                <WidgetWrapper
                    open={open}
                    onOpen={() => setOpen(true)}
                    onClose={() => setOpen(false)}
                >
                    <div className={styles.errorContainer}>
                        <NoticeBox title={i18n.t('Unable to load data')} error>
                            <p>
                                {i18n.t(
                                    'There was a problem loading required data. See the browser console for details.'
                                )}
                            </p>
                        </NoticeBox>
                    </div>
                </WidgetWrapper>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <WidgetWrapper
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.controlsRow}>
                    <div className={styles.singleSelectContainer}>
                        <SingleSelect
                            dense
                            selected={selectedVisualizationId}
                            placeholder={i18n.t('Select visualization')}
                            onChange={(e) => handleOnChangeVisualization(e.selected)}
                        >
                            {(customEvaluationPlotTypes ?? []).map((v) => (
                                <MenuItem
                                    key={v.id}
                                    value={v.id}
                                    label={v.displayName}
                                />
                            ))}
                        </SingleSelect>
                    </div>
                    {!!facetCoordinates && (
                                <BackTestFilter
                            visualizationId={selectedVisualizationId!}
                            facetCoords={facetCoordinates}
                            filterLocation={filterLocation}
                            filterSplitPeriod={filterSplitPeriod}
                            filterHorizonPeriod={filterHorizonPeriod}
                            setFilterLocation={setFilterLocation}
                            setFilterSplitPeriod={setFilterSplitPeriod}
                            setFilterHorizonPeriod={setFilterHorizonPeriod}
                        />
                    )}                        
                </div>

                <CustomEvaluationPlotsWidgetComponent
                    evaluationId={evaluationId}
                    selectedVisualizationId={selectedVisualizationId}
                    filterLocation={filterLocation}
                    filterSplitPeriod={filterSplitPeriod}
                    filterHorizonPeriod={filterHorizonPeriod}
                />
            </WidgetWrapper>
        </div>
    )
}