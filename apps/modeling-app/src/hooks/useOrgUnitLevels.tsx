import { useDataQuery } from "@dhis2/app-runtime";

const ORG_UNIT_LEVELS_QUERY = {
  levels: {
    resource: "organisationUnitLevels",
    params: {
      fields: ["id", "displayName~rename(name)", "level"],
      order: "level:asc",
      paging: false,
    },
  },
};

const useOrgUnitLevels = () => {
  const { loading, error, data } = useDataQuery(ORG_UNIT_LEVELS_QUERY);

  return {
    levels: (data?.levels as any)?.organisationUnitLevels as [],
    error,
    loading,
  };
};

export default useOrgUnitLevels;
