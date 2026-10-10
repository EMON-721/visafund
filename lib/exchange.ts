import {z} from 'zod';
import {minor,digits,currencies} from './finance.ts';
export const RATE_TTL=24*60*60*1000;
export const pairSchema=z.object({base:z.enum(currencies as [string,...string[]]),quote:z.enum(currencies as [string,...string[]]),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
export const rateSchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s),base:z.string(),quote:z.string(),rate:z.number().finite().positive().max(1e9)});
export type RateQuote={base:string;quote:string;rate:number;date:string;fetchedAt:string;stale:boolean;source:string;historical:boolean;warning?:string};
// Integer rational arithmetic; round half up once to the target currency's minor unit.
function rational(value:string){if(!/^\d{1,15}(\.\d{1,16})?$/.test(value))throw Error('Invalid decimal');const [w,f='']=value.split('.');return [BigInt(w+f),BigInt(10)**BigInt(f.length)] as const}
export function convertMinor(amount:string,from:string,to:string,rate:string,fee='0',spread='0'){
 const n=minor(amount,from),cost=minor(fee,to);if(n<0||cost<0)throw Error('Amount and fee must be nonnegative');const [rn,rd]=rational(rate),[sn,sd]=rational(spread);if(rn<=BigInt(0)||sn>BigInt(100)*sd)throw Error('Invalid rate or spread');
 const numerator=BigInt(n)*rn*(BigInt(100)*sd-sn)*BigInt(10)**BigInt(digits(to)),denominator=BigInt(10)**BigInt(digits(from))*rd*BigInt(100)*sd;
 const rounded=(numerator*BigInt(2)+denominator)/(BigInt(2)*denominator)-BigInt(cost);if(rounded<BigInt(0)||rounded>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Result outside supported range');return Number(rounded)
}
export function normalizeRate(raw:unknown,base:string,quote:string,requested:string|undefined,now:number):RateQuote{const x=rateSchema.parse(raw);if(x.base.toUpperCase()!==base||x.quote.toUpperCase()!==quote||x.date>new Date(now).toISOString().slice(0,10)||(requested&&x.date>requested))throw Error('Provider returned an invalid pair or date');return {...x,base,quote,source:'Frankfurter v2 · blended official-source reference rates',fetchedAt:new Date(now).toISOString(),stale:!requested&&now-Date.parse(x.date)>4*RATE_TTL,historical:!!requested}}
