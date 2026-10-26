import { z } from "zod";
import {
  handle,
  body,
  sameOrigin,
  session,
  json,
  verify,
  required,
  AppError,
} from "@/lib/security";
import { rateLimit, db } from "@/lib/db";
import { price } from "@/lib/catalog";
import { paypal, orderPayload, approvalLink } from "@/lib/paypal";
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const who = session(request);
    await rateLimit("checkout:" + who.sub, 5);
    const input = await body(
      request,
      z.object({
        quoteToken: z.string().max(4000),
        requestId: z.string().uuid(),
      }),
    );
    const quote = verify(input.quoteToken);
    if (quote.kind !== "quote" || quote.sub !== who.sub)
      throw new AppError(
        403,
        "Quote does not belong to this workspace session.",
      );
    const cart = price(quote);
    if (cart.totalCents !== quote.totalCents)
      throw new AppError(409, "Catalog changed. Request a new plan.");
    const sql = db();
    await sql`INSERT INTO checkout_orders(id,owner,sku,quantity,total_cents) VALUES(${input.requestId},${who.sub},${cart.sku},${cart.quantity},${cart.totalCents}) ON CONFLICT(id) DO NOTHING`;
    const rows =
      await sql`SELECT * FROM checkout_orders WHERE id=${input.requestId} AND owner=${who.sub}`;
    const row = rows[0];
    if (
      !row ||
      row.sku !== cart.sku ||
      row.quantity !== cart.quantity ||
      row.total_cents !== cart.totalCents
    )
      throw new AppError(
        409,
        "Checkout identifier was already used for a different plan.",
      );
    if (row.paypal_id)
      return json({
        id: row.id,
        paypalId: row.paypal_id,
        approvalUrl: row.approval_url,
        status: row.state,
      });
    const data = await paypal(
      "/v2/checkout/orders",
      "POST",
      orderPayload(input.requestId, cart, required("APP_ORIGIN")),
      input.requestId,
    );
    const approval = approvalLink(data);
    if (!/^[A-Z0-9]{10,32}$/.test(data.id))
      throw new AppError(502, "Invalid provider order ID.");
    await sql`UPDATE checkout_orders SET paypal_id=${data.id},approval_url=${approval},state='AWAITING_APPROVAL',updated_at=now() WHERE id=${input.requestId}`;
    return json({
      id: input.requestId,
      paypalId: data.id,
      approvalUrl: approval,
      status: "AWAITING_APPROVAL",
    });
  });
}
