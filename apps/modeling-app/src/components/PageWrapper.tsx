import React from 'react'
import { useMatches } from 'react-router-dom'
import { RouteHandle } from '../App'

interface ComponentWrapperProps {
    children: React.ReactNode
    maxWidth?: string
}

export const defaultMaxWidth: string = '1400px'

const style: React.CSSProperties = {
    maxWidth: defaultMaxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '20px 16px',
    width: '100%',
}

const ComponentWrapper = ({ children, maxWidth }: ComponentWrapperProps) => {
    const fullWidthRoute = useMatches().some(
        (match) => !!(match.handle as RouteHandle)?.fullWidth
    )

    return (
        <div
            style={{
                ...style,
                maxWidth: fullWidthRoute ? 'none' : maxWidth || defaultMaxWidth,
                width: '100%',
            }}
        >
            {children}
        </div>
    )
}

export default ComponentWrapper
