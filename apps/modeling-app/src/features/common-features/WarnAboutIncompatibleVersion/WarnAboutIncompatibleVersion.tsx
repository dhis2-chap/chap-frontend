import { NoticeBox } from '@dhis2/ui';
import style from './WarnAboutIncompatibleVersion.module.css';
import { useRoute } from '../../../hooks/useRoute';
import chapConfig from '../../../chap.json';
import { useChapStatus } from '../../settings/ChapSettings/hooks/useChapStatus';
import { isVersionCompatible } from '../../../utils/compareVersions';
import i18n from '@dhis2/d2-i18n';

const WarnAboutIncompatibleVersion = () => {
    const { route } = useRoute();
    const { status } = useChapStatus({ route });

    const clientCompatibleCheck =
        status &&
        isVersionCompatible(status.chap_core_version, chapConfig.minChapVersion);

    return (
        <>
            {clientCompatibleCheck === false && (
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
                        </NoticeBox>
                    </div>
                </div>
            )}
        </>
    );
};

export default WarnAboutIncompatibleVersion;
