import { z } from "zod";
import { handle, body, json } from "@/lib/security";
import { db } from "@/lib/db";
import { verifyWebhook } from "@/lib/paypal";
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    const event = await body(
      request,
      z
        .object({
          id: z.string().max(100),
          event_type: z.string().max(100),
          resource: z.record(z.string(), z.unknown()),
        })
        .passthrough(),
    );
    await verifyWebhook(request.headers, event);
    const resource = event.resource as any;
    const orderId = resource.supplementary_data?.related_ids?.order_id ?? null;
    const sql = db();
    await sql.transaction([
      sql`INSERT INTO webhook_events(id,event_type,order_id) VALUES(${event.id},${event.event_type},${orderId}) ON CONFLICT(id) DO NOTHING`,
      sql`UPDATE checkout_orders SET state='REFUND_REVIEW',updated_at=now() WHERE paypal_id=${orderId} AND ${["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"].includes(event.event_type)}`,
    ]);
    return json({ received: true });
  });
}
