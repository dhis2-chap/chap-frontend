import React from 'react';
import styles from './Settings.module.css';
import { RouteSettings } from './RouteSettings';
import { ChapSettings } from './ChapSettings';
import { useRoute } from '../../hooks/useRoute';

export const SettingsPage = () => {
    const { route } = useRoute();

    return (
        <div className={styles.settingsContainer}>
            <RouteSettings />

            {route && <ChapSettings route={route} />}

        </div>
    );
};
