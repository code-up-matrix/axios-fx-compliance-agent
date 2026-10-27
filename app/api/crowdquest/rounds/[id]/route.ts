import { z } from "zod";
import { db } from "@/lib/db";
import { AppError, handle, json } from "@/lib/security";
export const runtime="nodejs";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){return handle(async()=>{
  const {id}=await context.params;if(!z.uuid().safeParse(id).success)throw new AppError(400,"Invalid round.");
  const sql=db();const [r]=await sql`SELECT r.*,now()>=r.closes_at AS closed, r.id=(SELECT id FROM crowd_rounds WHERE channel_id=r.channel_id ORDER BY created_at DESC,id DESC LIMIT 1) AS current FROM crowd_rounds r WHERE id=${id}`;
  if(!r)throw new AppError(404,"Round not found.");
  const votes=await sql`SELECT choice,count(*)::int AS votes FROM crowd_votes WHERE round_id=${id} GROUP BY choice`;
  const closed=r.closed||!r.current;
  return json({id,question:r.question,options:r.options,closesAt:r.closes_at,closed,correct:closed?r.correct:null,votes:[0,1,2,3].map(c=>Number(votes.find(v=>v.choice===c)?.votes||0)),source:"Twitch EventSub"});
});}
