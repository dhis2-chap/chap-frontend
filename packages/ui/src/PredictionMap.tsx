import type { ComponentProps } from 'react';
import { PredictionMap as SharedPredictionMap } from '@chap-blocks/ui/maps';

const defaultBasemap = {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
};

export const PredictionMap = ({ basemap = defaultBasemap, ...props }: ComponentProps<typeof SharedPredictionMap>) => (
    <SharedPredictionMap {...props} basemap={basemap} />
);
