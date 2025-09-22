import i18n from '@dhis2/d2-i18n';
import { IconChevronLeft24 } from '@dhis2/ui';
import cx from 'classnames';
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { Sidenav, SidenavItems, SidenavLink, SidenavParent } from './sidenav';

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
    initiallyOpen?: boolean;
    label: string;
    links: LinkItem[];
}

const SidebarParent = ({
    label,
    links = [],
    initiallyOpen = true,
}: SidebarParentProps) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    const handleOpen = () => {
        setIsOpen(!isOpen);
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
    const collapsedExternally = React.useRef<boolean>(false);
    const [collapsed, setCollapsed] = useState(false);

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
        <aside
            className={cx(styles.asideWrapper, className, {
                [styles.collapsed]: collapsed,
            })}
        >
            <Sidenav>
                <SidenavItems>
                    <SidebarParent
                        label={i18n.t('Evaluate')}
                        links={[
                            {
                                label: i18n.t('Overview'),
                                to: '/evaluate',
                            },
                            {
                                label: i18n.t('Compare'),
                                to: '/evaluate/compare',
                            },
                        ]}
                    />
                    <SidebarNavLink to="/predictions" label={i18n.t('Predict')} />
                    <SidebarNavLink to="/jobs" label={i18n.t('Jobs')} />
                    <SidebarNavLink to="/settings" label={i18n.t('Settings')} />
                </SidenavItems>
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
    );
};

export default Sidebar;
