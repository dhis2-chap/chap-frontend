import React from 'react'
import styles from './NewDatasetDrawer.module.css'
import Drawer from 'react-modern-drawer'
import 'react-modern-drawer/dist/index.css'
import NewDatasetStepper from '../NewDatasetStepper/NewDatasetStepper'

interface NewDatasetDrawerProps {
    isOpen: boolean
    onDrawerSubmit: () => void
    onDrawerClose: () => void
}

const NewDatasetDrawer = ({
    isOpen,
    onDrawerSubmit,
    onDrawerClose,
}: NewDatasetDrawerProps) => {
    const size = window.innerWidth < 900 ? '100vw' : '1000px'

    return (
        <div>
            <Drawer
                open={isOpen}
                onClose={onDrawerClose}
                direction="right"
                size={size}
            >
                <div className={styles.drawerWrapper}>
                    <NewDatasetStepper
                        onDrawerClose={onDrawerClose}
                        onDrawerSubmit={onDrawerSubmit}
                    />
                </div>
            </Drawer>
        </div>
    )
}

export default NewDatasetDrawer
