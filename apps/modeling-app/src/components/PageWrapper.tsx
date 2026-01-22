import React from 'react';
import { useMatches } from 'react-router-dom';
import { RouteHandle } from '../App';

interface ComponentWrapperProps {
    children: React.ReactNode;
    maxWidth?: string;
}

export const defaultMaxWidth: string = '1400px';

const style: React.CSSProperties = {
    maxInlineSize: defaultMaxWidth,
    marginInlineStart: 'auto',
    marginInlineEnd: 'auto',
    padding: '20px 16px',
    inlineSize: '100%',
};

const ComponentWrapper = ({ children, maxWidth }: ComponentWrapperProps) => {
    const fullWidthRoute = useMatches().some(
        match => !!(match.handle as RouteHandle)?.fullWidth,
    );

    return (
        <div
            style={{
                ...style,
                maxInlineSize: fullWidthRoute ? 'none' : maxWidth || defaultMaxWidth,
                inlineSize: '100%',
            }}
        >
            {children}
        </div>
    );
};

export default ComponentWrapper;
