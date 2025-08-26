import React, { useState } from 'react'
import styles from './styles/SetupInstruction.module.css'
import { Button, IconAdd24 } from '@dhis2/ui'
import ModalInstruction from './ModalInstruction'
import i18n from '@dhis2/d2-i18n'

interface SetupInstructionProps {
    predictionTarget: string
    warning: boolean
}

const SetupInstruction = ({
    predictionTarget,
    warning,
}: SetupInstructionProps) => {
    const [isModalOpen, setModalOpen] = useState(false)

    return (
        <>
            <div className={warning ? styles.wrapperWarning : styles.wrapper}>
                <div className={styles.textWarning}>
                    {warning && (
                        <>
                            <p>
                                {i18n.t(
                                    'It seems like you missing Data Elements for CHAP prediction.'
                                )}
                            </p>
                        </>
                    )}
                </div>
                <div>
                    <Button
                        icon={<IconAdd24 />}
                        onClick={() => setModalOpen(true)}
                    >
                        {i18n.t('Add data elements')}
                    </Button>
                </div>
            </div>
            <ModalInstruction
                modalOpen={isModalOpen}
                setModalOpen={setModalOpen}
                predictionTarget={predictionTarget}
            />
        </>
    )
}

export default SetupInstruction
