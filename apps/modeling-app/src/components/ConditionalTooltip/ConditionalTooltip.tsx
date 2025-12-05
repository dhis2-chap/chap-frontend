import React from 'react';
import { Tooltip } from '@dhis2/ui';

type Props = {
    enabled: boolean;
    children: React.ReactNode;
    content?: React.ReactNode | string;
};

export const ConditionalTooltip = (props: Props) => {
    const { enabled, children, ...passOnProps } = props;

    return enabled
        ? (
                <Tooltip {...passOnProps}>
                    {({ onMouseOver, onMouseOut, ref }) => (
                        <span
                            ref={ref}
                            onMouseEnter={onMouseOver}
                            onMouseLeave={onMouseOut}
                        >
                            {children}
                        </span>
                    )}
                </Tooltip>
            ) : children;
};
