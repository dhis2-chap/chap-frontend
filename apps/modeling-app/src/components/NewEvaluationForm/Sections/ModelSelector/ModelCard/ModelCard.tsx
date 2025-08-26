import React from 'react'
import { Button, IconInfo16, IconCalendar16, Tag, Tooltip, IconDimensionData16, IconArrowRight16 } from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import cn from 'classnames'
import { ModelSpecRead, AuthorAssessedStatus } from '@dhis2-chap/ui'
import styles from './ModelCard.module.css'

type Props = {
    model: ModelSpecRead
    isSelected: boolean
    onSelect: (model: ModelSpecRead) => void
}

const labelByPeriodType = {
    'month': i18n.t('Monthly'),
    'year': i18n.t('Yearly'),
    'week': i18n.t('Weekly'),
    'day': i18n.t('Daily'),
    'any': i18n.t('Any'),
}

const assessmentStatusConfig = {
    [AuthorAssessedStatus.GRAY]: {
        label: i18n.t('Deprecated'),
        description: i18n.t('This model is not intended for use or has been deprecated.'),
        className: styles.statusGray
    },
    [AuthorAssessedStatus.RED]: {
        label: i18n.t('Experimental'),
        description: i18n.t('An early prototype with no formal validation - only for initial experimentation.'),
        className: styles.statusRed
    },
    [AuthorAssessedStatus.ORANGE]: {
        label: i18n.t('Limited'),
        description: i18n.t('Tested on a small dataset. Requires manual tuning and close monitoring.'),
        className: styles.statusOrange
    },
    [AuthorAssessedStatus.YELLOW]: {
        label: i18n.t('Testing'),
        description: i18n.t('Prepared for more extensive testing; not yet approved for production.'),
        className: styles.statusYellow
    },
    [AuthorAssessedStatus.GREEN]: {
        label: i18n.t('Production'),
        description: i18n.t('Approved for general use.'),
        className: styles.statusGreen
    },
};

export const ModelCard = ({ model, isSelected, onSelect }: Props) => {
    const assessmentStatus = model.authorAssessedStatus && assessmentStatusConfig[model.authorAssessedStatus];

    return (
        <div className={cn(styles.modelCardContainer, {
            [styles.selectedModelCard]: isSelected
        })}>

            <div
                className={styles.modelCard}
            >
                <div className={styles.title}>
                    <h3 className={styles.modelHumanName}>
                        {model.displayName || model.name}
                    </h3>
                    {assessmentStatus && (
                        <Tooltip content={assessmentStatus.description}>
                            <div className={cn(styles.assessmentStatus, assessmentStatus.className)}>
                                {assessmentStatus.label}
                            </div>
                        </Tooltip>
                    )}
                </div>
                <div className={styles.description}>
                    {model.description}
                </div>

                <div className={styles.modelAuthor}>
                    {model.organizationLogoUrl && (
                        <img
                            src={model.organizationLogoUrl}
                            alt={model.name + " logo"}
                            className={styles.modelAuthorLogo}
                        />
                    )}
                    <div className={styles.modelAuthorInfo}>
                        <span className={styles.modelAuthorName}>
                            {model.author}
                        </span>
                        <span className={styles.modelOrganizationName}>
                            {model.organization}
                        </span>
                    </div>
                </div>


                <div>
                    <ul className={styles.list}>
                        {model.target && (
                            <li className={styles.listItem}>
                                <Tag icon={<IconArrowRight16 />}>{model.target.displayName}</Tag>
                            </li>
                        )}
                        {model.covariates && model.covariates.length > 0 && (
                            <Tooltip content={model.covariates.map((covariate) => covariate.displayName).join(', ')}>
                                <li className={styles.listItem}>
                                    <Tag icon={<IconDimensionData16 />}>
                                        {i18n.t('{{count}} covariates', {
                                            count: model.covariates.length,
                                            defaultValue: '{{count}} covariate',
                                            defaultValue_plural: '{{count}} covariates'
                                        })}
                                    </Tag>
                                </li>
                            </Tooltip>
                        )}
                    </ul>

                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            <Tag neutral icon={<IconCalendar16 />}>{labelByPeriodType[model.supportedPeriodType as keyof typeof labelByPeriodType] || model.supportedPeriodType}</Tag>
                        </li>
                        {model.authorNote && model.authorNote !== 'No Author note yet' && (
                            <>
                                <li className={styles.listItem}>
                                    <Tooltip content={model.authorNote}>
                                        <Tag icon={<IconInfo16 />}>{i18n.t('Author note')}</Tag>
                                    </Tooltip>
                                </li>
                            </>
                        )}
                    </ul>
                </div>


            </div>
            <Button
                onClick={() => onSelect(model)}
                primary
                small
            >
                {isSelected ? i18n.t("Selected") : i18n.t("Select Model")}
            </Button>
        </div>
    )
}
