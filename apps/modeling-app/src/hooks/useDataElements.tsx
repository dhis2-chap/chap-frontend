import { useState } from "react";
import { useDataQuery } from "@dhis2/app-runtime";

const REQUEST = (code : string) => {
  return { dataElements : {
    resource: "dataElements",
    params: {
      paging : false,
      fields : ["code", "displayName", "id"],
      //Get everyting that starts with CHAP-prefix (CHAP_LOW, CHAP_MEDIAN and CHAP_HIGH)
      filter : `code:ilike:${code}`,
    }
  }
}
}

const useDataElements = (codePrefix : "CHAP_LOW" | "CHAP_MEDIAN" | "CHAP_HIGH") => {
  const [dataElements, setDataElements] = useState<any[]>();

  const { loading, error } = useDataQuery(REQUEST(codePrefix), {
    onComplete: (data : any) => setDataElements(data.dataElements.dataElements),
  });

  return {
    dataElements,
    error,
    loading,
  };
};

export default useDataElements;
