// Official channel.chat.message EventSub webhook. No chat messages are sent.
// Complete Twitch OAuth grants first; see docs/DEVPOST-DEPLOYMENT.md.
const names=["APP_ORIGIN","TWITCH_CLIENT_ID","TWITCH_APP_ACCESS_TOKEN","TWITCH_BROADCASTER_ID","TWITCH_CHATBOT_USER_ID","TWITCH_WEBHOOK_SECRET"];
for(const name of names)if(!process.env[name])throw Error(`${name} is required.`);
const origin=new URL(process.env.APP_ORIGIN);
if(origin.protocol!=="https:"||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=="/")throw Error("APP_ORIGIN must be a bare HTTPS origin.");
if(process.env.TWITCH_WEBHOOK_SECRET.length<32)throw Error("Use a random webhook secret with at least 32 characters.");
const callback=origin.origin+"/api/webhooks/twitch";
if(!process.argv.includes("--apply")){
 console.log(JSON.stringify({mode:"dry-run",type:"channel.chat.message",version:"1",callback,note:"Complete the documented OAuth grants, then pass --apply to create the subscription."},null,2));
}else{
 const response=await fetch("https://api.twitch.tv/helix/eventsub/subscriptions",{method:"POST",redirect:"error",signal:AbortSignal.timeout(30000),headers:{"Client-Id":process.env.TWITCH_CLIENT_ID,Authorization:`Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({type:"channel.chat.message",version:"1",condition:{broadcaster_user_id:process.env.TWITCH_BROADCASTER_ID,user_id:process.env.TWITCH_CHATBOT_USER_ID},transport:{method:"webhook",callback,secret:process.env.TWITCH_WEBHOOK_SECRET}})});
 if(!response.ok)throw Error(`Twitch subscription request failed (${response.status}). No credentials were logged.`);
 const result=await response.json();console.log(JSON.stringify({subscriptions:result.data?.map(({id,status,type,version})=>({id,status,type,version}))},null,2));
}
