import React from 'react';
import { Tooltip, type TooltipProps } from '@dhis2/ui';

type Props = {
    enabled: boolean,
    wrapperClassName?: string,
    children: any,
} & TooltipProps;

export const ConditionalTooltip = (props: Props) => {
    const { enabled, wrapperClassName, children, ...passOnProps } = props;

    return enabled ?
        (
            <Tooltip {...passOnProps}>
                {({ onMouseOver, onMouseOut, ref }) => (
                    <span
                        className={wrapperClassName}
                        ref={(btnRef) => {
                        if (btnRef) {
                            // @ts-expect-error - pointer events are not supported in older browsers
                            btnRef.onpointerenter = onMouseOver;
                            // @ts-expect-error - pointer events are not supported in older browsers
                            btnRef.onpointerleave = onMouseOut;
                            ref.current = btnRef;
                        }
                    }}
                >
                    {children}
                </span>
            )}
        </Tooltip>) : children;
};