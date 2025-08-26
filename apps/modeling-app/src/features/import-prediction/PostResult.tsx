import { useEffect } from 'react'
import { useDataMutation } from '@dhis2/app-runtime'

interface PostResultProps {
    prediction: any
    qLowDataElementId: string
    qMedianDataElementId: string
    qHighDataElementId: string
    setPostStatus: (value: 'loading' | 'finish' | 'error' | 'initial') => void
    setPostHttpError: (value: string) => void
}

const PostResult = ({
    prediction,
    qLowDataElementId,
    qMedianDataElementId,
    qHighDataElementId,
    setPostHttpError,
    setPostStatus,
}: PostResultProps) => {
    const mapQuantiesToDataElement = (quantile: string) => {
        if (quantile === 'quantile_low') return qLowDataElementId
        if (quantile === 'median') return qMedianDataElementId
        if (quantile === 'quantile_high') return qHighDataElementId
    }

    const createBodyRequest = (prediction: any) => {
        return prediction.dataValues.map((d: any) => {
            return {
                dataElement: mapQuantiesToDataElement(d.dataElement),
                period: d.period,
                orgUnit: d.orgUnit,
                value: d.value,
            }
        })
    }

    const mutatePrediction = (data: any) => {
        return {
            resource: 'dataValueSets',
            type: 'create',
            data: {
                dataValues: data,
            },
        }
    }

    const [mutate, { error, loading, called }] = useDataMutation(
        mutatePrediction(createBodyRequest(prediction)) as any
    )

    const sendPrediction = async () => {
        await mutate()
    }

    useEffect(() => {
        sendPrediction()
    }, [])

    //Run when loading change state
    useEffect(() => {
        if (!called) return
        if (loading) return

        if (error) {
            setPostHttpError(
                'Something went wrong when posting the prediction.'
            )
            setPostStatus('error')
        }
        if (!error) {
            setPostHttpError('')
            setPostStatus('finish')
        }
    }, [loading])

    return null
}

export default PostResult
