export type PossiblyDynamic<Type, InputType> = Type | ((input: InputType) => Type);
export type QueryVariables = Record<string, any>;

type QueryParameterSingularValue = string | number | boolean;
interface QueryParameterAliasedValue {
    [name: string]: QueryParameterSingularValue;
}
type QueryParameterSingularOrAliasedValue = QueryParameterSingularValue | QueryParameterAliasedValue;
type QueryParameterMultipleValue = QueryParameterSingularOrAliasedValue[];
export type QueryParameterValue = QueryParameterSingularValue | QueryParameterAliasedValue | QueryParameterMultipleValue | undefined;

export interface QueryParameters {
    pageSize?: number;
    [key: string]: QueryParameterValue;
}

export interface ResourceQuery {
    resource: string;
    id?: PossiblyDynamic<string, QueryVariables>;
    data?: PossiblyDynamic<any, QueryVariables>;
    params?: PossiblyDynamic<QueryParameters, QueryVariables>;
} 