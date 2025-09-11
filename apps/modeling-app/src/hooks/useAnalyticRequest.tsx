import { useDataQuery } from '@dhis2/app-runtime';
import {
    DatasetLayer,
} from '../features/new-dataset/interfaces/DataSetLayer';

const ANALYTICS_QUERY = ({
    dataElements = [],
    periodes = [],
    orgUnit = {},
} = {}) => {
    return {
        request: {
            resource: 'analytics',
            params: {
                paging: false,
                dimension: `dx:${dataElements.join(
                    ';',
                )},ou:${orgUnit},pe:${periodes.join(';')}`,
            },
        },
    };
};

interface AnalyticsRespone {
    data: [[string, string, string, string]] | [];
    error: any;
    loading: boolean;
    metaData: { [key: string]: { name: string } };
}

const useAnalyticRequest = (
    dataLayers: DatasetLayer[],
    periodes: any,
    orgUnit: any,
): AnalyticsRespone => {
    // filter out every DHIS2 dataElement
    const dataElements = dataLayers.map(
        (d: DatasetLayer) => d.dataSource,
    ) as any;

    // if all data will be fetched from CHAP
    if (dataElements.length === 0) {
        return {
            data: [],
            metaData: {},
            error: '',
            loading: false,
        };
    }

    const { loading, error, data } = useDataQuery(
        ANALYTICS_QUERY({ dataElements, periodes, orgUnit }),
    ) as any;

    if (!loading && data && !error) {
        // divide the respons into the features (for instance population, diseases, etc)

        return {
            data: data?.request?.rows,
            metaData: data?.request?.metaData?.items,
            error,
            loading,
        };
    }

    return {
        data,
        metaData: {},
        error,
        loading,
    };
};

export default useAnalyticRequest;
