import React from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    Input,
    Label,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './EditModelModal.module.css';
import { useRenameModel } from '../../../../hooks/useRenameModel';

const modelNameSchema = z.object({
    name: z.string().min(1, { message: i18n.t("Name is required") }),
});

export type EditModelFormValues = z.infer<typeof modelNameSchema>;

interface EditModelModalProps {
    id: number;
    onClose: () => void;
    initialName?: string | null | undefined;
}

export const EditModelModal = ({
    id,
    onClose,
    initialName = "",
}: EditModelModalProps) => {
    const {
        renameModel,
        isSubmitting,
    } = useRenameModel({
        onSuccess: () => {
            onClose();
        },
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EditModelFormValues>({
        resolver: zodResolver(modelNameSchema),
        defaultValues: {
            name: initialName || "",
        },
    });

    const handleFormSubmit = (data: EditModelFormValues) => {
        renameModel({ id, name: data.name });
    };

    return (
        <Modal onClose={onClose} dataTest="edit-model-modal">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <ModalTitle>{i18n.t('Rename model')}</ModalTitle>
                <ModalContent>
                    <Label htmlFor="model-name">{i18n.t('Name')}</Label>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="text"
                                error={!!errors.name}
                                onChange={(payload) => field.onChange(payload.value)}
                                dataTest="model-name-input"
                            />
                        )}
                    />
                    {errors.name && <p className={styles.mutedText}>{errors.name.message}</p>}
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isSubmitting}
                            dataTest="cancel-edit-model-button"
                        >
                            {i18n.t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            dataTest="submit-edit-model-button"
                        >
                            {i18n.t("Save")}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
};


