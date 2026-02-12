import { useState, useCallback, useEffect, useRef } from 'react';
import i18n from '@dhis2/d2-i18n';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt?: string;
}

export const ImageLightbox = ({ src, alt, className, ...props }: ImageLightboxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const openLightbox = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
        setIsOpen(false);
        triggerRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeLightbox();
        }
    }, [closeLightbox]);

    const handleBackdropClick = useCallback((event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            closeLightbox();
        }
    }, [closeLightbox]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            closeButtonRef.current?.focus();

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, handleKeyDown]);

    const modal = isOpen ? createPortal(
        <div
            className={styles.backdrop}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label={alt || 'Image preview'}
        >
            <div className={styles.container}>
                <button
                    ref={closeButtonRef}
                    className={styles.closeButton}
                    onClick={closeLightbox}
                    aria-label="Close image preview"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
                <img
                    src={src}
                    alt={alt}
                    className={styles.lightboxImage}
                />
                {alt && (
                    <p className={styles.caption}>{alt}</p>
                )}
            </div>
        </div>,
        document.body,
    ) : null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                onClick={openLightbox}
                aria-haspopup="dialog"
                aria-label={`View larger: ${alt || 'image'}`}
            >
                <img
                    src={src}
                    alt={alt}
                    className={`${styles.thumbnail} ${className || ''}`}
                    {...props}
                />
                <span className={styles.expandHint}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    <span>{i18n.t('Click to expand')}</span>
                </span>
            </button>
            {modal}
        </>
    );
};
