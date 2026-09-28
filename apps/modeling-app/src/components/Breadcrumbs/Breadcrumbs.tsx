import i18n from '@dhis2/d2-i18n';
import { Link, useMatches } from 'react-router-dom';
import type { RouteHandle } from '../../App';
import styles from './Breadcrumbs.module.css';

export const Breadcrumbs = () => {
    const breadcrumbs = useMatches().flatMap((match) => {
        const label = (match.handle as RouteHandle | undefined)?.breadcrumb;
        return label ? [{ id: match.id, pathname: match.pathname, label: label() }] : [];
    });

    if (breadcrumbs.length < 2) {
        return null;
    }

    return (
        <nav aria-label={i18n.t('Breadcrumbs')} className={styles.navigation}>
            <ol className={styles.list}>
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.id} className={styles.item}>
                        {index > 0 && <span aria-hidden="true" className={styles.separator}>/</span>}
                        {index === breadcrumbs.length - 1
                            ? <span aria-current="page">{breadcrumb.label}</span>
                            : <Link className={styles.link} to={breadcrumb.pathname}>{breadcrumb.label}</Link>}
                    </li>
                ))}
            </ol>
        </nav>
    );
};
