declare module '*.mdx' {
    import type { MDXProps } from 'mdx/types'
    export default function MDXContent(props: MDXProps): JSX.Element
    export const frontmatter: Record<string, unknown>
}

declare module '*.md' {
    import type { MDXProps } from 'mdx/types'
    export default function MDContent(props: MDXProps): JSX.Element
    export const frontmatter: Record<string, unknown>
}
