import i18n from '@dhis2/d2-i18n';
import { Modal, ModalContent, ModalTitle } from '@dhis2/ui';
import type { ConfiguredModelDB, ModelTemplateRead } from '@dhis2-chap/ui';
import { NewModelFormContainer } from '../../components/PageContent/NewConfiguredModel/NewModelForm/NewModelFormContainer';

type Props = {
    modelTemplates: ModelTemplateRead[];
    templateId: number;
    onCreated: (model: ConfiguredModelDB) => void;
    onClose: () => void;
};

/** Makes a configured model with hyperparameters of the user's own, without leaving the evaluation step. */
export const CustomConfigurationModal = ({ modelTemplates, templateId, onCreated, onClose }: Props) => (
    <Modal large onClose={onClose}>
        <ModalTitle>{i18n.t('Set your own hyperparameters')}</ModalTitle>
        <ModalContent>
            <NewModelFormContainer
                modelTemplates={modelTemplates}
                initialTemplateId={templateId}
                onCreated={(model) => {
                    onCreated(model);
                    onClose();
                }}
            />
        </ModalContent>
    </Modal>
);
