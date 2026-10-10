import {demoAccounts,demoTransactions,demoRecords,demoDocuments,DEMO_END} from './demo.ts';
import {minor,currencies,balance} from './finance.ts';
import {destinations} from './countries.ts';
export const DEMO_STORAGE='visafund-demo-practice-v1';
export function freshDemo(){return structuredClone({accounts:demoAccounts,transactions:demoTransactions,records:demoRecords,documents:demoDocuments})}
export type DemoState=ReturnType<typeof freshDemo>;
const text=(v:unknown)=>String(v??'').trim();
function date(v:unknown){const s=text(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Choose a valid date');return s}
function amount(v:unknown,c:string,zero=false){const n=minor(text(v),c);if(n<0||(!zero&&n===0)||!Number.isSafeInteger(n))throw Error('Enter a positive amount');return n}
export function demoSave(state:DemoState,kind:string,form:Record<string,unknown>,editId?:string):DemoState{
 const next=structuredClone(state),id=editId||'demo-practice-'+crypto.randomUUID();
 const name=text(form.name);const country=text(form.country||form.name);
 if(['target','goal','expense'].includes(kind)&&!destinations.some(c=>c.name===country))throw Error('Choose a supported destination');
 if(kind==='account'){
  if(!name||!text(form.bank))throw Error('Account nickname and fictional bank are required');
  const currency=text(form.currency);if(!currencies.includes(currency))throw Error('Unsupported currency');
  const old=next.accounts.find(a=>a.id===id);if(old&&old.currency!==currency&&next.transactions.some(t=>t.account===id))throw Error('Cannot change the currency of an account with transactions');
  const opening=amount(form.opening,currency,true),openingDate=date(form.date);
  if(next.transactions.some(t=>t.account===id&&t.date<openingDate))throw Error('Opening date must precede recorded transactions');
  const row={id,name:'DEMO '+name.replace(/^DEMO /,''),bank:'SAMPLE '+text(form.bank).replace(/^SAMPLE /,''),currency,opening,date:openingDate,details:JSON.stringify({...form,opening:undefined,name:undefined,bank:undefined,masked:text(form.masked).slice(-4)})};
  next.accounts=next.accounts.filter(a=>a.id!==id);next.accounts.push(row);
 }else if(kind==='transaction'){
  const a=next.accounts.find(a=>a.id===form.account);if(!a)throw Error('Choose an account');
  const d=date(form.date);if(d<a.date)throw Error('Transaction date cannot precede account opening');
  if(!['credit','debit'].includes(text(form.direction)))throw Error('Choose Credit or Debit');
  if(!text(form.description)||!text(form.category))throw Error('Description and category are required');
  if(next.transactions.find(t=>t.id===id)?.transfer)throw Error('Remove paired transfers together');
  next.transactions=next.transactions.filter(t=>t.id!==id);next.transactions.push({id,account:a.id,date:d,amount:amount(form.amount,a.currency),direction:text(form.direction),description:'DEMO '+text(form.description).replace(/^DEMO /,''),category:text(form.category),details:JSON.stringify({...form,purpose:'SAMPLE '+text(form.purpose)}),imported:0,deleted:0,transfer:null});
 }else if(kind==='transfer'){
  const a=next.accounts.find(a=>a.id===form.from),b=next.accounts.find(a=>a.id===form.to);if(!a||!b||a.id===b.id)throw Error('Choose two different accounts');
  const d=date(form.date);if(d<a.date||d<b.date)throw Error('Transfer cannot precede account opening');
  const outgoing=amount(form.amount,a.currency),incoming=amount(form.received,b.currency);if(a.currency===b.currency&&outgoing!==incoming)throw Error('Same-currency transfers must match');
  for(const [account,n,direction] of [[a.id,outgoing,'debit'],[b.id,incoming,'credit']] as const)next.transactions.push({id:id+'-'+direction,account,date:d,amount:n,direction,description:'DEMO Internal transfer',category:'Internal transfer',details:JSON.stringify({reference:text(form.reference),source:'SAMPLE internal transfer'}),transfer:id,deleted:0,imported:0});
 }else if(kind==='document'){
  const row={id,name:'DEMO-'+(name||'Practice-document')+'.txt',mime:'text/plain',size:256,hash:'DEMO-SYNTHETIC-NOT-A-CHECKSUM',created:DEMO_END+'T00:00:00Z',details:JSON.stringify({category:text(form.categoryDocument),expiry:text(form.expiry),notes:'SAMPLE '+text(form.notes)})};next.documents.push(row);
 }else if(['goal','sponsor','target','profile','scholarship','checklist','expense','reconciliation'].includes(kind)){
  if(!name)throw Error('A name or destination is required');
  if(['goal','sponsor','scholarship','expense','reconciliation'].includes(kind)&&!currencies.includes(text(form.currency)))throw Error('Unsupported currency');
  if(kind==='goal'){const a=next.accounts.find(a=>a.id===form.account);if(!a||a.currency!==form.currency)throw Error('Goal currency must match its linked account');amount(form.amount,a.currency);date(form.date)}
  if(kind==='sponsor')amount(form.income,text(form.currency),true);
  if(['expense','scholarship'].includes(kind))amount(form.amount,text(form.currency));
  if(kind==='reconciliation'){const a=next.accounts.find(a=>a.id===form.name);if(!a||a.currency!==form.currency)throw Error('Choose a matching account currency');const recorded=amount(form.balance,a.currency,true),at=date(form.date);if(recorded!==balance(a,next.transactions,at))throw Error('Sample closing balance does not match the ledger');if(!next.documents.some(d=>d.id===form.document))throw Error('Choose a SAMPLE note')}
  if(kind==='target'&&form.primary==='yes')next.records=next.records.map(r=>r.kind==='target'?{...r,data:JSON.stringify({...JSON.parse(r.data),primary:'no'})}:r);
  next.records=next.records.filter(r=>r.id!==id);next.records.push({id,kind,data:JSON.stringify({...form,...(kind==='target'?{}:{name:kind==='reconciliation'?name:'DEMO '+name.replace(/^DEMO /,'')})})});
 }else throw Error('This action is unavailable in demo');
 if(next.transactions.length>2000||next.records.length>500||next.accounts.length>50)throw Error('Demo limit reached. Reset Demo to continue.');return next;
}
export function demoRemove(state:DemoState,kind:string,id:string){const next=structuredClone(state);if(kind==='account'){if(next.transactions.some(t=>t.account===id)||next.records.some(r=>JSON.parse(r.data).account===id))throw Error('Remove linked transactions and goals first');next.accounts=next.accounts.filter(a=>a.id!==id)}else if(kind==='transaction'){const t=next.transactions.find(t=>t.id===id);next.transactions=next.transactions.filter(r=>t?.transfer?r.transfer!==t.transfer:r.id!==id)}else if(kind==='document')next.documents=next.documents.filter(r=>r.id!==id);else next.records=next.records.filter(r=>r.id!==id);return next}
export function monthlyHistory(s:DemoState,start:string,end:string,currency:string){const rows=[];for(const a of s.accounts.filter(a=>a.currency===currency)){for(let month=start.slice(0,7);month<=end.slice(0,7);){const first=month+'-01',last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10),from=first<start?start:first,to=last>end?end:last;let opening=from<a.date?0:a.opening+s.transactions.filter(t=>t.account===a.id&&t.date<from).reduce((n,t)=>n+(t.direction==='credit'?t.amount:-t.amount),0);const ts=s.transactions.filter(t=>t.account===a.id&&t.date>=from&&t.date<=to).sort((a,b)=>a.date.localeCompare(b.date));let closing=opening,minimum=opening;const credits=ts.filter(t=>t.direction==='credit').reduce((n,t)=>n+t.amount,0),debits=ts.filter(t=>t.direction==='debit').reduce((n,t)=>n+t.amount,0);if(a.date>from&&a.date<=to){closing+=a.opening;minimum=closing}for(const d of [...new Set(ts.map(t=>t.date))]){closing+=ts.filter(t=>t.date===d).reduce((n,t)=>n+(t.direction==='credit'?t.amount:-t.amount),0);minimum=Math.min(minimum,closing)}rows.push({account:a.id,month,opening,credits,debits,closing,minimum});month=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),1)).toISOString().slice(0,7)}}return rows}
// Treat browser-local state as untrusted, reject corruption; never send it to the server.
export function restoreDemo(raw:string):DemoState{if(raw.length>2_000_000)throw Error('Demo storage too large');const s=JSON.parse(raw) as DemoState;for(const [kind,max] of [['accounts',50],['transactions',2000],['records',500],['documents',500]] as const){if(!Array.isArray(s[kind])||s[kind].length>max)throw Error('Invalid demo storage');for(const r of s[kind]){if(typeof r.id!=='string'||!r.id.startsWith('demo-'))throw Error('Invalid sample identity')}}for(const a of s.accounts){if(!currencies.includes(a.currency)||!Number.isSafeInteger(a.opening)||typeof a.name!=='string'||typeof a.bank!=='string')throw Error('Invalid sample account');date(a.date);JSON.parse(a.details)}for(const t of s.transactions){if(!s.accounts.some(a=>a.id===t.account)||!Number.isSafeInteger(t.amount)||t.amount<=0||!['credit','debit'].includes(t.direction)||typeof t.description!=='string'||typeof t.category!=='string')throw Error('Invalid sample transaction');date(t.date);JSON.parse(t.details)}for(const r of s.records)JSON.parse(r.data);for(const d of s.documents){JSON.parse(d.details);if(typeof d.name!=='string'||typeof d.created!=='string')throw Error('Invalid sample note')}return s}
