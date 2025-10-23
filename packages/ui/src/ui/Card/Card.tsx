import React from 'react';
import styles from './Card.module.css';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={clsx(styles.card, className)}>
            {children}
        </div>
    );
};
