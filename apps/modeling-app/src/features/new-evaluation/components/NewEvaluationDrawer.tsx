import React from 'react'
import styles from './NewEvaluationDrawer.module.css'
import Drawer from 'react-modern-drawer'
import 'react-modern-drawer/dist/index.css'
import NewEvaluationForm from './NewEvaluationForm/NewEvaluationForm'

interface NewEvaluationDrawerProps{
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  datasetIdToEvaluate: any | undefined
}

const NewEvaluationDrawer = ({isOpen, setIsOpen, datasetIdToEvaluate } : NewEvaluationDrawerProps) => {

  const size = window.innerWidth < 900 ? '100vw' : '1000px'

  return (
    <div>
        <Drawer
            open={isOpen}
            onClose={() => setIsOpen(false)}
            direction='right'
            size={size}
        >
            <div className={styles.drawerWrapper}>
                <NewEvaluationForm onDrawerClose={() => setIsOpen(false)} datasetIdToEvaluate={datasetIdToEvaluate}/>
            </div>
        </Drawer>
    </div>
  )
}

export default NewEvaluationDrawer