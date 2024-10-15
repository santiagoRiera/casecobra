'use server'

import { BASE_PRICE, PRODUCT_PRICES } from '@/products/products'
import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Order } from '@prisma/client'

export const createCheckoutSession = async ({configId,}: {configId: string}) => {
    const configuration = await db.configuration.findUnique({
        where: { id: configId },
    })

    if (!configuration) {
        throw new Error('No such configuration found')
    }

    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user) {
        throw new Error('You need to be logged in')
    }

    const { finish, material } = configuration

    let price = BASE_PRICE
    if (finish === 'textured') price += PRODUCT_PRICES.finish.textured
    if (material === 'polycarbonate')
        price += PRODUCT_PRICES.material.polycarbonate

    let order: Order | undefined = undefined

    const existingOrder = await db.order.findFirst({
        where: {
        userId: user.id,
        configurationId: configuration.id,
        },
    })

    

    if (existingOrder) {
        order = existingOrder
    } else {
        order = await db.order.create({
        data: {
            amount: price / 100,
            userId: user.id,
            configurationId: configuration.id,
        },
        })
    }

    const product = await stripe.products.create({
        name: 'Custom iPhone Case',
        images: [configuration.imageUrl],
        default_price_data: {
        currency: 'USD',
        unit_amount: price,
        },
    })

    const stripeSession = await stripe.checkout.sessions.create({
        success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
        payment_method_types: ['card'],
        mode: 'payment',
        shipping_address_collection: { allowed_countries: ['DE', 'US', 'AR', 'ES', 'UY','CH', 'PA', 'BR', 'CO', 'MX', 'EC', 'PE', 'GB', 'FR', 'IT'] },
        metadata: {
            userId: user.id,
            orderId: order.id,
        },
        line_items: [{ price: product.default_price as string, quantity: 1 }],
    })

    return { url: stripeSession.url }
    }

    {/*const preference = await new Preference(mercadoPago).create({
        body: {
            items: [
                {
                    id: "1234",
                    picture_url: configuration.imageUrl,
                    title: "Custom phone case",
                    quantity: 1,
                    currency_id: "ARS",
                    unit_price: price
                }
            ],
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
                failure: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?orderId=${configuration.id}`
            },
            payment_methods: {
                default_payment_method_id: "visa",
            },
            operation_type: "regular_payment",
            external_reference: order.id,
            metadata: {
                userId: user.id,
                orderId: order.id
            },
        }
    })

    const url = preference.init_point!

    return url*/}
