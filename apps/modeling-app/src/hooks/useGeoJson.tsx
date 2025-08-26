import { useDataQuery } from "@dhis2/app-runtime";

export const ORG_UNITS_QUERY = {
    geojson: {
        resource: "organisationUnits.geojson",
        params: ({ level }: { level: number }) => ({
            level,
        }),
    },
};

const parseOrgUnits = (data : any) => {
  return {   
    features : data.geojson.features.map(({ type, id, geometry, properties } : any) => ({
        type,
        id,
        properties: properties,
        geometry
  })),
  ...data,}
}

//Avoid to export all the orgUnits to JSON, only inlcude those returned from one of the analytic requests (precipitation)
const filterOrgUnits = (geoJson : any, orgUnits : { id: string, displayName : string }[]) => {

  return {
    type: 'FeatureCollection',
    features: (geoJson as any).features.filter((o: any) => {
      return orgUnits.some(
        (id: { id: string, displayName : string }) => id.id === o.id || o.properties.parentGraph.includes(id.id)
      );
    }),
  };
};


const useGeoJson = (level : number, orgUnits : any[]) => {

    const { data, loading, error } = useDataQuery(ORG_UNITS_QUERY as any, {
      variables: { level }});

    return {
      data : data ? filterOrgUnits(parseOrgUnits(data), orgUnits) : data,
      error,
      loading,
    };
}

export default useGeoJson;