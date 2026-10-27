import { z } from "zod";
import { db } from "@/lib/db";
import { body, handle, json } from "@/lib/security";
import { guard, saveRun, ownedRun } from "@/lib/portfolio";
import { TryOnInput, createTryOn, tryOnStatus } from "@/lib/fitreceipt";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:Request){return handle(async()=>{
  const who=await guard(request,"youcam-task",3);const input=await body(request,TryOnInput);
  const task=await createTryOn(who.sub,input);const run=await saveRun(who.sub,"fitreceipt",task);
  return json({id:run.id,status:"queued"},202);
});}
export async function GET(request:Request){return handle(async()=>{
  const who=await guard(request,"youcam-status",20);const run=await ownedRun(new URL(request.url).searchParams.get("id")||"",who.sub,"fitreceipt");
  return json(await tryOnStatus(run.payload.taskId));
});}
export async function DELETE(request:Request){return handle(async()=>{
  const who=await guard(request,"youcam-delete",10);const {id}=await body(request,z.object({id:z.uuid()}));await ownedRun(id,who.sub,"fitreceipt");
  const sql=db();await sql`DELETE FROM portfolio_runs WHERE id=${id} AND owner=${who.sub} AND app='fitreceipt'`;
  return json({ok:true,notice:"The local record was removed. Provider image retention follows Perfect Corp's terms; this action does not delete provider copies."});
});}
