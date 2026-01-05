import type { ReactNode } from 'react';
import { MDXProvider as BaseMDXProvider } from '@mdx-js/react';
import { Callout, Stepper, Step, DataVisualization } from './widgets';
import styles from './MDXProvider.module.css';

interface MDXProviderProps {
    children: ReactNode;
}

const components = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1 className={styles.h1} {...props} />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className={styles.h2} {...props} />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className={styles.h3} {...props} />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className={styles.p} {...props} />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className={styles.ul} {...props} />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className={styles.ol} {...props} />
    ),
    li: (props: React.HTMLAttributes<HTMLLIElement>) => (
        <li className={styles.li} {...props} />
    ),
    code: (props: React.HTMLAttributes<HTMLElement>) => (
        <code className={styles.code} {...props} />
    ),
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
        <pre className={styles.pre} {...props} />
    ),
    blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote className={styles.blockquote} {...props} />
    ),
    hr: () => <hr className={styles.hr} />,
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a className={styles.a} {...props} />
    ),
    strong: (props: React.HTMLAttributes<HTMLElement>) => (
        <strong className={styles.strong} {...props} />
    ),
    Callout,
    Stepper,
    Step,
    DataVisualization,
};

export const MDXProvider = ({ children }: MDXProviderProps) => {
    return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>;
};
