import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {detectImage,MAX_PHOTO_BYTES} from '../../../lib/image-rules.mjs';
const json=(d:unknown,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'请先登录'},401);
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
 try{
  if(!await env.DB!.prepare('SELECT id FROM profiles WHERE id=?').bind(user.userId).first())return json({error:'请先完成校园资料注册'},403);
  const reader=req.body?.getReader();if(!reader)return json({error:'请选择图片'},400);
  const chunks:Uint8Array[]=[];let total=0;while(true){const r=await reader.read();if(r.done)break;total+=r.value.length;if(total>MAX_PHOTO_BYTES+65536){await reader.cancel();return json({error:'图片不能超过 5 MB'},413)}chunks.push(r.value)}
  const raw=new Uint8Array(total);let at=0;for(const b of chunks){raw.set(b,at);at+=b.length}
  const form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('Content-Type')||''},body:raw}).formData();const file=form.get('file');
  if(!file||typeof file==='string'||file.size>MAX_PHOTO_BYTES)return json({error:'请选择 5 MB 以内的图片'},400);
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=detectImage(bytes);if(!mime)return json({error:'支持 JPG、PNG 和 WebP 图片'},400);
  const recent=await env.DB!.prepare('SELECT COUNT(*) n FROM photos WHERE owner=? AND created>?').bind(user.userId,Date.now()-3600000).first<{n:number}>();if((recent?.n||0)>=60)return json({error:'上传过于频繁，请稍后再试'},429);
  const id=crypto.randomUUID(),key='photos/'+id;await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:mime}});
  try{await env.DB!.prepare('INSERT INTO photos(id,owner,object_key,mime,created) VALUES(?,?,?,?,?)').bind(id,user.userId,key,mime,Date.now()).run()}catch(e){await env.BUCKET!.delete(key);throw e}
  return json({id,url:'/api/images/'+id});
 }catch{return json({error:'图片上传未完成，请重试'},503)}
}
export async function DELETE(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'请先登录'},401);if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
 const id=new URL(req.url).searchParams.get('id');const photo=await env.DB!.prepare('SELECT object_key FROM photos WHERE id=? AND owner=? AND post IS NULL').bind(id,user.userId).first<{object_key:string}>();if(!photo)return json({error:'无法删除这张图片'},403);
 await env.BUCKET!.delete(photo.object_key);await env.DB!.prepare('DELETE FROM photos WHERE id=? AND owner=? AND post IS NULL').bind(id,user.userId).run();return json({ok:true});
}
