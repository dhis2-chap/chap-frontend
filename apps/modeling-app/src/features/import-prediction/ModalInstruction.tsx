import React from 'react';
import { Modal, ModalContent } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useConfig } from '@dhis2/app-runtime';
import styles from './styles/ModalInstruction.module.css';

interface ModalInstructionProps {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    predictionTarget: string;
}

const ModalInstruction = ({
    setModalOpen,
    modalOpen,
    predictionTarget,
}: ModalInstructionProps) => {
    const config = useConfig();

    return (
        modalOpen && (
            <Modal large onClose={() => setModalOpen(false)}>
                <ModalContent>
                    <h2>{i18n.t('Add required Data Elements')}</h2>
                    <p>
                        {i18n.t(
                            'This app requires specific DHIS2 Data Elements to import data into. If you have not already added them, go to the ',
                        )}
                        <a
                            target="_blank"
                            href={`${config.baseUrl}/dhis-web-maintenance/index.html#/list/dataElementSection/dataElement`}
                            rel="noreferrer"
                        >
                            Maintenance
                        </a>
                        {i18n.t(
                            '-app and create the Data Elements listed below.',
                        )}
                    </p>
                    <p className={styles.warning}>
                        {i18n.t(
                            'NB! Make sure the CODE property for each data element is exactly the same as below.',
                        )}
                    </p>
                    <p>
                        {i18n.t(
                            'Properties in the new Data Element form not specified in the tables below should have the default value.',
                        )}
                    </p>
                    <div className={styles.dataValueTables}>
                        <DataValueTable q="Low" disease={predictionTarget} />
                        <DataValueTable
                            q="Median"
                            disease={predictionTarget}
                        />
                        <DataValueTable q="High" disease={predictionTarget} />
                    </div>
                </ModalContent>
            </Modal>
        )
    );
};

export default ModalInstruction;

interface DataValueTableProps {
    disease: string;
    q: 'Low' | 'Median' | 'High';
}

const DataValueTable = ({ q, disease }: DataValueTableProps) => {
    return (
        <table className={styles.dataTable}>
            <tbody>
                <tr>
                    <th>{i18n.t('Name')}</th>
                    <td>
                        CHAP
                        {i18n.t(` ${disease} Quantile ${q}`)}
                    </td>
                </tr>
                <tr>
                    <th>{i18n.t('Short name')}</th>
                    <td>
                        CHAP
                        {i18n.t(` ${disease} Quantile ${q}`)}
                    </td>
                </tr>
                <tr>
                    <th>{i18n.t('Code')}</th>
                    <td>
                        {`CHAP_${q.toUpperCase()}_${disease
                            .toLocaleUpperCase()
                            .replaceAll(' ', '_')}`}
                    </td>
                </tr>
                <tr>
                    <th>{i18n.t('Domain type')}</th>
                    <td>{i18n.t('Aggregate')}</td>
                </tr>
                <tr>
                    <th>{i18n.t('Aggregation levels')}</th>
                    <td>
                        <em>{i18n.t('Assign all org unit levels')}</em>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};
