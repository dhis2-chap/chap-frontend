import React from 'react'
import { createContext, useState, useRef, useEffect } from 'react'
import MapApi from '@dhis2/maps-gl'
import styles from './MapItem.module.css'

export const MapContext: any = createContext(null)

const MapItem = ({ syncId, children }: any) => {
    const [map, setMap] = useState(null)
    const mapEl = useRef(null)

    useEffect(() => {
        const map = new MapApi(mapEl.current)

        map.once('ready', () => setMap(map))
        map.sync(syncId)
        map.resize()

        return () => {
            map.remove()
        }
    }, [mapEl, syncId])

    return (
        <MapContext.Provider value={map}>
            <div ref={mapEl} className={styles.mapItem}>
                {map && children}
            </div>
        </MapContext.Provider>
    )
}

export default MapItem
