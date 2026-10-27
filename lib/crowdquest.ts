import { createHmac } from "node:crypto";
import { z } from "zod";
import { AppError, equal, required } from "./security";
export const RoundInput=z.object({question:z.string().trim().min(8).max(240),options:z.array(z.string().trim().min(1).max(100)).length(4),correct:z.number().int().min(0).max(3),seconds:z.number().int().min(30).max(300)});
export function voteChoice(text:string){const m=/^!vote\s+([ABCD])\s*$/i.exec(text);return m?m[1].toUpperCase().charCodeAt(0)-65:null;}
export function verifyTwitch(headers:Headers,raw:string,now=Date.now()){
  const id=headers.get("twitch-eventsub-message-id"),timestamp=headers.get("twitch-eventsub-message-timestamp"),signature=headers.get("twitch-eventsub-message-signature");
  if(!id||!timestamp||!signature||id.length>200)throw new AppError(403,"Missing Twitch signature.");
  const age=now-Date.parse(timestamp);
  if(!Number.isFinite(age)||age>600000||age< -60000)throw new AppError(403,"Expired Twitch event.");
  const secret=required("TWITCH_WEBHOOK_SECRET");
  if(secret.length<32||secret.length>100)throw new AppError(503,"Twitch verification is not configured.");
  const expected="sha256="+createHmac("sha256",secret).update(id+timestamp+raw).digest("hex");
  if(!equal(expected,signature))throw new AppError(403,"Invalid Twitch signature.");
  return id;
}
export function viewerHash(viewer:string){return createHmac("sha256",required("SESSION_SECRET")).update("twitch:"+viewer).digest("hex");}
export const TwitchEnvelope=z.object({
  challenge:z.string().max(1000).optional(),
  subscription:z.object({type:z.literal("channel.chat.message"),version:z.literal("1"),condition:z.object({broadcaster_user_id:z.string(),user_id:z.string().optional()}),status:z.string().optional()}),
  event:z.object({broadcaster_user_id:z.string(),chatter_user_id:z.string().min(1),message:z.object({text:z.string().max(2000)})}).optional()
});
