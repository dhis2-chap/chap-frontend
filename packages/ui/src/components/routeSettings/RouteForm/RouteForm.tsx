import {
    Button,
    ButtonStrip,
    Input,
    Label,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
} from '@dhis2/ui';
import { FetchError } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from '../RouteSettings.module.css';
import { ApiTokenField } from '../ApiTokenField';
import { routeTokenReentryMessage } from '../routeMutation';

const routeSchema = z.object({
    apiToken: z.string().trim().refine(value => !/[\r\n]/.test(value), {
        message: i18n.t('The token must not contain line breaks'),
    }),
    removeApiToken: z.boolean(),
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
    error: Error | null;
    initialUrl?: string;
    tokenConfigured?: boolean;
    tokenReentryRequired?: boolean;
    modalTitle: string;
    submitButtonText: string;
}

export const RouteForm = ({
    onClose,
    onSubmit,
    isLoading,
    error,
    initialUrl = '',
    tokenConfigured = false,
    tokenReentryRequired = false,
    modalTitle,
    submitButtonText,
}: RouteFormProps) => {
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<RouteFormValues>({
        resolver: zodResolver(routeSchema),
        shouldFocusError: false,
        defaultValues: {
            url: initialUrl,
            apiToken: '',
            removeApiToken: false,
        },
    });

    const handleFormSubmit = (data: RouteFormValues) => {
        if (tokenReentryRequired && !data.apiToken.trim() && !data.removeApiToken) {
            setError('apiToken', { message: routeTokenReentryMessage() });
            return;
        }
        onSubmit(data);
    };
    const errorMessage = error instanceof FetchError
        ? error.details.message || error.message
        : error?.message;

    return (
        <Modal onClose={isLoading ? undefined : onClose} dataTest="route-form-modal">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <ModalTitle>{modalTitle}</ModalTitle>
                <ModalContent>
                    <Label htmlFor="url">{i18n.t('Chap Core URL')}</Label>
                    <Controller
                        name="url"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="text"
                                disabled={isLoading}
                                error={!!errors.url}
                                onChange={payload => field.onChange(payload.value)}
                                dataTest="route-url-input"
                            />
                        )}
                    />
                    {errors.url ? <p className={styles.mutedText}>{errors.url.message}</p> : null}
                    <Controller
                        name="apiToken"
                        control={control}
                        render={({ field }) => (
                            <ApiTokenField
                                value={field.value}
                                onChange={field.onChange}
                                configured={tokenConfigured || tokenReentryRequired}
                                reentryRequired={tokenReentryRequired}
                                remove={watch('removeApiToken')}
                                onRemoveChange={(remove) => {
                                    setValue('removeApiToken', remove);
                                    setValue('apiToken', '');
                                }}
                                disabled={isLoading}
                                error={errors.apiToken?.message}
                            />
                        )}
                    />
                    {error && (
                        <div role="alert">
                            <NoticeBox error title={i18n.t('Error saving route')} dataTest="route-save-error">
                                {errorMessage || i18n.t('An unknown error occurred. Please try again.')}
                                {errorMessage === 'Route URL is not permitted' && (
                                    <p>
                                        {i18n.t('Contact your DHIS2 server administrator to allow this Chap Core URL in {{setting}} in dhis.conf and restart DHIS2.', {
                                            setting: 'route.remote_servers_allowed',
                                        })}
                                    </p>
                                )}
                            </NoticeBox>
                        </div>
                    )}
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
