import {balance,minor,digits,csvCell} from './finance.ts';
export const DEMO_START='2025-10-01',DEMO_END='2026-09-30';
export const demoAccounts=[
 {id:'demo-a',name:'DEMO Student savings',bank:'SAMPLE North Bank',currency:'BDT',opening:60000000,date:DEMO_START,details:JSON.stringify({holder:'DEMO Student',ownership:'Self',type:'Savings account',masked:'0001',accessible:true})},
 {id:'demo-s',name:'DEMO Sponsor fund',bank:'SAMPLE Family Bank',currency:'BDT',opening:90000000,date:DEMO_START,details:JSON.stringify({holder:'DEMO Parent',ownership:'Parent',type:'Sponsor account',masked:'0002',accessible:true})},
 {id:'demo-e',name:'DEMO Foreign currency fund',bank:'SAMPLE Euro Bank',currency:'EUR',opening:400000,date:DEMO_START,details:JSON.stringify({holder:'DEMO Student',ownership:'Self',type:'Foreign currency account',masked:'0003',accessible:true})}
];
export type DemoTransaction={id:string;account:string;date:string;amount:number;direction:string;description:string;category:string;details:string;imported:number;deleted:number;transfer:string|null};
export const demoTransactions:DemoTransaction[]=[];
function entry(account:string,date:string,amount:string,direction:string,category:string,transfer:string|null=null){const c=demoAccounts.find(a=>a.id===account)!.currency;demoTransactions.push({id:'demo-t-'+demoTransactions.length,account,date,amount:minor(amount,c),direction,description:'DEMO '+category,category,details:JSON.stringify({sender:direction==='credit'?'SAMPLE Funding source':'',receiver:direction==='debit'?'SAMPLE Recipient':'',source:category,purpose:'SIMULATED — not financial evidence',verified:'Manual'}),imported:0,deleted:0,transfer})}
for(let i=0;i<12;i++){
 const d=new Date(Date.UTC(2025,9+i,1)).toISOString().slice(0,7),day=(n:number)=>d+'-'+String(n).padStart(2,'0');
 entry('demo-a',day(2),'45000','credit','Salary');entry('demo-s',day(3),'75000','credit','Business income');
 const pair='demo-transfer-'+i;entry('demo-s',day(5),'25000','debit','Family contribution transfer',pair);entry('demo-a',day(5),'25000','credit','Family contribution transfer',pair);
 entry('demo-a',day(7),'15000','debit','Rent');entry('demo-a',day(10),'6000','debit','Food');entry('demo-a',day(12),'2000','debit','Transport');
 entry('demo-a',day(16),'5000','credit','Family gift');entry('demo-e',day(20),'200','credit','Foreign currency savings contribution');
 if([1,4,7].includes(i))entry('demo-a',day(18),'8000','debit','University application fee');
 if(i===8)entry('demo-e',day(22),'1200','debit','Tuition payment');
 if(i===10)entry('demo-a',day(24),'18000','debit','Insurance');
 entry('demo-a',day(27),'1200','debit','Learning materials');
}
function record(id:string,kind:string,data:Record<string,unknown>){return {id:'demo-'+id,kind,data:JSON.stringify(data)}}
export const demoRecords=[
 ...['Germany','Italy','Canada','Japan','South Korea'].map((name,i)=>record('target-'+i,'target',{name,intake:'2027',programme:'DEMO postgraduate programme',stage:['Planning','Shortlisting','Documents in progress'][i%3]})),
 ...['Germany','Italy','Canada','Japan','South Korea'].map((country,i)=>record('goal-'+i,'goal',{name:'DEMO '+country+' personal funding goal',country,amount:String(1800000+i*100000),currency:'BDT',date:'2027-09-01',account:'demo-a'})),
 record('euro-goal','goal',{name:'DEMO Foreign currency reserve',country:'Italy',amount:'7000',currency:'EUR',date:'2027-08-01',account:'demo-e'}),
 record('parent','sponsor',{name:'DEMO Parent',relationship:'Parent',income:'75000',currency:'BDT',source:'SAMPLE Business income',notes:'Fictional person. No bank certification or real identity.'}),
 record('relative','sponsor',{name:'DEMO Relative',relationship:'Relative',income:'60000',currency:'BDT',source:'SAMPLE Employment',notes:'Promised support is excluded from recorded balances.'}),
 record('award','scholarship',{name:'DEMO Merit award',amount:'1500',currency:'EUR',date:'2027-01-01',status:'Pending',notes:'Synthetic pending award; not included in funds.'}),
 ...['Funding source summary','Sponsor relationship explanation','Tuition receipt','Original bank statement'].map((name,i)=>record('check-'+i,'checklist',{name:'DEMO '+name,status:i<2?'Ready':'Missing',date:'2027-06-01',notes:'SAMPLE preparation only; fictional documents are not evidence.'})),
 record('legacy-expense','expense',{name:'DEMO historical tuition plan',amount:'2500',currency:'EUR',frequency:'One-time',months:1,country:'Italy'})
];
export const demoDocuments=['Bank statement explanation','Sponsor declaration explanation','Income evidence checklist','Transaction receipt explanation','Scholarship letter explanation'].map((name,i)=>({id:'demo-doc-'+i,name:'DEMO-'+name.replaceAll(' ','-')+'.txt',mime:'text/plain',size:256,hash:'DEMO-SYNTHETIC-NOT-A-CHECKSUM',created:DEMO_END+'T00:00:00Z',details:JSON.stringify({category:'SAMPLE explanatory note',expiry:'',notes:'Not a bank statement or official evidence'})}));
export function demoSummary(start=DEMO_START,end=DEMO_END){return {label:'DEMO / SAMPLE — FICTIONAL, NOT FINANCIAL EVIDENCE',start,end,accounts:demoAccounts.map(a=>({...a,closingMinor:balance(a,demoTransactions,end)})),transactions:demoTransactions.filter(t=>t.date>=start&&t.date<=end),records:demoRecords,documents:demoDocuments}}
export function demoCSV(start=DEMO_START,end=DEMO_END){return [['DEMO / SAMPLE — NOT FINANCIAL EVIDENCE'],['Date','Account','Currency','Direction','Amount','Category','Transfer'],...demoSummary(start,end).transactions.map(t=>{const a=demoAccounts.find(a=>a.id===t.account)!;return [t.date,a.name,a.currency,t.direction,(t.amount/10**digits(a.currency)).toFixed(digits(a.currency)),t.category,t.transfer||'']})].map(row=>row.map(csvCell).join(',')).join('\r\n')}
export function demoDownload(format:'csv'|'json'|'document',id?:string,start=DEMO_START,end=DEMO_END){const document=demoDocuments.find(d=>d.id===id);const text=format==='csv'?demoCSV(start,end):format==='json'?JSON.stringify(demoSummary(start,end),null,2):'DEMO / SAMPLE — FICTIONAL\nNOT A BANK STATEMENT, CERTIFICATE OR FINANCIAL EVIDENCE.\n'+(document?.name||'SAMPLE explanatory note')+'\nThis file demonstrates the document download interface. It contains no real personal information.';const blob=new Blob([text],{type:format==='json'?'application/json':format==='csv'?'text/csv;charset=utf-8':'text/plain'});const url=URL.createObjectURL(blob),a=documentCreate();a.href=url;a.download=format==='document'?(document?.name||'DEMO-note.txt'):'DEMO-VisaFund.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function documentCreate(){return document.createElement('a')}
