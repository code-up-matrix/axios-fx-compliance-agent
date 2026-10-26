import { z } from "zod";
import {
  handle,
  body,
  sameOrigin,
  session,
  json,
  AppError,
} from "@/lib/security";
import { rateLimit, db } from "@/lib/db";
import { paypal, verifiedCapture } from "@/lib/paypal";
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const who = session(request);
    await rateLimit("capture:" + who.sub, 5);
    const input = await body(
      request,
      z.object({
        paypalId: z.string().regex(/^[A-Z0-9]{10,32}$/),
        confirm: z.literal(true),
      }),
    );
    const sql = db();
    const rows =
      await sql`SELECT * FROM checkout_orders WHERE paypal_id=${input.paypalId} AND owner=${who.sub}`;
    const order = rows[0];
    if (!order) throw new AppError(404, "Order not found for this session.");
    if (order.state === "REFUND_REVIEW")
      throw new AppError(409, "This payment needs refund review.");
    let data = await paypal("/v2/checkout/orders/" + input.paypalId);
    if (data.status !== "COMPLETED") {
      if (data.status !== "APPROVED")
        throw new AppError(409, "Approve this sandbox order on PayPal first.");
      data = await paypal(
        "/v2/checkout/orders/" + input.paypalId + "/capture",
        "POST",
        {},
        order.id.replaceAll("-", "") + "-c",
      );
    }
    const receipt = verifiedCapture(data, order.total_cents, order.id);
    await sql`UPDATE checkout_orders SET state='COMPLETED',receipt=${JSON.stringify(receipt)}::jsonb,updated_at=now() WHERE id=${order.id} AND state<>'REFUND_REVIEW'`;
    return json({ ...receipt, sku: order.sku, quantity: order.quantity });
  });
}
