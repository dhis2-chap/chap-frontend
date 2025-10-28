import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { colors, IconChevronUp24 } from '@dhis2/ui';
import { IconButton } from '../IconButton';
import type { WidgetCollapsiblePropsPlain } from './widgetCollapsible.types';
import styles from './Widget.module.css';

type Props = WidgetCollapsiblePropsPlain;

export const WidgetCollapsible = ({
    header,
    open,
    onOpen,
    onClose,
    color = colors.white,
    borderless = false,
    children,
}: Props) => {
    const [childrenVisible, setChildrenVisibility] = useState(open); // controls whether children are rendered to the DOM
    const [animationsReady, setAnimationsReadyStatus] = useState(false);
    const [postEffectOpen, setPostEffectOpenStatus] = useState(open);
    const hideChildrenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialRenderRef = useRef(true);

    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return;
        }

        if (!animationsReady) {
            setAnimationsReadyStatus(true);
        }

        setPostEffectOpenStatus(open);

        clearTimeout(hideChildrenTimeoutRef.current as ReturnType<typeof setTimeout>);
        if (open) {
            setChildrenVisibility(true);
        } else {
            hideChildrenTimeoutRef.current = setTimeout(() => {
                setChildrenVisibility(false);
            }, 200);
        }
    }, [open, animationsReady]);

    return (
        <div style={{ backgroundColor: color, borderRadius: 3 }}>
            <div
                className={cx(
                    styles.headerContainer,
                    {
                        [styles.headerContainerChildrenVisible]: childrenVisible,
                        [styles.borderless]: borderless,
                    },
                )}
            >
                <div className={styles.headerCollapsible}>
                    {header}
                    <IconButton
                        dataTest="widget-open-close-toggle-button"
                        className={cx(styles.toggleButton, {
                            [styles.toggleButtonCloseInit]: !animationsReady && !postEffectOpen,
                            [styles.toggleButtonOpen]: animationsReady && postEffectOpen,
                            [styles.toggleButtonClose]: animationsReady && !postEffectOpen,
                        })}
                        onClick={open ? onClose : onOpen}
                    >
                        <IconChevronUp24 />
                    </IconButton>
                </div>
            </div>
            {
                childrenVisible ? (
                    <div
                        data-test="widget-contents"
                        className={cx(
                            styles.children,
                            {
                                [styles.childrenOpen]: animationsReady && open,
                                [styles.childrenClose]: animationsReady && !open,
                                [styles.borderless]: borderless,
                            },
                        )}
                    >
                        {children}
                    </div>
                ) : null
            }
        </div>
    );
};
