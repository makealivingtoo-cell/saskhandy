import {useState} from "react";
import {trpc} from "@/lib/trpc";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {CalendarCheck} from "lucide-react";
import {toast} from "sonner";
export function appointmentLabel(value:Date|string|null|undefined){
 return value?new Intl.DateTimeFormat("en-CA",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Regina"}).format(new Date(value))+" SK time":"Not confirmed";
}
export default function JobAppointment({jobId,userId}:{jobId:number;userId:number}){
 const utils=trpc.useUtils();
 const q=trpc.appointments.getForJob.useQuery({jobId},{retry:false,refetchInterval:30000});
 const [date,setDate]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState("");
 const [showForm,setShowForm]=useState(false),[confirmCancel,setConfirmCancel]=useState(false);
 const refresh=async()=>{await Promise.all([utils.appointments.getForJob.invalidate({jobId}),utils.appointments.mine.invalidate()]);setShowForm(false);setConfirmCancel(false);};
 const propose=trpc.appointments.propose.useMutation({onSuccess:()=>{toast.success("Appointment proposal sent.");void refresh();},onError:e=>toast.error(e.message)});
 const respond=trpc.appointments.respond.useMutation({onSuccess:()=>{toast.success("Appointment updated.");void refresh();},onError:e=>toast.error(e.message)});
 const cancel=trpc.appointments.cancel.useMutation({onSuccess:()=>{toast.success("Appointment cancelled. The job remains active.");void refresh();},onError:e=>toast.error(e.message)});
 if(q.isError)return <p className="mb-5 rounded-lg border border-border p-3 text-sm text-muted-foreground">Appointment details are unavailable. Refresh the page to try again.</p>;
 if(q.isLoading)return <div className="mb-5 h-24 animate-pulse rounded-xl bg-muted" aria-label="Loading appointment" />;
 if(!q.data?.enabled)return null;
 const a=q.data.appointment, busy=propose.isPending||respond.isPending||cancel.isPending;
 const submit=()=>{
  const aStart=new Date(date+"T"+start+":00-06:00"),aEnd=new Date(date+"T"+end+":00-06:00");
  if(!date||!start||!end||!Number.isFinite(aStart.getTime())||!Number.isFinite(aEnd.getTime())||aStart>=aEnd){toast.error("Choose a date and a valid start and end time.");return;}
  propose.mutate({jobId,version:a?.version??0,startAt:aStart.toISOString(),endAt:aEnd.toISOString()});
 };
 return <section className="mb-6 space-y-4 rounded-2xl border border-border/60 bg-white p-5">
  <div className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary"/><h2 className="font-semibold">Your appointment</h2></div>
  {a?.status==="confirmed"?<div className="rounded-xl bg-primary/5 p-3"><p className="text-sm font-semibold text-primary">Confirmed</p><p className="text-sm">{appointmentLabel(a.startAt)} – {appointmentLabel(a.endAt)}</p></div>:<p className="text-sm text-muted-foreground">{a?.status==="cancelled"?"The previous appointment was cancelled. Arrange a new time when you're ready.":"Agree on a time that works for both of you."}</p>}
  {a?.proposedStartAt&&<div className="space-y-2 rounded-xl border p-3"><p className="text-sm font-semibold">Proposed time</p><p className="text-sm">{appointmentLabel(a.proposedStartAt)} – {appointmentLabel(a.proposedEndAt)}</p>{a.proposedBy===userId?<p className="text-sm text-muted-foreground">Waiting for the other person to confirm.</p>:<div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>respond.mutate({jobId,version:a.version,accept:true})}>Confirm time</Button><Button disabled={busy} variant="outline" onClick={()=>respond.mutate({jobId,version:a.version,accept:false})}>Decline</Button></div>}</div>}
  {showForm?<div className="space-y-3"><p className="text-sm text-muted-foreground">Choose a time in Saskatchewan (Regina/Saskatoon) local time.</p><label className="block text-sm font-medium">Date<Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Start<Input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label className="text-sm font-medium">End<Input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div><div className="flex gap-2"><Button disabled={busy} onClick={submit}>Send proposed time</Button><Button variant="outline" onClick={()=>setShowForm(false)}>Back</Button></div></div>:<Button variant="outline" onClick={()=>setShowForm(true)}>{a?.status==="confirmed"?"Suggest a new time":"Suggest a time"}</Button>}
  {a&&a.status!=="cancelled"&&(confirmCancel?<div className="space-y-2"><p className="text-sm">Cancel only this appointment? Your job and payment will remain unchanged.</p><div className="flex gap-2"><Button variant="destructive" disabled={busy} onClick={()=>cancel.mutate({jobId,version:a.version})}>Cancel appointment</Button><Button variant="outline" onClick={()=>setConfirmCancel(false)}>Keep appointment</Button></div></div>:<Button variant="ghost" className="text-muted-foreground" onClick={()=>setConfirmCancel(true)}>Cancel appointment</Button>)}
 </section>;
}
