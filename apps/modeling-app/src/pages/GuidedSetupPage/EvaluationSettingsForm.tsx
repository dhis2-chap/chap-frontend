import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip } from '@dhis2/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BacktestParameterFields } from '../../components/NewEvaluationForm/BacktestParameterFields';
import { type BacktestParameters, backtestParametersSchema } from '../../components/NewEvaluationForm/hooks/backtestParameters';
import styles from './GuidedSetupPage.module.css';

const schema = z.object({ backtestParameters: backtestParametersSchema });

type Props = {
    periodType?: string | null;
    /** The settings being changed. Keep it stable between renders. */
    initialValues?: BacktestParameters;
    onApply: (parameters: BacktestParameters) => void;
    onCancel: () => void;
};

/** The settings of an evaluation, changed in place on the evaluation step. */
export const EvaluationSettingsForm = ({ periodType, initialValues, onApply, onCancel }: Props) => {
    const methods = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: initialValues && { backtestParameters: initialValues },
    });

    return (
        <FormProvider {...methods}>
            <div className={styles.settingsForm}>
                <BacktestParameterFields periodType={periodType} initialValues={initialValues} />
                <ButtonStrip>
                    <Button small primary onClick={() => methods.handleSubmit(values => onApply(values.backtestParameters))()} dataTest="guided-apply-settings">
                        {i18n.t('Use these settings')}
                    </Button>
                    <Button small secondary onClick={onCancel}>{i18n.t('Cancel')}</Button>
                </ButtonStrip>
            </div>
        </FormProvider>
    );
};
