export interface AccountRow {id:string;owner:string;name:string;bank:string;currency:string;opening:number;date:string;details:string;created:string}
export interface TransactionRow {id:string;owner:string;account:string;date:string;amount:number;direction:string;category:string;description:string;details:string;fingerprint:string|null;transfer:string|null;imported:number;deleted:number;created:string;updated:string}
export interface RecordRow {id:string;owner:string;kind:string;data:string;created:string;updated:string}
export interface DocumentRow {id:string;owner:string;name:string;mime:string;size:number;hash:string;details:string;created:string}
export interface TableRows {accounts:AccountRow;transactions:TransactionRow;records:RecordRow;documents:DocumentRow}
