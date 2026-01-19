import { useMutation } from '@tanstack/react-query'

const copyToClipboardFn = async (text: string): Promise<void> => {
    if (!navigator?.clipboard) {
        throw new Error('Clipboard API not available')
    }
    await navigator.clipboard.writeText(text)
}

type Props = {
    onSuccess?: () => void
    onError?: () => void
}

export const useCopyToClipboard = ({ onSuccess, onError }: Props = {}) => {
    const mutation = useMutation<void, Error, string>({
        mutationFn: copyToClipboardFn,
        onSuccess: () => {
            setTimeout(() => {
                mutation.reset()
            }, 1500)
            onSuccess?.()
        },
        onError: () => {
            onError?.()
        },
    })

    return {
        copy: mutation.mutate,
        isCopied: mutation.isSuccess,
        isLoading: mutation.isLoading,
        error: mutation.error,
        reset: mutation.reset,
    }
}
