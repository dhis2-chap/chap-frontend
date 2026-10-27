import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox } from '@dhis2/ui';
import { ChapErrorNotice } from '../ChapErrorNotice';
import type { useForecastHorizonValidation } from './hooks/useForecastHorizonValidation';

type Props = {
    validation: ReturnType<typeof useForecastHorizonValidation>;
};

export const ForecastHorizonNotice = ({ validation }: Props) => (
    <>
        {validation.isLoading && (
            <NoticeBox>{i18n.t('Checking model forecast limits...')}</NoticeBox>
        )}
        {!!validation.error && (
            <ChapErrorNotice
                error={validation.error instanceof Error ? validation.error : undefined}
                title={i18n.t('Could not check model forecast limits')}
            >
                <Button small onClick={validation.retry}>{i18n.t('Retry')}</Button>
            </ChapErrorNotice>
        )}
        {validation.messages.length > 0 && (
            <NoticeBox error title={i18n.t('Unsupported forecast periods')}>
                <ul>
                    {validation.messages.map((message, index) => <li key={index}>{message}</li>)}
                </ul>
            </NoticeBox>
        )}
    </>
);
