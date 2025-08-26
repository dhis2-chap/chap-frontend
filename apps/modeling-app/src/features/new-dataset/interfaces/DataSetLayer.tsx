export interface DatasetLayer {
  feature : string;
  origin : "dataItem" | "CHAP" | "";
  dataSource : string;
}

export interface Feature {
  name : string;
  displayName : string;
  id : string
}

export interface Origins {
  name : string;
  displayName : string;
  id : string
}

export interface Datalayer {
  name : string;
  featureType : string;
  id : string
}