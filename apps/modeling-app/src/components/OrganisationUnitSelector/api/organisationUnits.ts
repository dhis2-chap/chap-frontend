import { onError } from './index';
import { useDataEngine } from '@dhis2/app-runtime';

type DataEngine = ReturnType<typeof useDataEngine>;

interface OrganisationUnitLevel {
    id: string;
    level: number;
    displayName: string;
    name: string;
}

interface OrganisationUnitGroup {
    id: string;
    displayName: string;
    name: string;
}

interface OrganisationUnit {
    id: string;
    displayName: string;
    name: string;
    path?: string;
    level?: number;
    parent?: {
        id: string;
        name: string;
    };
    children?: Array<{ level: number }>;
}

interface QueryParams {
    displayNameProp?: string;
}

const orgUnitLevelsQuery = {
    resource: 'organisationUnitLevels',
    params: ({ displayNameProp = 'displayName' }: QueryParams = {}) => ({
        fields: `id,level,${displayNameProp}~rename(displayName),name`,
        paging: false,
    }),
};

const orgUnitGroupsQuery = {
    resource: 'organisationUnitGroups',
    params: ({ displayNameProp = 'displayName' }: QueryParams = {}) => ({
        fields: `id,${displayNameProp}~rename(displayName),name`,
        paging: false,
    }),
};

const orgUnitRootsQuery = {
    resource: 'organisationUnits',
    params: {
        fields: 'id,displayName,name',
        userDataViewFallback: true,
        paging: false,
    },
};

const orgUnitQuery = {
    resource: 'organisationUnits',
    id: ({ id }: { id: string }) => id,
    params: {
        fields: 'id,level,displayName~rename(name),path,parent[id,displayName~rename(name)],children[level]',
        userDataViewFallback: true,
        paging: false,
    },
};

export const apiFetchOrganisationUnitLevels = async (dataEngine: DataEngine): Promise<OrganisationUnitLevel[]> => {
    const orgUnitLevelsData = await dataEngine.query(
        { orgUnitLevels: orgUnitLevelsQuery },
        {
            onError,
        },
    );

    return (orgUnitLevelsData as any).orgUnitLevels.organisationUnitLevels;
};

export const apiFetchOrganisationUnitGroups = async (
    dataEngine: DataEngine,
    displayNameProp?: string,
): Promise<OrganisationUnitGroup[]> => {
    const orgUnitGroupsData = await dataEngine.query(
        { orgUnitGroups: orgUnitGroupsQuery },
        {
            variables: {
                displayNameProp,
            },
            onError,
        },
    );

    return (orgUnitGroupsData as any).orgUnitGroups.organisationUnitGroups;
};

export const apiFetchOrganisationUnitRoots = async (dataEngine: DataEngine): Promise<OrganisationUnit[]> => {
    const orgUnitRootsData = await dataEngine.query(
        { orgUnitRoots: orgUnitRootsQuery },
        {
            onError,
        },
    );

    return (orgUnitRootsData as any).orgUnitRoots.organisationUnits;
};

export const apiFetchOrganisationUnit = async (dataEngine: DataEngine, id: string): Promise<OrganisationUnit> => {
    const orgUnitData = await dataEngine.query(
        // @ts-expect-error - TODO: Fix this
        { orgUnit: orgUnitQuery },
        {
            variables: { id },
            onError,
        },
    );

    return (orgUnitData as any).orgUnit;
};
