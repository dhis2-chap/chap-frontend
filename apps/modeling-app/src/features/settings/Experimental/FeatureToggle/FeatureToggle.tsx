import i18n from '@dhis2/d2-i18n';
import { useMinimumChapVersion } from '../../../../hooks/useMinimumChapVersion';
import { FEATURE_MIN_VERSIONS, FeatureConfig } from '../constants';
import { ChoiceCard } from '../ChoiceCard';

type FeatureToggleProps = {
    feature: FeatureConfig;
    checked: boolean;
    onChange: () => void;
    disabled: boolean;
};

export const FeatureToggle = ({
    feature,
    checked,
    onChange,
    disabled,
}: FeatureToggleProps) => {
    const minVersion = FEATURE_MIN_VERSIONS[feature.key];
    const { isSupported, isLoading } = useMinimumChapVersion({
        version: minVersion ?? '0.0.0',
    });

    const hasVersionRequirement = minVersion !== undefined;
    const isVersionBlocked = hasVersionRequirement && !isSupported && !isLoading;

    const description = isVersionBlocked
        ? i18n.t('{{description}}. Requires CHAP version {{version}} or higher.', {
                description: feature.description,
                version: minVersion,
            })
        : feature.description;

    return (
        <ChoiceCard
            title={feature.title}
            description={description}
            checked={checked && !isVersionBlocked}
            onChange={onChange}
            disabled={disabled || isVersionBlocked || isLoading}
        />
    );
};
