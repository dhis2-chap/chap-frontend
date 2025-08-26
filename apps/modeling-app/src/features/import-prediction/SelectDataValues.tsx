import React from 'react'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import styles from './styles/SelectDataValues.module.css'
import i18n from '@dhis2/d2-i18n'

interface SelectDataValuesProps {
    label: string
    dataElements: any[] | undefined
    value: { displayName: string; id: string } | null
    onChange: (v: { displayName: string; id: string }) => void
}

const SelectDataValues = ({
    value,
    onChange,
    label,
    dataElements,
}: SelectDataValuesProps) => {
    const onChangeSelect = (e: any) => {
        onChange({
            displayName: dataElements?.find((d: any) => d.id === e.selected)
                .displayName,
            id: e.selected,
        })
    }

    const noDataElements =
        dataElements?.length === 0 && dataElements != undefined

    return (
        <div>
            <div>
                <div className={styles.select}>
                    <div className={styles.selectWrapper}>
                        <span>{label}</span>
                        <SingleSelectField
                            tabIndex="1"
                            placeholder={i18n.t('Select data element')}
                            disabled={noDataElements}
                            selected={value ? value.id : ''}
                            warning={noDataElements}
                            onChange={onChangeSelect}
                        >
                            {dataElements?.map((de: any) => (
                                <SingleSelectOption
                                    key={de.id}
                                    label={de.displayName}
                                    value={de.id}
                                />
                            ))}
                        </SingleSelectField>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SelectDataValues
