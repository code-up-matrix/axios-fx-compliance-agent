import { body, handle, json } from "@/lib/security";
import { guard, saveRun } from "@/lib/portfolio";
import { TasteInput, cultureRoute } from "@/lib/cultureroute";
export const runtime="nodejs";
export const maxDuration=90;
export async function POST(request:Request){return handle(async()=>{
  const who=await guard(request,"cultureroute",4);const input=await body(request,TasteInput);
  const result=await cultureRoute(input);const record=await saveRun(who.sub,"cultureroute",result);
  return json({id:record.id,...result});
});}
