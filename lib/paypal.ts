import { AppError, required } from "./security";
import { money } from "./catalog";
const BASE = "https://api-m.sandbox.paypal.com";
export async function paypal(
  path: string,
  method = "GET",
  payload?: unknown,
  requestId?: string,
) {
  if (!/^\/v[12]\/[a-z0-9/-]+$/i.test(path))
    throw new AppError(400, "Invalid provider path.");
  const auth = Buffer.from(
    required("PAYPAL_CLIENT_ID") + ":" + required("PAYPAL_CLIENT_SECRET"),
  ).toString("base64");
  const tokenResponse = await fetch(BASE + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
    redirect: "error",
    cache: "no-store",
  });
  if (!tokenResponse.ok)
    throw new AppError(502, "PayPal sandbox authentication failed.");
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string")
    throw new AppError(502, "Invalid PayPal token response.");
  const response = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: "Bearer " + token.access_token,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    signal: AbortSignal.timeout(20000),
    redirect: "error",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new AppError(
      response.status === 422 ? 409 : 502,
      "PayPal sandbox could not complete the request. Retry with the same checkout.",
    );
  return data;
}
export function orderPayload(
  id: string,
  cart: {
    name: string;
    sku: string;
    quantity: number;
    unitCents: number;
    totalCents: number;
  },
  origin: string,
) {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost")
    throw new AppError(503, "APP_ORIGIN must be HTTPS.");
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: id,
        custom_id: id,
        description:
          "AXIOS PayProof sandbox demonstration — no goods are delivered",
        amount: {
          currency_code: "USD",
          value: money(cart.totalCents),
          breakdown: {
            item_total: { currency_code: "USD", value: money(cart.totalCents) },
          },
        },
        items: [
          {
            name: cart.name,
            sku: cart.sku,
            category: "DIGITAL_GOODS",
            quantity: String(cart.quantity),
            unit_amount: { currency_code: "USD", value: money(cart.unitCents) },
          },
        ],
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: "AXIOS PayProof Sandbox",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: origin + "/checkout",
          cancel_url: origin + "/checkout?cancelled=1",
        },
      },
    },
  };
}
export function approvalLink(data: {
  links?: { rel: string; href: string }[];
}) {
  const href = data.links?.find(
    (l) => l.rel === "payer-action" || l.rel === "approve",
  )?.href;
  if (!href) throw new AppError(502, "PayPal did not return an approval link.");
  const url = new URL(href);
  if (url.protocol !== "https:" || url.hostname !== "www.sandbox.paypal.com")
    throw new AppError(502, "Unexpected PayPal approval destination.");
  return href;
}
export function verifiedCapture(
  data: any,
  totalCents: number,
  internalId: string,
) {
  const units = data.purchase_units;
  if (
    data.status !== "COMPLETED" ||
    !Array.isArray(units) ||
    units.length !== 1 ||
    units[0].custom_id !== internalId
  )
    throw new AppError(409, "Payment is not completed for this order.");
  const captures = units[0].payments?.captures;
  if (
    !Array.isArray(captures) ||
    captures.length !== 1 ||
    captures[0].status !== "COMPLETED" ||
    captures[0].amount?.currency_code !== "USD" ||
    captures[0].amount?.value !== money(totalCents)
  )
    throw new AppError(
      409,
      "Payment amount or completion status does not match.",
    );
  return {
    captureId: captures[0].id,
    orderId: data.id,
    status: "COMPLETED",
    totalCents,
    currency: "USD",
    environment: "sandbox",
  };
}
export async function verifyWebhook(headers: Headers, event: unknown) {
  const names = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];
  for (const h of names)
    if (!headers.get(h))
      throw new AppError(401, "Missing PayPal signature headers.");
  const cert = new URL(headers.get("paypal-cert-url")!);
  if (
    cert.protocol !== "https:" ||
    ![
      "api.paypal.com",
      "api.sandbox.paypal.com",
      "api-m.sandbox.paypal.com",
    ].includes(cert.hostname)
  )
    throw new AppError(401, "Invalid certificate host.");
  const result = await paypal(
    "/v1/notifications/verify-webhook-signature",
    "POST",
    {
      auth_algo: headers.get(names[0]),
      cert_url: cert.href,
      transmission_id: headers.get(names[2]),
      transmission_sig: headers.get(names[3]),
      transmission_time: headers.get(names[4]),
      webhook_id: required("PAYPAL_WEBHOOK_ID"),
      webhook_event: event,
    },
  );
  if (result.verification_status !== "SUCCESS")
    throw new AppError(401, "PayPal signature was not verified.");
}
