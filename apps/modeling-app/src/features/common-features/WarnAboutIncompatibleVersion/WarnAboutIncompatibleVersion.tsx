import { NoticeBox } from '@dhis2/ui';
import style from './WarnAboutIncompatibleVersion.module.css';
import { DefaultService } from '@dhis2-chap/ui';
import { useConfig } from '@dhis2/app-runtime';
import { useRoute } from '../../../hooks/useRoute';
import chapConfig from '../../../chap.json';
import { useChapStatus } from '../../settings/ChapSettings/hooks/useChapStatus';
import { isVersionCompatible } from '../../../utils/compareVersions';
import { useQuery } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';

const WarnAboutIncompatibleVersion = () => {
    const { appVersion } = useConfig();
    const appVersionFull = appVersion?.full;

    const { route } = useRoute();
    const { status } = useChapStatus({ route });

    const clientCompatibleCheck =
        status &&
        isVersionCompatible(status.chap_core_version, chapConfig.minChapVersion);

    const { data: backendCompatibleCheck, isError } = useQuery({
        queryKey: ['is-compatible', route?.url, appVersionFull],
        queryFn: async () =>
            await DefaultService.isCompatibleIsCompatibleGet(appVersionFull!),
        enabled: !!appVersionFull,
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    const anyNotCompatible =
        clientCompatibleCheck === false
        || backendCompatibleCheck?.compatible === false
        || isError;

    return (
        <>
            {anyNotCompatible && (
                <div
                    className={style.warningMargin}
                    style={{ maxInlineSize: '1400px' }}
                >
                    <div className={style.warningMarginInner}>
                        <NoticeBox error title="Incompatible versions">
                            <div>
                                {i18n.t(
                                    'The version of the Modeling App is not compatible with the backend (Chap core).',
                                )}
                            </div>
                            <br />

                            {!backendCompatibleCheck?.compatible && (
                                <p className={style.resultDescription}>
                                    <i>{backendCompatibleCheck?.description}</i>
                                </p>
                            )}
                            {isError && (
                                <p className={style.resultDescription}>
                                    <i>
                                        Not able to check if the app is
                                        compatible with the Chap Core you are
                                        using, which means you are probably
                                        using an old version of Chap Core. See
                                        https://github.com/dhis2-chap/chap-core/releases/
                                        for information on how to update.
                                    </i>
                                </p>
                            )}
                            {clientCompatibleCheck === false && (
                                <p className={style.resultDescription}>
                                    <i>
                                        {i18n.t(
                                            'The Chap Core version {{chapVersion}} is too old. The Modeling App specifies minimum Chap core version{{escape}} {{chapMinVersion}}',
                                            {
                                                chapVersion:
                                                    status?.chap_core_version,
                                                chapMinVersion:
                                                    chapConfig.minChapVersion,
                                                escape: ':',
                                            },
                                        )}
                                    </i>
                                </p>
                            )}
                        </NoticeBox>
                    </div>
                </div>
            )}
        </>
    );
};

export default WarnAboutIncompatibleVersion;
