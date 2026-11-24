import i18n from '@dhis2/d2-i18n';
import { IconChevronLeft24 } from '@dhis2/ui';
import { IconMessages16 } from '@dhis2/ui-icons';
import cx from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
    Sidenav,
    SidenavButton,
    SidenavFooter,
    SidenavItems,
    SidenavLink,
    SidenavParent,
} from '@dhis2-chap/ui';
import { ReportBugDialog } from '../../features/common-features/ReportBugDialog/ReportBugDialog';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';

type LinkItem = {
    to: string;
    label: string;
};
interface SidebarNavLinkProps {
    label: string;
    to: string;
    disabled?: boolean;
    end?: boolean;
}

const SidebarNavLink = ({ to, label, disabled, end }: SidebarNavLinkProps) => {
    return (
        <SidenavLink
            to={to}
            disabled={disabled}
            LinkComponent={NavLink}
            label={label}
            end={end}
        />
    );
};

interface SidebarParentProps {
    label: string;
    links: LinkItem[];
}

const SidebarParent = ({
    label,
    links = [],
}: SidebarParentProps) => {
    const { pathname } = useLocation();
    const [toggled, setToggled] = useState<boolean>();
    // Closed until the user is on one of its pages, so the guided path stays in focus.
    const isOpen = toggled ?? links.some(({ to }) => pathname.startsWith(to));

    const handleOpen = () => {
        setToggled(!isOpen);
    };

    if (links.length === 1) {
        return <SidebarNavLink to={links[0].to} label={links[0].label} end />;
    }

    return (
        <SidenavParent label={label} open={isOpen} onClick={handleOpen}>
            {links.map(({ to, label }) => (
                <SidebarNavLink key={label} to={to} label={label} end />
            ))}
        </SidenavParent>
    );
};

export const Sidebar = ({
    className,
    hideSidebar,
}: {
    className?: string;
    hideSidebar?: boolean;
}) => {
    const collapsedExternally = useRef<boolean>(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isReportBugDialogOpen, setIsReportBugDialogOpen] = useState(false);
    const { isAvailable: isBenchmarksAvailable } = useIsFeatureAvailable(Features.BENCHMARKS);

    useEffect(() => {
        // only react if explicitly defined
        // however, do react if it has been changed externally
        // eg. so that it reopen when navigating away from a collapsed route
        if (hideSidebar !== undefined || collapsedExternally.current) {
            setCollapsed(!!hideSidebar);
            collapsedExternally.current = !!hideSidebar;
        }
    }, [hideSidebar]);

    return (
        <>
            <aside
                className={cx(styles.asideWrapper, className, {
                    [styles.collapsed]: collapsed,
                })}
            >
                <Sidenav>
                    <SidenavItems>
                        <SidebarNavLink to="/guided" label={i18n.t('Guided setup')} />
                        <SidebarNavLink to="/predictions" label={i18n.t('Predictions')} />
                        <SidebarParent
                            label={i18n.t('Advanced')}
                            links={[
                                { label: i18n.t('Dashboard'), to: '/dashboard' },
                                { label: i18n.t('Datasets'), to: '/datasets' },
                                { label: i18n.t('Evaluations'), to: '/evaluate' },
                                { label: i18n.t('Compare'), to: '/evaluate/compare' },
                                ...(isBenchmarksAvailable ? [{ label: i18n.t('Benchmarks'), to: '/evaluate/benchmarks' }] : []),
                                { label: i18n.t('Signal policies'), to: '/signals' },
                                { label: i18n.t('Models'), to: '/models' },
                                { label: i18n.t('Jobs'), to: '/jobs' },
                            ]}
                        />
                    </SidenavItems>
                    <SidenavFooter>
                        <SidenavItems>
                            <SidenavButton
                                icon={<IconMessages16 />}
                                label={i18n.t('Report a bug')}
                                dataTest="sidebar-report-bug-button"
                                onClick={() => setIsReportBugDialogOpen(true)}
                            />
                            <SidebarNavLink to="/guides" label={i18n.t('Guides')} />
                            <SidebarNavLink to="/settings" label={i18n.t('Settings')} />
                        </SidenavItems>
                    </SidenavFooter>
                </Sidenav>
                <button
                    className={styles.collapseButton}
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <div
                        className={cx(styles.iconWrapper, {
                            [styles.collapsed]: collapsed,
                        })}
                    >
                        <IconChevronLeft24 />
                    </div>
                </button>
            </aside>
            {isReportBugDialogOpen && (
                <ReportBugDialog
                    onClose={() => setIsReportBugDialogOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
