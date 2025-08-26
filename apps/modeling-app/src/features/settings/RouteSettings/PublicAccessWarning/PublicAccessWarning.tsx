import React, { useMemo } from "react";
import { NoticeBox } from "@dhis2/ui";
import i18n from "@dhis2/d2-i18n";
import { Route } from "../../../../hooks/useRoute";

type Props = {
    route: Route;
}

export const PublicAccessWarning = ({ route }: Props) => {
    const isPublic = useMemo(() => {
        if (route.sharing.public.startsWith('rw')) {
            return true;
        }

        return false;
    }, [route.sharing.public]);

    if (!isPublic) {
        return null;
    }

    return (
        <NoticeBox warning title={i18n.t('Public access')}>
            {i18n.t('Your route is public and can be accessed by anyone. This can potentially expose sensitive data. If you want to restrict access, click the "Sharing" button and remove access for "All users".')}
        </NoticeBox>
    );
}; 