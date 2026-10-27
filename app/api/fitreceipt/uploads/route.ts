import { body, handle, json } from "@/lib/security";
import { guard } from "@/lib/portfolio";
import { UploadInput, uploadSlot } from "@/lib/fitreceipt";
export const runtime="nodejs";
export async function POST(request:Request){return handle(async()=>{const who=await guard(request,"youcam-upload",6);return json(await uploadSlot(who.sub,await body(request,UploadInput)));});}
