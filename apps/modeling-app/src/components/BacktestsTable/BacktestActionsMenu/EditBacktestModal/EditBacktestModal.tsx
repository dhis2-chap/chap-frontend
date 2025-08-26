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
import styles from './EditBacktestModal.module.css';
import { useRenameEvaluation } from '../../hooks/useRenameEvaluation';

const backtestNameSchema = z.object({
    name: z.string().min(1, { message: i18n.t("Name is required") }),
});

export type EditBacktestFormValues = z.infer<typeof backtestNameSchema>;

interface EditBacktestModalProps {
    id: number;
    onClose: () => void;
    initialName?: string;
}

export const EditBacktestModal = ({
    id,
    onClose,
    initialName = "",
}: EditBacktestModalProps) => {
    const {
        renameEvaluation,
        isSubmitting,
    } = useRenameEvaluation({
        onSuccess: () => {
            onClose();
        },
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EditBacktestFormValues>({
        resolver: zodResolver(backtestNameSchema),
        defaultValues: {
            name: initialName,
        },
    });

    const handleFormSubmit = (data: EditBacktestFormValues) => {
        renameEvaluation({ id, name: data.name });
    };

    return (
        <Modal onClose={onClose} dataTest="edit-backtest-modal">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <ModalTitle>{i18n.t('Rename evaluation')}</ModalTitle>
                <ModalContent>
                    <Label htmlFor="backtest-name">{i18n.t('Name')}</Label>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="text"
                                error={!!errors.name}
                                onChange={(payload) => field.onChange(payload.value)}
                                dataTest="backtest-name-input"
                            />
                        )}
                    />
                    {errors.name  && <p className={styles.mutedText}>{errors.name.message}</p>}
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isSubmitting}
                            dataTest="cancel-edit-backtest-button"
                        >
                            {i18n.t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            dataTest="submit-edit-backtest-button"
                        >
                            {i18n.t("Save")}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
}; 