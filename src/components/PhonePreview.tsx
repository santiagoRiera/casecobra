"use client"

import { CaseColor } from '@prisma/client'
import { useEffect, useRef, useState } from 'react'
import { AspectRatio } from './ui/aspect-ratio'
import { cn } from '@/lib/utils'


const PhonePreview = ({croppedImageUrl, color}: {
    croppedImageUrl: string
    color: CaseColor
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [renderedDimensions, setRenderedDimensions] = useState({height: 0, width: 0})

    const handleResize = () => {
        if(!ref.current) return
            const {width, height} = ref.current.getBoundingClientRect()
            setRenderedDimensions({width, height}) 
    }

    useEffect(() => {
        handleResize()

        window.addEventListener('resize', handleResize)

        //To avoid memory leaks. If the component is unmounted, we remove the event listener
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    let caseBackgroundColor = 'bg-zinc-950'
    if(color === 'blue') caseBackgroundColor = 'bg-blue-950'
    if (color === 'rose') caseBackgroundColor = 'bg-rose-950'
    if (color === 'white') caseBackgroundColor = 'bg-zinc-100'

  return (
    <AspectRatio ref={ref} ratio={3000 / 2001} className='ratio'>
        {/* scale se encarga ed que la imagen nunca sea mas grande que el telefono*/}
        <div 
            className='absolute z-20 scale-[1.0352]' 
            style={{
                //No usamos px, usamos ratios para que sea responsive
                //renderedDimensions.width / ( offset if the image / width of the phone)
                left: renderedDimensions.width / 2 - renderedDimensions.width / (1216 / 121),
                top: renderedDimensions.height / 6.22
            }}>
                <img 
                    width={renderedDimensions.width / (3000 / 637)} 
                    className={cn('phone-skew relative z-20 rounded-t-[15px] rounded-b-[10px] md:rounded-t-[30px] md:rounded-b-[20px]', caseBackgroundColor)}
                    src={croppedImageUrl}
                    alt='your image'
                />
        </div>
        <div className='relative size-full z-40'>
            <img alt='phone' src='/clearphone.png' className='pointer-events-none size-full antialiased rounded-md' />
        </div>
    </AspectRatio>
  )
}

export default PhonePreview