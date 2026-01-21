import React from 'react';
import { NavLink } from 'react-router-dom';
import { ConditionalTooltip } from '@/components/ConditionalTooltip';
import styles from './NestedSidebar.module.css';

export interface SidebarItem {
    to: string;
    label: string;
    disabled?: boolean;
    tooltip?: string;
}

export interface SidebarCategory {
    title?: string;
    items: SidebarItem[];
}

interface NestedSidebarProps {
    categories: SidebarCategory[];
}

export const NestedSidebar = ({ categories }: NestedSidebarProps) => {
    return (
        <nav className={styles.sidebar}>
            {categories.map((category, categoryIndex) => (
                <div key={category.title ?? categoryIndex} className={styles.category}>
                    {category.title && (
                        <div className={styles.categoryTitle}>{category.title}</div>
                    )}
                    <ul className={styles.itemList}>
                        {category.items.map(item => (
                            <li key={item.to} className={styles.item}>
                                <ConditionalTooltip
                                    enabled={!!item.disabled && !!item.tooltip}
                                    content={item.tooltip}
                                >
                                    {item.disabled ? (
                                        <span className={`${styles.itemLink} ${styles.disabled}`}>
                                            {item.label}
                                        </span>
                                    ) : (
                                        <NavLink
                                            to={item.to}
                                            className={({ isActive }) =>
                                                `${styles.itemLink} ${isActive ? styles.active : ''}`}
                                            end
                                        >
                                            {item.label}
                                        </NavLink>
                                    )}
                                </ConditionalTooltip>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};
