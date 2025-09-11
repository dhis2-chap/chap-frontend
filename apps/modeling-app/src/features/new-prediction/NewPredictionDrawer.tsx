import React from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import styles from './NewPredictionDrawer.module.css';
import NewPredictionForm from './NewPredictionForm/NewPredictionForm';

interface NewPredictionDrawerProps {
    onDrawerClose: () => void;
    onDrawerSubmit: () => void;
    isOpen: boolean;
}

const NewPredictionDrawer = ({
    onDrawerClose,
    isOpen,
    onDrawerSubmit,
}: NewPredictionDrawerProps) => {
    const size = window.innerWidth < 900 ? '100vw' : '1000px';

    return (
        <div>
            <Drawer
                open={isOpen}
                onClose={onDrawerClose}
                direction="right"
                size={size}
            >
                <div className={styles.drawerWrapper}>
                    <NewPredictionForm
                        onDrawerClose={onDrawerClose}
                        onDrawerSubmit={onDrawerSubmit}
                    />
                </div>
            </Drawer>
        </div>
    );
};

export default NewPredictionDrawer;
