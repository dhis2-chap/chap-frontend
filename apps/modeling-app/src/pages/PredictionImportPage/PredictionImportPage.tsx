import { Card } from '@dhis2-chap/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './PredictionImportPage.module.css';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { PredictionImport } from '../../components/PageContent/PredictionImport';
import { PredictionRunLoader } from '../../components/PredictionRunLoader';

export const PredictionImportPage: React.FC = () => (
    <PredictionRunLoader>
        {({ prediction, model }) => (
            <>
                <PageHeader
                    pageTitle={i18n.t('Import prediction')}
                    pageDescription={i18n.t('Import the forecasted values of this prediction into DHIS2.')}
                />
                <Card className={styles.container}>
                    <PredictionImport
                        prediction={prediction}
                        model={model}
                    />
                </Card>
            </>
        )}
    </PredictionRunLoader>
);
