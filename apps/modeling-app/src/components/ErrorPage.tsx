import i18n from '@dhis2/d2-i18n';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

const ErrorPage = () => {
    const error = useRouteError();

    console.error(error);
    if (!isRouteErrorResponse(error)) {
        return (
            <div id="error-page">
                <h1>{i18n.t('Oops!')}</h1>
                <p>{i18n.t('Sorry, an unexpected error has occurred.')}</p>
            </div>
        );
    }

    return (
        <div id="error-page">
            <h1>{i18n.t('Oops!')}</h1>
            <p>{i18n.t('Sorry, an unexpected error has occurred.')}</p>
            <p>
                <i>{error.statusText}</i>
            </p>
        </div>
    );
};

export default ErrorPage;
