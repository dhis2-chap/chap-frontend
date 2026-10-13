import i18n from '@dhis2/d2-i18n';
import { Sidenav, SidenavHeader, SidenavItems, SidenavLink } from '@dhis2-chap/ui';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './Layout.module.css';

export const Layout = () => {
    const location = useLocation();
    useEffect(() => {
        dispatchEvent(new PopStateEvent('popstate'));
    }, [location.key]);
    return (
        <div className={styles.layout}>
            <Sidenav>
                <SidenavHeader><h2 className={styles.title}>{i18n.t('Early Warning')}</h2></SidenavHeader>
                <SidenavItems>
                    <SidenavLink to="/" label={i18n.t('Review queue')} LinkComponent={NavLink} end />
                    <SidenavLink to="/history" label={i18n.t('Review history')} LinkComponent={NavLink} />
                </SidenavItems>
            </Sidenav>
            <main className={styles.content}><Outlet /></main>
        </div>
    );
};
