import {trpc} from "@/lib/trpc";
import {Button} from "@/components/ui/button";
import {appointmentLabel} from "./JobAppointment";
import {toast} from "sonner";
export default function BookingHold({jobId}:{jobId:number}){
 const utils=trpc.useUtils(),q=trpc.instantBooking.status.useQuery({jobId},{retry:false,refetchInterval:30000});
 const cancel=trpc.instantBooking.cancelHold.useMutation({onSuccess:()=>{toast.success("Unpaid reservation cancelled.");void utils.invalidate();},onError:e=>toast.error(e.message)});
 if(!q.data||q.data.status!=="reserved")return null;
 return <section className="rounded-xl border bg-white p-4 space-y-2"><h2 className="font-semibold">Reserved appointment</h2><p className="text-sm">{appointmentLabel(q.data.startAt)} – {appointmentLabel(q.data.endAt)}</p><p className="text-sm text-muted-foreground">{q.data.checkoutStarted?"Checkout was started. Complete payment or contact support to resolve it.":"Complete payment before the unpaid hold ends at "+appointmentLabel(q.data.holdUntil)+"."}</p>{!q.data.checkoutStarted&&<Button variant="outline" disabled={cancel.isPending} onClick={()=>{if(window.confirm("Cancel this unpaid reservation?"))cancel.mutate({jobId});}}>Cancel unpaid reservation</Button>}</section>;
}
