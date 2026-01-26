import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui';
import { IconUpload24 } from '@dhis2/ui-icons';
import i18n from '@dhis2/d2-i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import classnames from 'classnames';
import styles from './UploadTemplateModal.module.css';
import { useUploadModelTemplate } from '../hooks';

const schema = z.object({
    zipFile: z
        .instanceof(File)
        .refine(file => file.name.endsWith('.zip'), {
            message: i18n.t('File must be a ZIP archive'),
        }),
});

type UploadTemplateFormValues = z.infer<typeof schema>;

interface UploadTemplateModalProps {
    onClose: () => void;
}

export const UploadTemplateModal = ({ onClose }: UploadTemplateModalProps) => {
    const {
        uploadTemplate,
        isUploading,
    } = useUploadModelTemplate({
        onSuccess: () => {
            onClose();
        },
    });

    const {
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isValid },
    } = useForm<UploadTemplateFormValues>({
        resolver: zodResolver(schema),
        mode: 'onSubmit',
        defaultValues: {
            zipFile: undefined,
        },
    });

    const zipFile = watch('zipFile');

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/zip': ['.zip'] },
        multiple: false,
        onDrop: (acceptedFiles: File[]) => {
            if (acceptedFiles[0]) {
                setValue('zipFile', acceptedFiles[0], { shouldValidate: true });
            }
        },
    });

    const handleFormSubmit = (data: UploadTemplateFormValues) => {
        uploadTemplate({ zip_file: data.zipFile });
    };

    const handleRemoveFile = () => {
        reset();
    };

    const dropzoneClasses = classnames(styles.dropzone, {
        [styles.dropzoneActive]: isDragActive,
        [styles.dropzoneError]: errors.zipFile,
    });

    return (
        <Modal onClose={onClose} dataTest="upload-template-modal">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <ModalTitle>{i18n.t('Upload model template')}</ModalTitle>
                <ModalContent>
                    <div className={styles.fileInputWrapper}>
                        <label className={styles.srOnly} htmlFor="zip-file-input">
                            {i18n.t('Template ZIP file')}
                        </label>
                        {zipFile ? (
                            <div className={styles.selectedFile}>
                                <span className={styles.fileName}>{zipFile.name}</span>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={handleRemoveFile}
                                    aria-label={i18n.t('Remove file')}
                                    data-test="remove-file-button"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div
                                {...getRootProps()}
                                className={dropzoneClasses}
                                data-test="upload-template-dropzone"
                            >
                                <input {...getInputProps()} id="zip-file-input" />
                                <span className={styles.dropzoneIcon}>
                                    <IconUpload24 />
                                </span>
                                <span className={styles.dropzoneText}>
                                    {i18n.t('Drag and drop a ZIP file here')}
                                </span>
                                <span className={styles.dropzoneSubtext}>
                                    {i18n.t('or click to browse')}
                                </span>
                            </div>
                        )}
                        <span className={styles.helpText}>
                            {i18n.t('The ZIP file must contain an MLproject file at the root level.')}
                        </span>
                        {errors.zipFile && (
                            <span className={styles.errorText}>
                                {errors.zipFile.message}
                            </span>
                        )}
                    </div>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isUploading}
                            dataTest="cancel-upload-template-button"
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isUploading}
                            disabled={!isValid || isUploading}
                            dataTest="submit-upload-template-button"
                        >
                            {i18n.t('Upload')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
};
