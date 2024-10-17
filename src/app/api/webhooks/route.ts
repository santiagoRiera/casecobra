import { db } from "@/db"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from 'stripe'
import {Resend} from 'resend'
import OrderReceivedEmail from "@/components/emails/OrderReceivedEmail";


{/*export async function POST(req: Request){
    try{
        //const body: {data: {id: string}} = await req.json()
        const rawBody = await req.text();
        const signature = req.headers.get('x-signature')

        if (!signature) {
        return new Response('Invalid signature', { status: 400 })
        }
        
       // Verificar la firma del webhook
        const generatedSignature = crypto
        .createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
        .update(rawBody)
        .digest('hex')

        if (generatedSignature !== signature) {
            return new Response('Invalid signature', { status: 401 })
        }

        const data = JSON.parse(rawBody)

        if (data.type === 'payment' && data.action === 'payment.created') {
        const paymentId = data.data.id
        const payment = await new Payment(mercadoPago).get({ id: paymentId })

        if (payment.status === 'approved') {
            const orderId = payment.external_reference
            const metadata = payment.metadata as { userId: string } | undefined

            if (!orderId || !metadata?.userId) {
            throw new Error('Invalid payment metadata')
            }

            // Actualizar la orden en la base de datos
            const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: {
                isPaid: true,
                status: 'fullfiled',
            },
            })
        }
        }

        return new Response('Pago ok', { status: 200 })


       
    }*/}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
      const signature = headers().get('stripe-signature')
      const body = await req.text()

  
      if (!signature) {
        return new Response('Invalid signature', { status: 400 })
      }
  
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
  
      if (event.type === 'checkout.session.completed') {
        if (!event.data.object.customer_details?.email) {
          throw new Error('Missing user email')
        }
  
        const session = event.data.object as Stripe.Checkout.Session
  
        const { userId, orderId } = session.metadata || {
          userId: null,
          orderId: null,
        }
  
        if (!userId || !orderId) {
          throw new Error('Invalid request metadata')
        }
  
        const billingAddress = session.customer_details!.address
        const shippingAddress = session.shipping_details!.address


        
        const updatedOrder = await db.order.update({
          where: {
            id: orderId,
          },
          data: {
            isPaid: true,
            shippingAddress: {
              create: {
                name: session.customer_details!.name!,
                city: shippingAddress!.city!,
                country: shippingAddress!.country!,
                postalCode: shippingAddress!.postal_code!,
                street: shippingAddress!.line1!,
                state: shippingAddress!.state,
              },
            },
            billingAddress: {
              create: {
                name: session.customer_details!.name!,
                city: billingAddress!.city!,
                country: billingAddress!.country!,
                postalCode: billingAddress!.postal_code!,
                street: billingAddress!.line1!,
                state: billingAddress!.state,
              },
            },
          },
        })

       await resend.emails.send({
          from: 'CaseCobra <santilrier@gmail.com>',
          to: [event.data.object.customer_details.email],
          subject: 'Thanks for your order!',
          react: OrderReceivedEmail({
            orderId,
            orderDate: updatedOrder.createdAt.toLocaleDateString(),
            //@ts-expect-error: siempre va a existir
            shippingAddress: {
              name: session.customer_details!.name!,
              city: shippingAddress!.city!,
              country: shippingAddress!.country!,
              postalCode: shippingAddress!.postal_code!,
              street: shippingAddress!.line1!,
              state: shippingAddress!.state,
            },
          }),
        })
      }
  
      return NextResponse.json({ result: event, ok: true })
    }

    catch(err){
        if (err instanceof Error) {
          console.error('Error sending email:', err);
          console.error("error aca: ", {message: err.message, stack: err.stack, rawErr: err})
        } else {
          console.error("error aca: ", {message: String(err)})
        }
        return NextResponse.json(
            {message: "Something went wrong", ok: false, error: err instanceof Error ? err.message : String(err), details: err instanceof Error ? err.stack : undefined},
            {status: 500}
        )
    }
}