import { ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox, TabBar, Tab } from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import type { XaiMethodRead } from '@dhis2-chap/ui';
import { XaiMethodSelector } from './XaiMethodSelector';
import styles from './ExplainabilityWidget.module.css';

export type TabKey = 'global' | 'local' | 'horizon';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    activeTab: TabKey;
    onActiveTabChange: (tab: TabKey) => void;

    explanationRunError: string | null;
    computingMessage: string | null;

    showGlobalTabSpinner: boolean;
    showLocalTabSpinner: boolean;
    showHorizonTabSpinner: boolean;

    xaiMethods: XaiMethodRead[] | undefined;
    selectedXaiMethod: string;
    isXaiMethodsLoading: boolean;
    onSelectXaiMethod: (method: XaiMethodRead) => void;

    children: ReactNode;
};

export const ExplainabilityWidgetComponent = ({
    open,
    onOpenChange,
    activeTab,
    onActiveTabChange,
    explanationRunError,
    computingMessage,
    showGlobalTabSpinner,
    showLocalTabSpinner,
    showHorizonTabSpinner,
    xaiMethods,
    selectedXaiMethod,
    isXaiMethodsLoading,
    onSelectXaiMethod,
    children,
}: Props) => {
    return (
        <div className={styles.widgetContainer}>
            <Widget
                header={i18n.t('Explainability')}
                open={open}
                onOpen={() => onOpenChange(true)}
                onClose={() => onOpenChange(false)}
            >
                <div className={styles.content}>
                    {explanationRunError && (
                        <NoticeBox error title={i18n.t('Explanation error')}>
                            {explanationRunError}
                        </NoticeBox>
                    )}
                    {computingMessage && (
                        <div className={styles.computingBanner}>
                            <CircularLoader extrasmall />
                            <span>{computingMessage}</span>
                        </div>
                    )}
                    <div className={styles.tabBarWrapper}>
                        <TabBar>
                            <Tab
                                selected={activeTab === 'global'}
                                onClick={() => onActiveTabChange('global')}
                            >
                                {i18n.t('Global')}
                                {showGlobalTabSpinner && (
                                    <CircularLoader
                                        extrasmall
                                        className={styles.tabSpinner}
                                    />
                                )}
                            </Tab>
                            <Tab
                                selected={activeTab === 'local'}
                                onClick={() => onActiveTabChange('local')}
                            >
                                {i18n.t('Local')}
                                {showLocalTabSpinner && (
                                    <CircularLoader
                                        extrasmall
                                        className={styles.tabSpinner}
                                    />
                                )}
                            </Tab>
                            <Tab
                                selected={activeTab === 'horizon'}
                                onClick={() => onActiveTabChange('horizon')}
                            >
                                {i18n.t('Horizon')}
                                {showHorizonTabSpinner && (
                                    <CircularLoader
                                        extrasmall
                                        className={styles.tabSpinner}
                                    />
                                )}
                            </Tab>
                        </TabBar>
                        <div className={styles.methodPillSlot}>
                            <XaiMethodSelector
                                xaiMethods={xaiMethods}
                                selectedMethodName={selectedXaiMethod}
                                onSelect={onSelectXaiMethod}
                                isLoading={isXaiMethodsLoading}
                            />
                        </div>
                    </div>
                    <div className={styles.tabContent}>{children}</div>
                </div>
            </Widget>
        </div>
    );
};
