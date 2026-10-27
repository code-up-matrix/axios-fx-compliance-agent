import { body, handle, json, operator, required } from "@/lib/security";
import { guard } from "@/lib/portfolio";
import { db } from "@/lib/db";
import { RoundInput } from "@/lib/crowdquest";
export const runtime="nodejs";
export async function POST(request:Request){return handle(async()=>{
  const who=operator(request);await guard(request,"rounds",6);
  const input=await body(request,RoundInput);const sql=db();
  const [round]=await sql`INSERT INTO crowd_rounds(owner,channel_id,question,options,correct,closes_at) VALUES(${who.sub},${required("TWITCH_BROADCASTER_ID")},${input.question},${JSON.stringify(input.options)}::jsonb,${input.correct},now()+${input.seconds}*interval '1 second') RETURNING id,closes_at`;
  return json(round,201);
});}
