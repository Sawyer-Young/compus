import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {canReadPhoto} from '../../../../lib/photo-access.mjs';
export async function GET(req:Request){
 const id=new URL(req.url).pathname.split('/').pop(),user=await getChatGPTUser();
 const photo=await env.DB!.prepare('SELECT owner,post,object_key,mime FROM photos WHERE id=?').bind(id).first<{owner:string;post:string|null;object_key:string;mime:string}>();
 const exists=photo?.post?!!(await env.DB!.prepare('SELECT id FROM posts WHERE id=?').bind(photo.post).first()):false;
 if(!canReadPhoto(photo,user?.userId,exists)||!photo)return new Response('Not found',{status:404});
 const image=await env.BUCKET!.get(photo.object_key);if(!image)return new Response('Not found',{status:404});
 return new Response(image.body,{headers:{'Content-Type':photo.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=300'}});
}
