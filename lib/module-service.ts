import {db,HttpError} from '@/lib/server';
import {resolveModules,operationModule} from '@/lib/module-policy';
export async function moduleSettings(){const rows=await db().prepare("SELECT title,body FROM platform_content WHERE kind='setting' AND status='published' AND title LIKE 'module:%' ORDER BY updated DESC,id DESC").all<{title:string;body:string}>();return resolveModules(rows.results)}
export async function requireModule(route:string){const module=(await moduleSettings()).find(m=>m.route===route);if(module&&!module.enabled)throw new HttpError(403,module.label+' is currently disabled by the platform administrator. Existing records are preserved.')}
export async function requireOperation(kind:string|undefined){const route=operationModule(kind);if(route)await requireModule(route)}
