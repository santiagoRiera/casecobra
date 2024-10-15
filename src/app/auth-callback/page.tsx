"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { getAuthStatus } from "./actions"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"


//Este componente solo redirecciona, si hay algo en localStorage, redirijimos al preview
const Page = () => {
    const [configId, setConfigId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const configurationId = localStorage.getItem("configurationId")

        if(configurationId) setConfigId(configurationId)
        //else: no pasa nada, configId es null por defecto
    }, [])

    //Esta logeado? vemos si el usuario que esta logeado o registrado en Kinde tmb existe en la bd
    const {data} = useQuery({
        queryKey: ["auth-callback"],
        queryFn: async () => await getAuthStatus(),
        retry: true, //Si no esta logeado sigue intentando
        retryDelay: 500
    })

    if(data?.success){
        if(configId){
            localStorage.removeItem("configurationId")
            router.push(`/configure/preview?id=${configId}`)
        }
        else{
            router.push("/")
        }
    }

    return(
        <div className="w-full mt-24 flex justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-neutral-500" />
                <h3 className="font-semibold text-xl">Loggin you in...</h3>
                <p>You will be redirected automatically.</p>
            </div>
        </div>
    )
}

export default Page