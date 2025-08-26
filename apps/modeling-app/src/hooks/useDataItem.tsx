import { useEffect, useState } from "react";
import { useDataQuery } from "@dhis2/app-runtime";

const REQUEST = (id : string) => {
    return { dataItems : {
      resource: "dataItems",
      params: {
        paging : false,
        filter : `id:eq:${id}`,
      }
    }
  }
}

const useFindDataItem = (id : string | null) => {

  const [displayName, setDisplayName] = useState<any>();
  const { loading, error, engine } = useDataQuery({});
  
  useEffect(() => {
    if(!id) return;
    fetchdataItems()
  }, [id])

  const fetchdataItems = async () => {
    const r : any = await engine.query(REQUEST(id as string));
    if(r.dataItems.dataItems.length === 0) {
      setDisplayName("?");
    }
    else{
      setDisplayName(r.dataItems.dataItems[0].displayName);
    }
    
  }

  return {
    displayName,
    error,
    loading,
  };
};

export default useFindDataItem;