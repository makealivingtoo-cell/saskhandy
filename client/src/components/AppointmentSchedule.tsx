import {trpc} from "@/lib/trpc";
import {Link} from "wouter";
import {Button} from "@/components/ui/button";
import {appointmentLabel} from "./JobAppointment";
import {toast} from "sonner";
export default function AppointmentSchedule({professional=false}:{professional?:boolean}){
 const utils=trpc.useUtils();
 const list=trpc.appointments.mine.useQuery(undefined,{retry:false,refetchInterval:60000});
 const availability=trpc.appointments.availability.useQuery(undefined,{enabled:professional,retry:false});
 const change=trpc.appointments.setAvailability.useMutation({onSuccess:()=>{void utils.appointments.availability.invalidate();},onError:e=>toast.error(e.message)});
 if(list.isError)return <p className="rounded-lg border p-3 text-sm">Your schedule is temporarily unavailable.</p>;
 if(!list.data?.enabled)return null;
 return <section className="space-y-3 rounded-2xl border border-border/60 bg-white p-5"><h2 className="text-base font-semibold">Your schedule</h2>
 {professional&&availability.data?.enabled&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"><div><p className="text-sm font-medium">{availability.data.acceptingJobs?"Receiving job invitations":"Job invitations paused"}</p><p className="text-xs text-muted-foreground">This does not change existing appointments or jobs.</p></div><Button variant="outline" size="sm" disabled={change.isPending} onClick={()=>change.mutate({acceptingJobs:!availability.data?.acceptingJobs})}>{availability.data.acceptingJobs?"Pause invitations":"Resume invitations"}</Button></div>}
 {list.data.appointments.length===0?<p className="text-sm text-muted-foreground">No appointments to show yet.</p>:list.data.appointments.map(({appointment:a,title})=><Link key={a.jobId} href={professional?`/handyman/jobs/${a.jobId}`:`/jobs/${a.jobId}`}><div className="rounded-lg border p-3 hover:border-primary/40"><p className="font-medium text-sm">{title}</p><p className="text-sm text-muted-foreground">{a.status==="confirmed"?appointmentLabel(a.startAt):"Time awaiting confirmation"}{a.proposedStartAt&&a.status==="confirmed"?" · New time proposed":""}</p></div></Link>)}
 </section>;
}
