import React from 'react';
import {
    Button,
    ButtonStrip,
    Input,
    Label,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from '../RouteSettings.module.css';

const routeSchema = z.object({
    url: z.string()
        .url({ message: i18n.t('Invalid URL format') })
        .min(1, { message: i18n.t('URL is required') })
        .refine(url => url.endsWith('/**'), {
            message: i18n.t('URL must end with a double wildcard (/**)'),
        }),
});

export type RouteFormValues = z.infer<typeof routeSchema>;

interface RouteFormProps {
    onClose: () => void;
    onSubmit: (data: RouteFormValues) => void;
    isLoading: boolean;
    initialUrl?: string;
    modalTitle: string;
    submitButtonText: string;
}

export const RouteForm = ({
    onClose,
    onSubmit,
    isLoading,
    initialUrl = '',
    modalTitle,
    submitButtonText,
}: RouteFormProps) => {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RouteFormValues>({
        resolver: zodResolver(routeSchema),
        shouldFocusError: false,
        defaultValues: {
            url: initialUrl,
        },
    });

    const handleFormSubmit = (data: RouteFormValues) => onSubmit(data);

    return (
        <Modal onClose={onClose} dataTest="route-form-modal">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <ModalTitle>{modalTitle}</ModalTitle>
                <ModalContent>
                    <Label htmlFor="url">{i18n.t('CHAP Core URL')}</Label>
                    <Controller
                        name="url"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="text"
                                error={!!errors.url}
                                onChange={payload => field.onChange(payload.value)}
                                dataTest="route-url-input"
                            />
                        )}
                    />
                    {errors.url ? <p className={styles.mutedText}>{errors.url.message}</p> : null}
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isLoading}
                            dataTest="cancel-route-button"
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isLoading}
                            disabled={isLoading}
                            dataTest="submit-route-button"
                        >
                            {submitButtonText}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
};
