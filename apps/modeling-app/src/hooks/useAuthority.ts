import { useMemo } from "react"
import { useLoggedInUser } from "./useLoggedInUser"

type Props = {
    authority: string | string[]
}

export const useAuthority = ({ authority }: Props) => {
    const { user, isLoading, error } = useLoggedInUser()

    const isSuperUser = useMemo(() => {
        if (!user) return undefined;
        return user.authorities.includes('ALL')
    }, [user])

    const hasAuthority = useMemo(() => {
        if (!user) return undefined;
        if (isSuperUser) return true;
        
        if (Array.isArray(authority)) {
            return authority.some(auth => user.authorities.includes(auth))
        }

        return user.authorities.includes(authority)
    }, [user, authority, isSuperUser])

    return {
        hasAuthority,
        isSuperUser,
        isLoading,
        error,
    }
}

