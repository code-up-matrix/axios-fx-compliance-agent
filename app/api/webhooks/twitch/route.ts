import { db } from "@/lib/db";
import { AppError, handle, required } from "@/lib/security";
import { TwitchEnvelope, verifyTwitch, viewerHash, voteChoice } from "@/lib/crowdquest";
export const runtime="nodejs";
export const maxDuration=15;
export async function POST(request:Request){return handle(async()=>{
  const reader=request.body?.getReader();if(!reader)throw new AppError(400,"Missing event.");
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>65536){await reader.cancel();throw new AppError(413,"Event too large.");}chunks.push(r.value);}
  const raw=Buffer.concat(chunks).toString();const id=verifyTwitch(request.headers,raw);
  let value;try{value=JSON.parse(raw);}catch{throw new AppError(400,"Invalid event.");}
  const parsed=TwitchEnvelope.safeParse(value);if(!parsed.success)throw new AppError(400,"Unsupported event schema.");
  const data=parsed.data;const channel=required("TWITCH_BROADCASTER_ID");
  if(data.subscription.condition.broadcaster_user_id!==channel)throw new AppError(403,"Unexpected broadcaster.");
  const kind=request.headers.get("twitch-eventsub-message-type");
  if(kind==="webhook_callback_verification"){
    if(!data.challenge)throw new AppError(400,"Missing challenge.");
    return new Response(data.challenge,{headers:{"Content-Type":"text/plain","Content-Length":String(Buffer.byteLength(data.challenge))}});
  }
  const sql=db();
  if(kind==="revocation"){await sql`INSERT INTO twitch_receipts(id,kind) VALUES(${id},'revocation') ON CONFLICT DO NOTHING`;return new Response(null,{status:204});}
  if(kind!=="notification"||!data.event)throw new AppError(400,"Unsupported notification.");
  if(data.event.broadcaster_user_id!==channel)throw new AppError(403,"Unexpected event channel.");
  const choice=voteChoice(data.event.message.text);if(choice===null)return new Response(null,{status:204});
  const hash=viewerHash(data.event.chatter_user_id);
  // One SQL statement: a provider retry cannot be recorded without its vote transaction.
  await sql`WITH receipt AS (INSERT INTO twitch_receipts(id,kind) VALUES(${id},'vote') ON CONFLICT DO NOTHING RETURNING id), current_round AS (SELECT id,closes_at FROM crowd_rounds WHERE channel_id=${channel} ORDER BY created_at DESC,id DESC LIMIT 1) INSERT INTO crowd_votes(round_id,viewer_hash,choice,event_id) SELECT current_round.id,${hash},${choice},receipt.id FROM receipt,current_round WHERE current_round.closes_at>now() ON CONFLICT DO NOTHING`;
  return new Response(null,{status:204});
});}
