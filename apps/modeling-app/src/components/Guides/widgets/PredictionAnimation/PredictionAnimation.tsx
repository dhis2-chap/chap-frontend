import React, { useState } from 'react';
import Highcharts from 'highcharts';
import highchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import styles from './PredictionAnimation.module.css';
import { usePredictionChart, type PredictionAnimationStep } from './usePredictionChart';

// Initialize highcharts-more for arearange support
highchartsMore(Highcharts);

export type { PredictionAnimationStep };

interface NavigationButtonsProps {
    step: PredictionAnimationStep;
    setStep: React.Dispatch<React.SetStateAction<PredictionAnimationStep>>;
}

const NavigationButtons = ({ step, setStep }: NavigationButtonsProps) => {
    const handlePrevious = () => {
        setStep(prev => (prev > 2 ? (prev - 1) as PredictionAnimationStep : prev));
    };

    const handleNext = () => {
        setStep(prev => (prev < 4 ? (prev + 1) as PredictionAnimationStep : prev));
    };

    return (
        <div className={styles.buttonContainer}>
            <button
                className={styles.navButton}
                onClick={handlePrevious}
                disabled={step <= 2}
                aria-label="Previous step"
            >
                ←
            </button>
            <button
                className={styles.navButton}
                onClick={handleNext}
                disabled={step >= 4}
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
    const [internalStep, setInternalStep] = useState<PredictionAnimationStep>(2);
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
