import React, { useEffect, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    FullPredictionResponseExtended,
    PredictionRead,
} from '@dhis2-chap/ui';
import styles from './styles/PredictionResult.module.css';
import useOrgUnits from '../../hooks/useOrgUnits';
import { Button, TabBar, IconArrowRight24, Tab } from '@dhis2/ui';
import PostResult from './PostResult';
import SelectDataValues from './SelectDataValues';
import SetupInstruction from './SetupInstruction';
import useDataElements from '../../hooks/useDataElements';
import { useLocation } from 'react-router-dom';
import {
    FullPredictionResponse,
    PredictionResponse,
    PredictionTable,
} from '@dhis2-chap/ui';

import { UncertaintyAreaChart } from '@dhis2-chap/ui';
import useFindDataItem from '../../hooks/useDataItem';

interface PredictionResultProps {
    prediction_unprocessed: PredictionRead;
}

const PredictionResult = ({
    prediction_unprocessed,
}: PredictionResultProps) => {
    const location = useLocation();

    const [selectedTab, setSelectedTab] = useState<'chart' | 'table' | 'map'>(
        'chart',
    );

    const [prediciton, setPrediciton] = useState<
        FullPredictionResponseExtended | undefined
    >();

    // This states hold the dataElement prediction would be imported to
    const [qLowDataElement, setqLowDataElementId] = useState<{
        displayName: string;
        id: string;
    } | null>(null);
    const [qMedianDataElement, setqMedianDataElementId] = useState<{
        displayName: string;
        id: string;
    } | null>(null);
    const [qHighDataElement, setqHighDataElementId] = useState<{
        displayName: string;
        id: string;
    } | null>(null);

    const getQuantile = (quantile: number, values: number[] | undefined) => {
        if (!values) return 0;
        // Make a copy of the array to avoid mutating the original array
        const sortedArr = [...values].sort((a, b) => a - b);
        const n = sortedArr.length;

        // Calculate the quantile index
        const index = quantile * (n - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);

        // Linearly interpolate between the two bounding indices
        if (lowerIndex === upperIndex) {
            return Math.round(sortedArr[lowerIndex]);
        }

        return Math.round(
            sortedArr[lowerIndex]
            + (sortedArr[upperIndex] - sortedArr[lowerIndex])
            * (index - lowerIndex),
        );
    };

    const quantiles = [
        { q: 0.1, name: 'quantile_low' },
        { q: 0.5, name: 'median' },
        { q: 0.9, name: 'quantile_high' },
    ];

    const getPredictorId = () => {
        return (
            prediction_unprocessed?.metaData?.dataItemMapper?.find(
                (m: any) => m.featureName === 'disease_cases',
            ).dataItemId ?? ''
        );
    };

    const getFullPredictionResponseExtended =
        (): FullPredictionResponseExtended => {
            return {
                diseaseId: predictionTargetId,
                dataValues: prediction_unprocessed.forecasts.flatMap(
                    (forecast) => {
                        return quantiles.map((quantile) => {
                            return {
                                orgUnit: forecast.orgUnit,
                                value: getQuantile(quantile.q, forecast.values),
                                displayName: forecast.orgUnit,
                                dataElement: quantile.name,
                                period: forecast.period,
                            };
                        });
                    },
                ),
            };
        };

    // Every dataElement that have a code that start with CHAP_LOW would be fetched, same for CHAP_MEDIAN and CHAP_HIGH
    const { dataElements: dataElementsLow } = useDataElements('CHAP_LOW');
    const { dataElements: dataElementsMedian } = useDataElements('CHAP_MEDIAN');
    const { dataElements: dataElementsHigh } = useDataElements('CHAP_HIGH');

    // PredicationTargetId comes from the uploaded file, this is used to fetch the name of the disease
    const predictionTargetId = getPredictorId();

    const { displayName: predictionTargetName } =
        useFindDataItem(predictionTargetId);

    // Used to display the name of the orgUnit in the table/chart
    const { orgUnits, loading: orgUnitLoading } = useOrgUnits();

    // States related to posting the prediction
    const [postStatus, setPostStatus] = useState<
        'loading' | 'finish' | 'error' | 'initial'
    >('initial');
    const [postHttpError, setPostHttpError] = useState('');

    // if id is passed in
    useEffect(() => {
        if (orgUnits) {
            fetchOrHandleFileDropData();
        }
    }, [location?.state?.data, orgUnits]);

    // If the user do not have any data elements that start with CHAP_LOW, CHAP_MEDIAN or CHAP_HIGH, show a warning
    const noCHAPDataElementExists = () => {
        if (
            dataElementsLow?.length === 0
            || dataElementsMedian?.length === 0
            || dataElementsHigh?.length === 0
        ) {
            return true;
        }
        return false;
    };

    const fetchOrHandleFileDropData = async () => {
        setPostStatus('initial');
    };

    // when name of disease is fetched, the prediction is filled with orgUnitName
    useEffect(() => {
        if (predictionTargetName && orgUnits && prediction_unprocessed) {
            setPrediciton(fillWithOrgUnit(getFullPredictionResponseExtended()));
        }
    }, [predictionTargetName, orgUnits, prediction_unprocessed]);

    useEffect(() => {
        if (
            dataElementsLow &&
            dataElementsMedian &&
            dataElementsHigh &&
            predictionTargetName
        ) {
            const low = dataElementsLow.find(
                (de: any) =>
                    de.code
                    === `CHAP_LOW_${predictionTargetName
                        .toLocaleUpperCase()
                        .replaceAll(' ', '_')}`,
            );
            if (low) setqLowDataElementId(low);
            const median = dataElementsMedian.find(
                (de: any) =>
                    de.code
                    === `CHAP_MEDIAN_${predictionTargetName
                        .toLocaleUpperCase()
                        .replaceAll(' ', '_')}`,
            );
            if (median) setqMedianDataElementId(median);
            const high = dataElementsHigh.find(
                (de: any) =>
                    de.code
                    === `CHAP_HIGH_${predictionTargetName
                        .toLocaleUpperCase()
                        .replaceAll(' ', '_')}`,
            );
            if (high) setqHighDataElementId(high);
        }
    }, [
        dataElementsLow,
        dataElementsMedian,
        dataElementsHigh,
        predictionTargetName,
    ]);

    // If user has selcted to import prediction into a data element that not contain the predictionName, give a warning to the user.
    const warnAboutUnequalDiseaseAndDataElement = () => {
        // do not warn when nothing is selected
        if (!qLowDataElement && !qMedianDataElement && !qHighDataElement) {
            return false;
        }
        // show warning if any of the selected data elements do not match the disease
        if (
            qLowDataElement &&
            !qLowDataElement?.displayName.includes(predictionTargetName)
        )
            return true;
        if (
            qMedianDataElement &&
            !qMedianDataElement?.displayName.includes(predictionTargetName)
        )
            return true;
        if (
            qHighDataElement &&
            !qHighDataElement?.displayName.includes(predictionTargetName)
        )
            return true;
        return false;
    };
    // This add displayName to the orgUnits
    const fillWithOrgUnit = (
        data: FullPredictionResponse,
    ): FullPredictionResponseExtended => {
        return {
            dataValues: data.dataValues.map((d: PredictionResponse) => {
                return {
                    ...d,
                    displayName: (
                        orgUnits?.organisationUnits.find(
                            (ou: any) => ou.id === d.orgUnit,
                        ) as any
                    )?.displayName,
                };
            }),
            diseaseId: data.diseaseId,
        };
    };

    const validateForm = () => {
        if (qLowDataElement && qMedianDataElement && qHighDataElement) {
            return true;
        }
        return false;
    };

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                {orgUnitLoading && <p>Loading metadata from DHIS2.. </p>}
                <h1>
                    Prediction:
                    {prediction_unprocessed.name}
                </h1>
                {
                    // If predication is null, show only "Upload file"-area

                    prediciton && (
                        <>
                            <TabBar scrollable>
                                <Tab
                                    selected={selectedTab === 'chart'}
                                    onClick={() => setSelectedTab('chart')}
                                >
                                    Chart
                                </Tab>
                                <Tab
                                    selected={selectedTab === 'table'}
                                    onClick={() => setSelectedTab('table')}
                                >
                                    Table
                                </Tab>
                                {/* <Tab
                                selected={selectedTab === 'map'}
                                onClick={() => setSelectedTab('map')}
                            >
                                Map
                            </Tab> */}
                            </TabBar>

                            <div className={styles.prediction}>
                                {
                                    {
                                        chart: (
                                            <UncertaintyAreaChart
                                                predictionTargetName={
                                                    predictionTargetName
                                                }
                                                data={prediciton}
                                            />
                                        ),
                                        table: (
                                            <PredictionTable
                                                data={prediciton}
                                            />
                                        ),
                                        map: (
                                            /* <PredictionMap
                                            predictionTargetName={
                                                predictionTargetName
                                            }
                                            data={prediction}
                                        /> */
                                            <></>
                                        ),
                                    }[selectedTab]
                                }
                            </div>

                            <h3>
                                {i18n.t(
                                    'Select which data element prediction should be imported to:',
                                )}
                            </h3>
                            <SetupInstruction
                                warning={noCHAPDataElementExists()}
                                predictionTarget={predictionTargetName}
                            />

                            <SelectDataValues
                                label={i18n.t(
                                    'Select data element for low quantile',
                                )}
                                dataElements={dataElementsLow}
                                onChange={setqLowDataElementId}
                                value={qLowDataElement}
                            />
                            <SelectDataValues
                                label={i18n.t(
                                    'Select data element for median quantile',
                                )}
                                dataElements={dataElementsMedian}
                                onChange={setqMedianDataElementId}
                                value={qMedianDataElement}
                            />
                            <SelectDataValues
                                label={i18n.t(
                                    'Select data element for high quantile',
                                )}
                                dataElements={dataElementsHigh}
                                onChange={setqHighDataElementId}
                                value={qHighDataElement}
                            />

                            {warnAboutUnequalDiseaseAndDataElement() && (
                                <p className={styles.warning}>
                                    Warning: It seems like selected data
                                    elements do not match the disease of
                                    prediction.
                                </p>
                            )}

                            <div className={styles.footer}>
                                <Button
                                    onClick={() => setPostStatus('loading')}
                                    loading={postStatus === 'loading'}
                                    disabled={
                                        postStatus === 'finish'
                                        || postStatus === 'loading'
                                        || !validateForm()
                                    }
                                    icon={<IconArrowRight24 />}
                                    primary
                                >
                                    {i18n.t('Import prediction')}
                                </Button>
                            </div>

                            {postStatus === 'loading' && (
                                <PostResult
                                    setPostHttpError={setPostHttpError}
                                    setPostStatus={setPostStatus}
                                    prediction={prediciton}
                                    qLowDataElementId={
                                        qLowDataElement?.id as string
                                    }
                                    qMedianDataElementId={
                                        qMedianDataElement?.id as string
                                    }
                                    qHighDataElementId={
                                        qHighDataElement?.id as string
                                    }
                                />
                            )}

                            <div className={styles.post}>
                                {postStatus === 'finish' && (
                                    <p className={styles.greenText}>
                                        {i18n.t(
                                            'Prediction has been imported.',
                                        )}
                                    </p>
                                )}
                                <p className={styles.redText}>
                                    {i18n.t(postHttpError)}
                                </p>
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    );
};

export default PredictionResult;
