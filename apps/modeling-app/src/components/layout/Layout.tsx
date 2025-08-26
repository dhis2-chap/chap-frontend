import React from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { Sidebar } from '../sidebar'
import css from './Layout.module.css'
import { RouteHandle } from '../../App'
import cx from 'classnames'

export const ID_MAIN_LAYOUT = 'main-layout'
interface BaseLayoutProps {
    children: React.ReactNode
    sidebar?: React.ReactNode
}

export const BaseLayout = ({ children, sidebar }: BaseLayoutProps) => {
    return (
        <div className={css.wrapper}>
            {sidebar}
            <div id={ID_MAIN_LAYOUT} className={css.main}>{children}</div>
        </div>
    )
}

export const SidebarLayout = ({
    children,
    hideSidebar,
    collapseSidebar = false,
}: {
    children: React.ReactNode
    hideSidebar?: boolean
    collapseSidebar?: boolean
}) => {
    return (
        <BaseLayout
            sidebar={
                <Sidebar
                    hideSidebar={collapseSidebar || hideSidebar}
                    className={cx(css.sidebar, { [css.hide]: hideSidebar })}
                />
            }
        >
            {children}
        </BaseLayout>
    )
}

export const Layout = () => {
    const collapseSidebar = useMatches().some(
        (match) => (match.handle as RouteHandle)?.collapseSidebar
    )
    return (
        <SidebarLayout collapseSidebar={collapseSidebar}>
            <Outlet />
        </SidebarLayout>
    )
}
