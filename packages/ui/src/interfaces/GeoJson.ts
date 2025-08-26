export interface GeoJson {
    type: string
    features: Feature[]
}

export interface Feature {
    type: string
    id: string
    geometry: Geometry
    properties: Properties
}

export interface Geometry {
    type: string
    coordinates: any[][][]
}

export interface Properties {
    code?: string
    name: string
    level: string
    parent: string
    parentGraph: string
    groups: string[]
}
