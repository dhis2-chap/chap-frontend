import React, { useEffect } from "react"
import { Card, CircularLoader } from "@dhis2/ui"
import i18n from "@dhis2/d2-i18n"
import { useRoute } from "../../../hooks/useRoute"
import styles from './RouteSettings.module.css'
import { CreateRoute } from "./CreateRoute/CreateRoute"
import { RouteActions } from "./RouteActions"
import { PublicAccessWarning } from "./PublicAccessWarning";
import { useAuthority } from "../../../hooks/useAuthority";

const RouteWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Card>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>{i18n.t('Route settings')}</h2>
                </div>
                {children}
            </div>
        </Card>
    )
}

const ROUTE_AUTHORITY_PRIVATE_ADD = 'F_ROUTE_PRIVATE_ADD'
const ROUTE_AUTHORITY_PUBLIC_ADD = 'F_ROUTE_PUBLIC_ADD'

export const RouteSettings = () => {
    const {
        route,
        isLoading: isRouteLoading,
        error: routeError,
    } = useRoute();

    const {
        hasAuthority: canAddRoute,
        isLoading: canAddRouteLoading,
    } = useAuthority({
        authority: [ROUTE_AUTHORITY_PRIVATE_ADD, ROUTE_AUTHORITY_PUBLIC_ADD]
    })

    useEffect(() => {
        if (routeError) {
            console.error(routeError)
        }
    }, [routeError])

    if (isRouteLoading || canAddRouteLoading) {
        return (
            <RouteWrapper>
                <div className={styles.loaderContainer}>
                    <CircularLoader />
                </div>
            </RouteWrapper>
        )
    }

    if (routeError) {
        return (
            <RouteWrapper>
                <div className={styles.loaderContainer}>
                    <p className={styles.mutedText}>{i18n.t('There was an error loading the route settings. Please try to reload the page.')}</p>

                    <p className={styles.mutedText}>{i18n.t('If the problem persists, please contact your system administrator.')}</p>
                </div>
            </RouteWrapper>
        )
    }

    if (!canAddRoute) {
        return (
            <RouteWrapper>
                <div className={styles.loaderContainer}>
                    <p className={styles.mutedText}>{i18n.t('You do not have permission to add or modify routes.')}</p>

                    <p className={styles.mutedText}>{i18n.t('If you think this is an error, please contact your system administrator.')}</p>
                </div>
            </RouteWrapper>
        )
    }

    if (!route) {
        return (
            <RouteWrapper>
                <CreateRoute />
            </RouteWrapper>
        )
    }

    return (
        <RouteWrapper>
            <div className={styles.settingsContainer}>

                <PublicAccessWarning route={route} />

                <div className={styles.routeInfo}>
                    <div className={styles.routeInfoHeader}>
                        <h3>{i18n.t('Route configuration')}</h3>

                        <RouteActions route={route} />
                    </div>
                    <div className={styles.infoGrid}>
                        <span className={styles.label}>{i18n.t('Name')}</span>
                        <span className={styles.value}>{route.displayName}</span>

                        <span className={styles.label}>{i18n.t('Code')}</span>
                        <span className={styles.value}>{route.code}</span>

                        <span className={styles.label}>{i18n.t('URL')}</span>
                        <span className={styles.value}>{route.url}</span>

                        {route.authorities.length > 0 ? (
                            <>
                                <span className={styles.label}>{i18n.t('Authorities')}</span>
                                <div className={styles.authorities}>
                                    {route.authorities.map((authority, index) => (
                                        <span key={index} className={styles.authority}>
                                            {authority}
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </RouteWrapper>
    )
}