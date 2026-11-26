import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {trpc} from "@/lib/trpc";
import {toast} from "sonner";
import {BOOKABLE_SERVICES,type BookableService} from "@shared/instantBooking";
import {appointmentLabel} from "./JobAppointment";
export default function PublishBookingSlots(){
 const utils=trpc.useUtils(),q=trpc.instantBooking.mine.useQuery(undefined,{retry:false});
 const [service,setService]=useState<BookableService>("assembly"),[scope,setScope]=useState(""),[price,setPrice]=useState(""),[date,setDate]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState("");
 const refresh=()=>{void utils.instantBooking.mine.invalidate();void utils.instantBooking.catalog.invalidate();};
 const publish=trpc.instantBooking.publish.useMutation({onSuccess:()=>{toast.success("Appointment published.");setScope("");setPrice("");refresh();},onError:e=>toast.error(e.message)});
 const withdraw=trpc.instantBooking.withdraw.useMutation({onSuccess:refresh,onError:e=>toast.error(e.message)});
 if(q.isError)return <p className="text-sm">Booking tools are temporarily unavailable.</p>;if(!q.data?.enabled)return null;
 return <section className="rounded-2xl border bg-white p-5 space-y-4"><h2 className="text-lg font-semibold">Instant booking availability</h2><p className="text-sm text-muted-foreground">Publish a specific time and an all-in customer price. SaskHandy's existing 20% marketplace fee applies. Only list work you can perform within the defined scope.</p><form className="space-y-3" onSubmit={e=>{e.preventDefault();const a=new Date(date+"T"+start+":00-06:00"),b=new Date(date+"T"+end+":00-06:00");if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())){toast.error("Choose valid appointment times.");return;}publish.mutate({service,scope,price:Number(price),startAt:a.toISOString(),endAt:b.toISOString()});}}>
 <label className="block text-sm font-medium">Service<select className="block w-full rounded-lg border p-2" value={service} onChange={e=>setService(e.target.value as BookableService)}>{Object.entries(BOOKABLE_SERVICES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label><p className="text-sm text-muted-foreground">{BOOKABLE_SERVICES[service].description}</p>
 <label className="block text-sm font-medium">What's included (no customer details)<Input value={scope} onChange={e=>setScope(e.target.value)} required maxLength={500} placeholder="Specific work, supplies and limits"/></label>
 <label className="block text-sm font-medium">Total price (CAD, including applicable taxes)<Input type="number" min="25" max="1000" step=".01" required value={price} onChange={e=>setPrice(e.target.value)}/></label>
 <label className="block text-sm font-medium">Date (Saskatoon time)<Input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Start<Input type="time" required value={start} onChange={e=>setStart(e.target.value)}/></label><label className="text-sm font-medium">End<Input type="time" required value={end} onChange={e=>setEnd(e.target.value)}/></label></div><Button disabled={publish.isPending}>Publish available appointment</Button></form>
 {q.data.slots.map(s=><div key={s.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><div>{BOOKABLE_SERVICES[s.service as BookableService]?.label??s.service}<p className="text-muted-foreground">{appointmentLabel(s.startAt)} · ${s.price} · {s.status}</p></div>{s.status==="available"&&<Button size="sm" variant="outline" disabled={withdraw.isPending} onClick={()=>withdraw.mutate({id:s.id})}>Withdraw</Button>}</div>)}</section>;
}
