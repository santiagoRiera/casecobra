"use client"
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import { ReactNode } from 'react'

const client = new QueryClient()

const Providers = ({children}: {children: ReactNode}) => {
    return (
        //Encerramos toda la app dentro del QueryClientProvider. Basicamente ahora podemos usar reactQuey para guardar el resto de cosas del paso 2
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}

export default Providers