import { useConfig } from '@dhis2/app-runtime';
import { OpenAPI } from '@dhis2-chap/ui';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Loading } from './StateViews';

export const ChapApiProvider = ({ children }: PropsWithChildren) => {
    const { baseUrl } = useConfig();
    const [configuredUrl, setConfiguredUrl] = useState<string>();
    useEffect(() => {
        OpenAPI.BASE = `${baseUrl.replace(/\/$/, '')}/api/routes/chap/run`;
        OpenAPI.WITH_CREDENTIALS = true;
        setConfiguredUrl(baseUrl);
    }, [baseUrl]);
    return configuredUrl === baseUrl ? children : <Loading />;
};
