import React, { useState } from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './PredictionAnimation.module.css';
import { usePredictionChart, type PredictionAnimationStep } from './usePredictionChart';

highchartsMore(Highcharts);

export type { PredictionAnimationStep };

const INTERACTIVE_STEPS: readonly PredictionAnimationStep[] = [2, 3, 4] as const;
const INITIAL_INTERACTIVE_STEP = INTERACTIVE_STEPS[0];

interface NavigationButtonsProps {
    step: PredictionAnimationStep;
    setStep: React.Dispatch<React.SetStateAction<PredictionAnimationStep>>;
}

const NavigationButtons = ({ step, setStep }: NavigationButtonsProps) => {
    const handlePrevious = () => {
        const currentIndex = INTERACTIVE_STEPS.indexOf(step);
        if (currentIndex > 0) {
            setStep(INTERACTIVE_STEPS[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        const currentIndex = INTERACTIVE_STEPS.indexOf(step);
        if (currentIndex < INTERACTIVE_STEPS.length - 1) {
            setStep(INTERACTIVE_STEPS[currentIndex + 1]);
        }
    };

    const currentIndex = INTERACTIVE_STEPS.indexOf(step);
    const isFirstStep = currentIndex <= 0;
    const isLastStep = currentIndex >= INTERACTIVE_STEPS.length - 1;

    return (
        <div className={styles.buttonContainer}>
            <button
                className={styles.navButton}
                onClick={handlePrevious}
                disabled={isFirstStep}
                aria-label="Previous step"
            >
                ←
            </button>
            <button
                className={styles.navButton}
                onClick={handleNext}
                disabled={isLastStep}
                aria-label="Next step"
            >
                →
            </button>
        </div>
    );
};

interface PredictionAnimationProps {
    step?: PredictionAnimationStep;
    showButtons?: boolean;
}

export const PredictionAnimation = ({ step = 0, showButtons = false }: PredictionAnimationProps) => {
    const [internalStep, setInternalStep] = useState<PredictionAnimationStep>(INITIAL_INTERACTIVE_STEP);
    const currentStep = showButtons ? internalStep : step;
    const options = usePredictionChart(currentStep);

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
            {showButtons && (
                <NavigationButtons step={internalStep} setStep={setInternalStep} />
            )}
        </div>
    );
};
