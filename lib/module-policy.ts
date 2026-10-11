export const workspaceModules=[
 ['dashboard','Overview'],['accounts','Bank accounts'],['transactions','Transactions'],['calendar','Transaction calendar'],['analytics','Financial insights'],['countries','Country requirements'],['targets','My destinations'],['readiness','Financial readiness'],['comparison','Compare countries'],['sponsors','Sponsors & sources'],['documents','Document vault'],['goals','Savings goals'],['currency','Currency converter'],['history','Fund history'],['reports','Financial reports']
] as const;
export type ModuleSetting={route:string;label:string;enabled:boolean;description:string};
export function resolveModules(records:{title:string;body:string}[]):ModuleSetting[]{
 const seen=new Set<string>();const settings=new Map<string,Record<string,unknown>>();
 for(const row of records){const route=row.title.replace(/^module:/,'');if(!row.title.startsWith('module:')||seen.has(route)||!workspaceModules.some(([r])=>r===route))continue;
 try{const x=JSON.parse(row.body);if(typeof x.enabled!=='boolean'||typeof x.label!=='string'||!x.label.trim()||x.label.length>60||typeof x.description!=='string'||x.description.length>600)continue;settings.set(route,x);seen.add(route)}catch{}}
 return workspaceModules.map(([route,label])=>{const x=settings.get(route);return {route,label:x?String(x.label):label,enabled:x?Boolean(x.enabled):true,description:x?String(x.description):''}});
}
export function operationModule(kind:string|undefined):string|undefined{
 return ({account:'accounts',transaction:'transactions',import:'transactions',transfer:'transactions',sponsor:'sponsors',target:'targets',goal:'goals',rate:'currency',reconciliation:'accounts',scholarship:'sponsors',checklist:'readiness'} as Record<string,string>)[kind||''];
}
