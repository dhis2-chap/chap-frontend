import { useEffect, useState } from "react";
import { useDataQuery } from "@dhis2/app-runtime";

const REQUEST = (id : string) => {
    return { dataElements : {
      resource: "dataElements",
      params: {
        paging : false,
        filter : `id:eq:${id}`,
      }
    }
  }
}

const useDataElement = (id : string | null) => {

  const [displayName, setDisplayName] = useState<any>();
  const { loading, error, engine } = useDataQuery({});
  
  useEffect(() => {
    if(!id) return;
    fetchDataElement()
  }, [id])

  const fetchDataElement = async () => {
    const r : any = await engine.query(REQUEST(id as string));
    if(r.dataElements.dataElements.length === 0) return;
    setDisplayName(r.dataElements.dataElements[0].displayName);
  }

  return {
    displayName,
    error,
    loading,
  };
};

export default useDataElement;
