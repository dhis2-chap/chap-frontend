import { useEffect, useRef } from 'react'

const usePolling = (callback: () => void, delay: number) => {
    const savedCallback = useRef<() => void>()
    const intervalId = useRef<ReturnType<typeof setInterval> | null>(null)

    const startPolling = () => {
        if (intervalId.current === null && document.visibilityState === 'visible') {
            intervalId.current = setInterval(() => {
                if (savedCallback.current) {
                    savedCallback.current()
                }
            }, delay)
        }
    }

    const stopPolling = () => {
        if (intervalId.current !== null) {
            clearInterval(intervalId.current)
            intervalId.current = null
        }
    }

    // Save the latest callback
    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    // Handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                startPolling()
            } else {
                stopPolling()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Initial start
        if (document.visibilityState === 'visible') {
            startPolling()
        }

        return () => {
            stopPolling()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [delay])
}

export default usePolling
