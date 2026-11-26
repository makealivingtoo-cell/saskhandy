import {useAuth} from "@/_core/hooks/useAuth";
import {trpc} from "@/lib/trpc";
import {Button} from "@/components/ui/button";
import {Heart} from "lucide-react";
import {toast} from "sonner";
export default function SaveProfessional({handymanId}:{handymanId:number}){
 const {user}=useAuth(),utils=trpc.useUtils();
 const q=trpc.myHome.isSaved.useQuery({handymanId},{enabled:user?.userType==="homeowner"&&handymanId>0,retry:false});
 const save=trpc.myHome.save.useMutation({onSuccess:()=>{void utils.myHome.isSaved.invalidate({handymanId});void utils.myHome.overview.invalidate();},onError:e=>toast.error(e.message)});
 if(!q.data?.enabled)return null;
 return <Button variant="outline" size="sm" disabled={save.isPending} aria-pressed={q.data.saved} onClick={()=>save.mutate({handymanId,saved:!q.data?.saved})}><Heart className="mr-2 h-4 w-4" fill={q.data.saved?"currentColor":"none"}/>{q.data.saved?"Saved":"Save professional"}</Button>;
}
