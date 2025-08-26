import React, { Dispatch, SetStateAction, useEffect } from 'react'
import useAnalyticRequest from '../../../../hooks/useAnalyticRequest'
import useGeoJson from '../../../../hooks/useGeoJson'
import styles from './DownloadAnalyticsData.module.css'
import { ErrorResponse } from '../../interfaces/ErrorResponse'
import {
    IOrgUnitLevel,
    OrgUnit,
} from '../../../orgunit-selector/interfaces/orgUnit'
import { Period } from '../../../timeperiod-selector/interfaces/Period'
import { DatasetLayer } from '../../../new-dataset/interfaces/DataSetLayer'
import { ObservationBase } from '@dhis2-chap/ui'

interface DownloadAnalyticsDataProps {
    selectedPeriodItems: Period[]
    orgUnitLevel: IOrgUnitLevel | undefined
    selectedOrgUnits: OrgUnit[]
    model_id: string | undefined
    analyticsDataLayers: DatasetLayer[]
    setAnalyticsMetaData: Dispatch<
        SetStateAction<{ [key: string]: { name: string } }>
    >
    setStartDownload: Dispatch<
        SetStateAction<{
            action: 'download' | 'predict' | 'new-dataset'
            startDownload: boolean
        }>
    >
    setErrorMessages(errorMessages: ErrorResponse[]): void
    startDownload: {
        action: 'download' | 'predict' | 'new-dataset'
        startDownload: boolean
    }
    setGeoJSon: (geoJson: any) => void
    setObservations: Dispatch<SetStateAction<ObservationBase[] | undefined>>
    setFeatureDataItemMapper: Dispatch<
        SetStateAction<{ featureName: string; dataItemId: string }[]>
    >
}

const DownloadAnalyticsData = ({
    selectedPeriodItems,
    setGeoJSon,
    setObservations,
    setFeatureDataItemMapper,
    setAnalyticsMetaData,
    setStartDownload,
    orgUnitLevel,
    selectedOrgUnits,
    analyticsDataLayers,
    setErrorMessages,
}: DownloadAnalyticsDataProps) => {
    if (orgUnitLevel == undefined) return <></>

    //Concat selected orgUnits (either national, a district, chiefdom or facility) with the id of selected levels (districts, chiefdoms, facilities)
    const mergedOrgUnits =
        'LEVEL-' +
        orgUnitLevel.id +
        ';' +
        selectedOrgUnits.map((ou: OrgUnit) => ou.id).join(';')

    const flatternDhis2Periods = (periods: Period[]) => {
        return periods.map((period) => period.id)
    }

    const {
        data: analyticData,
        error: analyticError,
        loading: analyticLoading,
        metaData: analyticsMetaData,
    } = useAnalyticRequest(
        analyticsDataLayers,
        flatternDhis2Periods(selectedPeriodItems),
        mergedOrgUnits
    )
    const {
        data: geoJson,
        error: geoJsonError,
        loading: geoJsonLoading,
    } = useGeoJson(orgUnitLevel.level, selectedOrgUnits)

    const getFeatureDataItemMapper = (dataItemIds: string[]) => {
        return dataItemIds.map((dei) => {
            return {
                featureName: analyticsDataLayers.filter(
                    (l) => l.dataSource === dei
                )[0].feature,
                dataItemId: dei,
            }
        })
    }

    const convertDhis2AnlyticsToChap = (
        data: [[string, string, string, string]] | []
    ): ObservationBase[] => {
        // find id to feature name mapping
        //get every unique dataElement id
        const dataElementIds = [...new Set(data.map((row) => row[0]))]
        const featureDataItemMapper = getFeatureDataItemMapper(dataElementIds)
        setFeatureDataItemMapper(featureDataItemMapper)

        return data.map((row) => {
            return {
                featureName: featureDataItemMapper.filter(
                    (l) => l.dataItemId === row[0]
                )[0].featureName,
                orgUnit: row[1],
                period: row[2],
                value: parseFloat(row[3]),
            } as ObservationBase
        })
    }

    useEffect(() => {
        //if one of the data is still loading, return
        if (analyticLoading || geoJsonLoading) return
        //All data is fetched
        if (analyticData && geoJson) {
            setErrorMessages([])
            setGeoJSon(geoJson)
            setObservations(convertDhis2AnlyticsToChap(analyticData))
            setAnalyticsMetaData(analyticsMetaData)
        }

        //if an error occured
        if (analyticError || geoJsonError) {
            const errorMessages: ErrorResponse[] = []

            if (analyticError) {
                errorMessages.push({
                    description: JSON.stringify(analyticError),
                    title: 'Analytics request failed',
                })
            }
            if (geoJsonError) {
                errorMessages.push({
                    description: JSON.stringify(geoJsonError),
                    title: 'OrgUnits request failed',
                })
            }

            setErrorMessages(errorMessages)
            setStartDownload((prev) => ({ ...prev, startDownload: false }))
        }
    }, [analyticLoading, geoJsonLoading])

    return <p className={styles.text}>Downloading data..</p>
}

export default DownloadAnalyticsData
