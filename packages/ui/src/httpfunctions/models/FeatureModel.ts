/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LineString } from './LineString';
import type { MultiLineString } from './MultiLineString';
import type { MultiPoint } from './MultiPoint';
import type { MultiPolygon } from './MultiPolygon';
import type { Point } from './Point';
import type { Polygon } from './Polygon';
/**
 * GeoJSON `Feature` carrying one org-unit polygon plus DHIS2-style metadata.
 *
 * Loosens upstream `geojson_pydantic.Feature` so `id` may be omitted and
 * `geometry` may be any geometry variant or `None`.
 */
export type FeatureModel = {
    bbox?: (any[] | null);
    type: string;
    /**
     * GeoJSON geometry. Any of the standard variants, or `None` if unknown.
     */
    geometry?: (Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | null);
    /**
     * Free-form properties attached to the feature.
     */
    properties?: (Record<string, any> | null);
    /**
     * External identifier of the org unit (DHIS2 id), if known.
     */
    id?: (string | null);
};

