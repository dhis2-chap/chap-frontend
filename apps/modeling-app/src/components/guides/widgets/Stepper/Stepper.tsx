import {
    type ReactNode,
    type ReactElement,
    useState,
    Children,
    isValidElement,
} from 'react';
import { Button } from '@dhis2/ui';
import styles from './Stepper.module.css';

interface StepProps {
    title: string;
    children: ReactNode;
}

export const Step = ({ children }: StepProps) => {
    return <div className={styles.stepContent}>{children}</div>;
};

interface StepperProps {
    children: ReactNode;
}

export const Stepper = ({ children }: StepperProps) => {
    const [activeStep, setActiveStep] = useState(0);

    const steps = Children.toArray(children).filter(
        (child): child is ReactElement<StepProps> =>
            isValidElement(child) && child.type === Step
    );

    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handlePrev = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    const handleStepClick = (index: number) => {
        setActiveStep(index);
    };

    return (
        <div className={styles.stepper}>
            <div className={styles.stepList}>
                {steps.map((step, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`${styles.stepItem} ${
                            index === activeStep ? styles.active : ''
                        } ${index < activeStep ? styles.completed : ''}`}
                        onClick={() => handleStepClick(index)}
                    >
                        <span className={styles.stepNumber}>{index + 1}</span>
                        <span className={styles.stepTitle}>
                            {step.props.title}
                        </span>
                    </button>
                ))}
            </div>

            <div className={styles.stepPanel}>{steps[activeStep]}</div>

            <div className={styles.navigation}>
                <Button
                    small
                    disabled={activeStep === 0}
                    onClick={handlePrev}
                >
                    Previous
                </Button>
                <span className={styles.progress}>
                    Step {activeStep + 1} of {steps.length}
                </span>
                <Button
                    small
                    primary
                    disabled={activeStep === steps.length - 1}
                    onClick={handleNext}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
