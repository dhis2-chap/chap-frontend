import { Tooltip } from '@dhis2/ui';

type Props = {
    sourceDigest?: string | null;
    sourceUrl?: string | null;
};

const getCommitUrl = (sourceUrl: string | null | undefined, sha: string): string | undefined => {
    if (!sourceUrl) {
        return undefined;
    }

    try {
        const url = new URL(sourceUrl);
        const [owner, repository] = url.pathname.split('/').filter(Boolean);
        if (
            !['https:', 'http:'].includes(url.protocol)
            || !['github.com', 'www.github.com'].includes(url.hostname)
            || !owner
            || !repository
        ) {
            return undefined;
        }

        return `https://github.com/${owner}/${repository.replace(/\.git$/, '')}/commit/${encodeURIComponent(sha)}`;
    } catch {
        return undefined;
    }
};

export const ModelCommit = ({ sourceDigest, sourceUrl }: Props) => {
    if (!sourceDigest) {
        return <>—</>;
    }

    const shortSha = sourceDigest.slice(0, 7);
    const commitUrl = getCommitUrl(sourceUrl, sourceDigest);

    return (
        <Tooltip content={sourceDigest}>
            {commitUrl ? (
                <a href={commitUrl} target="_blank" rel="noreferrer">
                    {shortSha}
                </a>
            ) : shortSha}
        </Tooltip>
    );
};
