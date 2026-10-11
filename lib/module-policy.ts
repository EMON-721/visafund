export const overviewParts=[['balance','Total recorded balance'],['income','Money in'],['expenses','Money out'],['cashflow','Net cash flow'],['balance-chart','Balance over time'],['milestone','Your next milestone'],['recent-transactions','Recent transactions'],['accounts','Bank accounts'],['destinations','Explore destinations']] as const;
export const workspaceModules=[
 ['dashboard','Overview'],['accounts','Bank accounts'],['transactions','Transactions'],['calendar','Transaction calendar'],['analytics','Financial insights'],['countries','Country requirements'],['targets','My destinations'],['readiness','Financial readiness'],['comparison','Compare countries'],['sponsors','Sponsors & sources'],['documents','Document vault'],['goals','Savings goals'],['currency','Currency converter'],['history','Fund history'],['reports','Financial reports']
] as const;
export type ModuleSetting={route:string;label:string;enabled:boolean;description:string;heading?:string;allowCreate?:boolean;allowEdit?:boolean;allowDelete?:boolean;parts?:Record<string,{enabled:boolean;label:string}>};
export function resolveModules(records:{title:string;body:string}[]):ModuleSetting[]{
 const seen=new Set<string>();const settings=new Map<string,Record<string,unknown>>();
 for(const row of records){const route=row.title.replace(/^module:/,'');if(!row.title.startsWith('module:')||seen.has(route)||!workspaceModules.some(([r])=>r===route))continue;
 try{const x=JSON.parse(row.body);if(typeof x.enabled!=='boolean'||typeof x.label!=='string'||!x.label.trim()||x.label.length>60||typeof x.description!=='string'||x.description.length>600)continue;settings.set(route,x);seen.add(route)}catch{}}
 return workspaceModules.map(([route,label])=>{const x=settings.get(route);return {route,label:x?String(x.label):label,enabled:x?Boolean(x.enabled):true,description:x?String(x.description):'',heading:x&&typeof x.heading==='string'?x.heading:'',allowCreate:x?.allowCreate!==false,allowEdit:x?.allowEdit!==false,allowDelete:x?.allowDelete!==false,parts:x&&typeof x.parts==='object'&&x.parts!==null?Object.fromEntries(overviewParts.map(([key,label])=>{const part=(x.parts as Record<string,{enabled?:unknown;label?:unknown}>)[key];return [key,{enabled:part?.enabled!==false,label:typeof part?.label==='string'&&part.label.length<=80?part.label:label}]})):undefined}});
}
export function operationModule(kind:string|undefined):string|undefined{
 return ({document:'documents',account:'accounts',transaction:'transactions',import:'transactions',transfer:'transactions',sponsor:'sponsors',target:'targets',goal:'goals',rate:'currency',reconciliation:'accounts',scholarship:'sponsors',checklist:'readiness'} as Record<string,string>)[kind||''];
}
