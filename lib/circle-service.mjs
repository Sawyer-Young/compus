import {circleFeedSelection} from './school-feed.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function circleRequest(req,db,user){
 const url=new URL(req.url);
 if(req.method==='GET'){
  const id=url.searchParams.get('id');
  if(id){const circle=await db.prepare("SELECT r.id,r.name,r.description,r.category,r.school,r.owner,r.created,p.name AS ownerName,(SELECT COUNT(*) FROM room_members m WHERE m.room=r.id) AS memberCount,EXISTS(SELECT 1 FROM room_members m WHERE m.room=r.id AND m.user=?) AS joined FROM rooms r JOIN profiles p ON p.id=r.owner WHERE r.id=? AND r.kind='group'").bind(user||'',id).first();if(!circle)return json({error:'圈子不存在'},404);
   const replies=await db.prepare('SELECT c.id,c.room,c.author,c.body,c.created,p.name FROM circle_replies c JOIN profiles p ON p.id=c.author WHERE c.room=? ORDER BY c.created LIMIT 200').bind(id).all();return json({circle,replies:replies.results});
  }
  const profile=user?await db.prepare('SELECT school FROM profiles WHERE id=?').bind(user).first():null;const feed=circleFeedSelection({school:profile?.school||'',mode:url.searchParams.get('scope')||'priority',user:user||'',mine:url.searchParams.get('mine')==='1'});
  const list=await db.prepare(`SELECT r.id,r.name,r.description,r.category,r.school,r.owner,r.created,p.name AS ownerName,(SELECT COUNT(*) FROM room_members m WHERE m.room=r.id) AS memberCount,EXISTS(SELECT 1 FROM room_members m WHERE m.room=r.id AND m.user=?) AS joined,(SELECT COUNT(*) FROM circle_replies c WHERE c.room=r.id) AS replyCount FROM rooms r JOIN profiles p ON p.id=r.owner ${feed.sql}`).bind(user||'',...feed.params).all();return json(list.results);
 }
 if(!user)return json({error:'请先登录'},401);
 if(req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return json({error:'请求来源无效'},403);
 if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(user).first())return json({error:'请先注册校园资料'},403);
 const raw=await req.text();if(raw.length>10000)return json({error:'内容过长'},400);let d;try{d=JSON.parse(raw)}catch{return json({error:'请求格式无效'},400)}
 if(d?.action!=='reply'||typeof d.body!=='string'||!d.body.trim()||d.body.length>2000)return json({error:'请填写 2000 字以内的回复'},400);
 const circle=await db.prepare("SELECT id FROM rooms WHERE id=? AND kind='group'").bind(String(d.room||'')).first();if(!circle)return json({error:'圈子不存在'},404);
 await db.prepare('INSERT INTO circle_replies(id,room,author,body,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),circle.id,user,d.body.trim(),Date.now()).run();return json({ok:true});
}
