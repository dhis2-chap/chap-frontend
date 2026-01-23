import React from 'react';
import { Switch } from '@dhis2/ui';
import styles from '../ExperimentalSettings.module.css';

type ChoiceCardProps = {
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
};

export const ChoiceCard = ({ title, description, checked, onChange, disabled = false }: ChoiceCardProps) => {
    const handleClick = () => {
        if (!disabled) {
            onChange();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
            event.preventDefault();
            onChange();
        }
    };

    const handleSwitchClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    return (
        <div
            className={`${styles.choiceCard} ${disabled ? styles.choiceCardDisabled : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            <div className={styles.choiceCardContent}>
                <span className={styles.choiceCardTitle}>{title}</span>
                <span className={styles.choiceCardDescription}>{description}</span>
            </div>
            <span onClick={handleSwitchClick}>
                <Switch
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                />
            </span>
        </div>
    );
};
