"use client";
import { useEffect, useState } from "react";
import { Workspace, Download, post } from "@/components/workspace";
export default function Checkout() {
  const [id, setId] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setId(q.get("token") || "");
    setCancelled(q.get("cancelled") === "1");
  }, []);
  async function capture() {
    setBusy(true);
    setError("");
    try {
      setReceipt(
        await post("/api/orders/capture", { paypalId: id, confirm: true }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace name="AXIOS / PAYPROOF" tag="PAYMENT VERIFICATION">
      <section className="hero">
        <div>
          <span className="eyebrow">PAYPAL SANDBOX</span>
          <h1>
            {receipt
              ? "Payment verified."
              : cancelled
                ? "Checkout cancelled."
                : "One final confirmation."}
          </h1>
          <p>
            {receipt
              ? "The server matched the captured amount, currency and order to your purchase."
              : cancelled
                ? "No capture was requested by this page. You can return to the workspace."
                : "Confirm to capture your approved sandbox payment. A return URL alone is never treated as proof of payment."}
          </p>
        </div>
      </section>
      <section className="panel">
        <p>PayPal order: {id || "No order supplied"}</p>
        {receipt ? (
          <>
            <p className="status watch">
              {receipt.status} · ${(receipt.totalCents / 100).toFixed(2)} USD ·
              sandbox
            </p>
            <p>Capture: {receipt.captureId}</p>
            <Download data={receipt} name="paypal-sandbox-receipt.json" />
          </>
        ) : !cancelled && id ? (
          <button onClick={capture} disabled={busy}>
            {busy ? "Checking PayPal…" : "Confirm sandbox capture & verify"}
          </button>
        ) : null}
        <p role="alert" className="error">
          {error}
        </p>
        <a href="/">Return to workspace →</a>
      </section>
    </Workspace>
  );
}
