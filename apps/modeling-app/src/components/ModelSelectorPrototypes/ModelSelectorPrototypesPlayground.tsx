import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import cn from 'classnames';
import { NoticeBox, IconCheckmarkCircle16 } from '@dhis2/ui';
import { ModelSpecRead } from '@dhis2-chap/ui';
import { mockModels } from './mockModels';
import { getModelName } from './shared/modelDisplay';
import { GuidedModelSelector } from './prototypes/GuidedModelSelector';
import { SplitModelSelector } from './prototypes/SplitModelSelector';
import { CommandModelSelector } from './prototypes/CommandModelSelector';
import styles from './ModelSelectorPrototypesPlayground.module.css';

type PrototypeKey = 'guided' | 'split' | 'command';

const PROTOTYPES: {
    key: PrototypeKey;
    name: string;
    tagline: string;
    description: string;
}[] = [
    {
        key: 'guided',
        name: i18n.t('A · Guided'),
        tagline: i18n.t('Recommendation-first'),
        description: i18n.t(
            'Leads with one clearly recommended model and a plain-language summary. Everything else is tucked behind a single "browse all" toggle, so first-time users are never overwhelmed.',
        ),
    },
    {
        key: 'split',
        name: i18n.t('B · Split view'),
        tagline: i18n.t('Browse & inspect'),
        description: i18n.t(
            'A scannable list of names on the left, full details for the highlighted model on the right. Only one model\'s details are ever shown at once, which removes the crowding of the current grid.',
        ),
    },
    {
        key: 'command',
        name: i18n.t('C · Command palette'),
        tagline: i18n.t('Search-first & fast'),
        description: i18n.t(
            'A minimal, keyboard-driven search box with compact one-line results and quick readiness filters. Built for speed once a user knows roughly what they want.',
        ),
    },
];

export const ModelSelectorPrototypesPlayground = () => {
    const [active, setActive] = useState<PrototypeKey>('guided');
    const [selected, setSelected] = useState<ModelSpecRead | undefined>(undefined);

    const handleSelect = (model: ModelSpecRead) => setSelected(model);
    const activePrototype = PROTOTYPES.find(p => p.key === active)!;
    const selectedModelId = selected?.id.toString();

    return (
        <div className={styles.container}>
            <NoticeBox title={i18n.t('Prototype playground')}>
                {i18n.t(
                    'Three different directions for the model selector, each rendered with the same mock model list. Switch between them and try selecting a model. Nothing here is wired to a backend yet.',
                )}
            </NoticeBox>

            <div className={styles.tabs} role="tablist">
                {PROTOTYPES.map(prototype => (
                    <button
                        key={prototype.key}
                        type="button"
                        role="tab"
                        aria-selected={active === prototype.key}
                        className={cn(styles.tab, { [styles.tabActive]: active === prototype.key })}
                        onClick={() => setActive(prototype.key)}
                        data-test={`prototype-tab-${prototype.key}`}
                    >
                        <span className={styles.tabName}>{prototype.name}</span>
                        <span className={styles.tabTagline}>{prototype.tagline}</span>
                    </button>
                ))}
            </div>

            <p className={styles.description}>{activePrototype.description}</p>

            <div className={styles.stage}>
                {active === 'guided' && (
                    <GuidedModelSelector
                        models={mockModels}
                        selectedModelId={selectedModelId}
                        onSelect={handleSelect}
                    />
                )}
                {active === 'split' && (
                    <SplitModelSelector
                        models={mockModels}
                        selectedModelId={selectedModelId}
                        onSelect={handleSelect}
                    />
                )}
                {active === 'command' && (
                    <CommandModelSelector
                        models={mockModels}
                        selectedModelId={selectedModelId}
                        onSelect={handleSelect}
                    />
                )}
            </div>

            <div className={cn(styles.selectionBar, { [styles.selectionBarActive]: !!selected })}>
                <IconCheckmarkCircle16 color={selected ? '#1565c0' : '#b0b0b0'} />
                {selected
                    ? i18n.t('Selected model{{colon}} {{name}}', { colon: ':', name: getModelName(selected) })
                    : i18n.t('No model selected yet')}
            </div>
        </div>
    );
};
