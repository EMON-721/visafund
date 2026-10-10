import {z} from 'zod';
// Normalize display metadata only. Financial response adapters validate required
// ledger/account fields before normalization; missing balances never become zero.
const strings=['id','name','owner','bank','currency','date','details','data','created','kind','account','direction','description','category','hash','mime','country','income','source','notes','relationship','status','programme','intake','stage','frequency','rate','to','nationality','jurisdiction','verified','effective','summary','action','entity','home','level','flag','region','document','balance'] as const;
const shape=Object.fromEntries(strings.map(k=>[k,z.string().default(['details','data'].includes(k)?'{}':'')])) as {[K in typeof strings[number]]:z.ZodDefault<z.ZodString>};
export const viewRowSchema=z.object({...shape,opening:z.number().default(0),amount:z.union([z.string(),z.number()]).default(0),transfer:z.string().nullable().default(null),imported:z.number().default(0),deleted:z.number().default(0),version:z.number().default(0),size:z.number().default(0),months:z.number().default(1),holding:z.number().default(0),history:z.number().default(0)}).passthrough();
export type ViewRow=z.infer<typeof viewRowSchema>;
export const viewRow=(input:unknown)=>viewRowSchema.parse(input);
export type WorkspaceData={accounts:ViewRow[];records:ViewRow[];documents:ViewRow[];rules:ViewRow[];totals:ViewRow[]};
const account=z.object({id:z.string().min(1),opening:z.number().int(),currency:z.string().min(3),date:z.string(),details:z.string()}).passthrough();
const tx=z.object({id:z.string().min(1),account:z.string().min(1),date:z.string(),amount:z.number().int(),direction:z.enum(['credit','debit']),details:z.string()}).passthrough();
export const decodeAccounts=(input:unknown)=>z.array(account).parse(input).map(viewRow);
export const decodeTransactions=(input:unknown)=>z.array(tx).parse(input).map(viewRow);
export function decodeWorkspace(input:unknown):WorkspaceData{const b=z.object({accounts:z.unknown(),records:z.array(z.object({id:z.string(),kind:z.string(),data:z.string()}).passthrough()),documents:z.array(z.object({id:z.string(),size:z.number(),hash:z.string(),details:z.string()}).passthrough()),rules:z.array(z.object({id:z.string(),data:z.string()}).passthrough()),totals:z.array(z.object({account:z.string(),direction:z.string(),amount:z.number()}).passthrough())}).parse(input);return {accounts:decodeAccounts(b.accounts),records:b.records.map(viewRow),documents:b.documents.map(viewRow),rules:b.rules.map(viewRow),totals:b.totals.map(viewRow)}}
