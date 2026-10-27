import CrowdQuest from "@/components/lab/crowdquest";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <CrowdQuest initialId={id}/>;}
