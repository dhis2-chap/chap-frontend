import {
    CrudService,
    DataSetRead,
} from '@dhis2-chap/ui';
import React, { useEffect, useState } from 'react';

const Datasets = () => {
    const [data, setData] = useState<undefined | DataSetRead[]>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true); // Ensure loading state is true when fetching starts.
        setError(null); // Clear previous errors when fetching starts.
        try {
            const result = await CrudService.getDatasetsCrudDatasetsGet();
            setData(result);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return (
        <div>
            Error:
            {error}
        </div>
    );
    return (
        <div>
            Data:
            {JSON.stringify(data)}
        </div>
    );
};

export default Datasets;
