export interface OrgUnit {
  displayName: string;
  id : string;
  children : number;
  path : string;
}

export interface IOrgUnitLevel {
  id : string;
  level : number;
}