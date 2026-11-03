import handler from "vinext/server/fetch-handler";
import {banInactiveUsers} from '../lib/inactivity';
// External requests never carry trusted ChatGPT identity. The Sites dispatcher
// is absent here: discard its identity headers before the application sees them.
export default {fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
 const headers=new Headers(request.headers);
 for(const name of [...headers.keys()])if(name.startsWith("oai-"))headers.delete(name);
 const safeRequest=new Request(request,{headers});
 return handler.fetch(safeRequest,env,ctx);
},
 async scheduled(_controller:ScheduledController,env:Cloudflare.Env){
  const banned=await banInactiveUsers(env.DB);
  console.log('VisaFund inactivity cron finished',{banned});
 }
};
