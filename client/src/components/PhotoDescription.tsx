import {useState,useRef} from "react";
import {trpc} from "@/lib/trpc";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {Camera} from "lucide-react";
export default function PhotoDescription({context,onUse}:{context:string;onUse:(value:string)=>void}){
 const input=useRef<HTMLInputElement>(null),[consent,setConsent]=useState(false),[reading,setReading]=useState(false);
 const ai=trpc.system.interpretPhoto.useMutation({onError:e=>toast.error(e.message)});
 const choose=async(file:File)=>{setReading(true);try{
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>10*1024*1024)throw Error("Choose a JPG, PNG or WEBP under 10 MB.");
  const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext("2d");if(!ctx){bitmap.close();throw Error("Unable to read image.");}ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  await ai.mutateAsync({photo:canvas.toDataURL("image/jpeg",.7),context:context.slice(0,3000)});
 }catch(e){if(!ai.isError)toast.error(e instanceof Error?e.message:"Photo unavailable");}finally{setReading(false);}};
 return <div className="rounded-xl border bg-white p-3 space-y-2"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Let AI examine a photo to suggest a draft. The image is sent to our AI provider; avoid faces, documents and identifying details.</label><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file&&consent)void choose(file);}}/><Button type="button" variant="outline" disabled={!consent||reading||ai.isPending} onClick={()=>input.current?.click()}><Camera className="mr-2 h-4 w-4"/>{reading||ai.isPending?"Reviewing photo…":"Describe a photo with AI"}</Button>{ai.data&&<div className="rounded-lg bg-muted/30 p-3 text-sm space-y-2"><p className="font-medium">Suggested description — verify before using</p><p>{ai.data.suggestedDescription}</p>{ai.data.questions.map((q,i)=><p key={i}>• {q}</p>)}<Button type="button" variant="outline" onClick={()=>onUse(ai.data!.suggestedDescription)}>Use this draft</Button></div>}<p className="text-xs text-muted-foreground">This does not diagnose faults or attach the photo to your request. You can add job photos separately.</p></div>;
}
