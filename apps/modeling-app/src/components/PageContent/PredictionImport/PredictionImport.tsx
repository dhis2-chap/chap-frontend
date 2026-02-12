import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { PredictionInfo } from '@dhis2-chap/ui';
import { Tab, TabBar } from '@dhis2/ui';
import { QuantileMappingForm } from './QuantileMappingForm';
import styles from './PredictionImport.module.css';

type Props = {
    prediction: PredictionInfo;
};

export const PredictionImport = ({ prediction }: Props) => {
    const [selectedTab, setSelectedTab] = useState<'import' | 'guide'>('import');

    return (
        <div className={styles.container}>
            <TabBar>
                <Tab
                    selected={selectedTab === 'import'}
                    onClick={() => setSelectedTab('import')}
                >
                    {i18n.t('Import')}
                </Tab>
                <Tab
                    selected={selectedTab === 'guide'}
                    onClick={() => setSelectedTab('guide')}
                    disabled
                >
                    {i18n.t('Guide')}
                </Tab>
            </TabBar>

            {selectedTab === 'import' && (
                <QuantileMappingForm
                    prediction={prediction}
                />
            )}
            {selectedTab === 'guide' && (
                <div>
                    <span>{i18n.t('Guide')}</span>
                </div>
            )}

        </div>
    );
};
