const send=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const kinds=['快递代取','代购拼单','学习交流','兴趣搭子','其他'];
// Identity comes exclusively from the server's Sites auth helper.
export async function chatRequest(req,db,user){
 if(!user)return send({error:'请先登录'},401);
 const profile=await db.prepare('SELECT * FROM profiles WHERE id=?').bind(user).first();
 if(!profile)return send({error:'请先注册校园资料'},403);
 const url=new URL(req.url),roomId=url.searchParams.get('room');
 if(req.method==='GET'){
  if(roomId){
   const member=await db.prepare('SELECT * FROM room_members WHERE room=? AND user=?').bind(roomId,user).first();
   if(!member)return send({error:'只有会话成员可以查看消息'},403);
   const room=await db.prepare('SELECT * FROM rooms WHERE id=?').bind(roomId).first();
   if(!room)return send({error:'会话不存在'},404);
   const before=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER;
   const rows=await db.prepare('SELECT m.*,p.name FROM messages m JOIN profiles p ON p.id=m.sender WHERE m.room=? AND m.seq<? ORDER BY m.seq DESC LIMIT 60').bind(roomId,before).all();
   const members=await db.prepare('SELECT p.id,p.name,p.school,rm.joined FROM room_members rm JOIN profiles p ON p.id=rm.user WHERE rm.room=? ORDER BY rm.joined LIMIT 200').bind(roomId).all();
   return send({room,messages:rows.results.reverse(),members:members.results,hasMore:rows.results.length===60});
  }
  if(url.searchParams.has('people')){const q=clean(url.searchParams.get('people'),60);if(!q)return send([]);const rows=await db.prepare('SELECT id,name,school FROM profiles WHERE id<>? AND (instr(name,?)>0 OR instr(school,?)>0) ORDER BY name LIMIT 20').bind(user,q,q).all();return send(rows.results)}
  const list=await db.prepare(`SELECT r.*,CASE WHEN r.kind='dm' THEN (SELECT p.name FROM room_members rm JOIN profiles p ON p.id=rm.user WHERE rm.room=r.id AND rm.user<>? LIMIT 1) ELSE r.name END AS displayName,(SELECT COUNT(*) FROM room_members rm WHERE rm.room=r.id) AS memberCount,(SELECT body FROM messages m WHERE m.room=r.id ORDER BY m.seq DESC LIMIT 1) AS lastMessage,(SELECT MAX(seq) FROM messages m WHERE m.room=r.id) AS lastSeq,(SELECT MAX(created) FROM messages m WHERE m.room=r.id) AS lastAt,(SELECT COUNT(*) FROM messages m WHERE m.room=r.id AND m.seq>me.read_seq AND m.sender<>?) AS unread FROM rooms r JOIN room_members me ON me.room=r.id AND me.user=? ORDER BY COALESCE((SELECT MAX(created) FROM messages m WHERE m.room=r.id),r.created) DESC`).bind(user,user,user).all();
  const circles=await db.prepare(`SELECT r.*,(SELECT COUNT(*) FROM room_members rm WHERE rm.room=r.id) AS memberCount,EXISTS(SELECT 1 FROM room_members rm WHERE rm.room=r.id AND rm.user=?) AS joined,p.name AS ownerName FROM rooms r JOIN profiles p ON p.id=r.owner WHERE r.kind='group' ORDER BY r.created DESC LIMIT 100`).bind(user).all();
  return send({rooms:list.results,circles:circles.results});
 }
 if(req.method!=='POST')return send({error:'请求方法不支持'},405);
 const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return send({error:'请求来源无效'},403);
 const raw=await req.text();if(raw.length>12000)return send({error:'内容过长'},400);
 let d;try{d=JSON.parse(raw)}catch{return send({error:'请求格式无效'},400)}
 if(!d||typeof d!=='object')return send({error:'请求格式无效'},400);
 const now=Date.now();
 if(d.action==='dm'){
  const to=clean(d.to,200);if(to===user)return send({error:'请选择其他同学'},400);
  if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(to).first())return send({error:'这位同学尚未注册'},404);
  const pair=JSON.stringify([user,to].sort()),id=crypto.randomUUID();
  // Unique pair guarantees a single DM even if both people start it together.
  await db.batch([db.prepare("INSERT OR IGNORE INTO rooms(id,kind,name,description,category,school,owner,pair,created) VALUES(?,'dm','','','','',?,?,?)").bind(id,user,pair,now),db.prepare('INSERT OR IGNORE INTO room_members(room,user,joined,read_seq) SELECT id,?,?,0 FROM rooms WHERE pair=?').bind(user,now,pair),db.prepare('INSERT OR IGNORE INTO room_members(room,user,joined,read_seq) SELECT id,?,?,0 FROM rooms WHERE pair=?').bind(to,now,pair)]);
  return send({id:(await db.prepare('SELECT id FROM rooms WHERE pair=?').bind(pair).first()).id});
 }
 if(d.action==='create'){
  const name=clean(d.name,40),description=clean(d.description,1000),category=clean(d.category,20);if(!name||!kinds.includes(category))return send({error:'请填写圈子名称并选择类型'},400);
  const count=await db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE owner=? AND kind='group'").bind(user).first();if(count.n>=20)return send({error:'最多创建 20 个圈子'},400);
  const id=crypto.randomUUID();await db.batch([db.prepare("INSERT INTO rooms(id,kind,name,description,category,school,owner,created) VALUES(?,'group',?,?,?,?,?,?)").bind(id,name,description,category,profile.school,user,now),db.prepare('INSERT INTO room_members(room,user,joined,read_seq) VALUES(?,?,?,0)').bind(id,user,now)]);return send({id});
 }
 const id=clean(d.room,80),room=await db.prepare('SELECT * FROM rooms WHERE id=?').bind(id).first();if(!room)return send({error:'会话不存在'},404);
 if(d.action==='join'){
  if(room.kind!=='group')return send({error:'无法加入私聊'},403);
  await db.prepare('INSERT OR IGNORE INTO room_members(room,user,joined,read_seq) VALUES(?,?,?,COALESCE((SELECT MAX(seq) FROM messages WHERE room=?),0))').bind(id,user,now,id).run();return send({id});
 }
 const member=await db.prepare('SELECT * FROM room_members WHERE room=? AND user=?').bind(id,user).first();if(!member)return send({error:'你不是此会话成员'},403);
 if(d.action==='message'){
  const body=clean(d.body,2000);if(!body)return send({error:'消息不能为空'},400);
  const recent=await db.prepare('SELECT COUNT(*) AS n FROM messages WHERE sender=? AND created>?').bind(user,now-60000).first();if(recent.n>=30)return send({error:'消息发送过快，请稍后再试'},429);
  // Recheck membership inside the insert to close a concurrent leave/kick race.
  const r=await db.prepare('INSERT INTO messages(room,sender,body,created) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM room_members WHERE room=? AND user=?)').bind(id,user,body,now,id,user).run();if(!r.meta.changes)return send({error:'你已离开此会话'},403);return send({ok:true});
 }
 if(d.action==='read'){
  const seq=Number(d.seq);if(!Number.isSafeInteger(seq)||seq<0)return send({error:'阅读位置无效'},400);
  await db.prepare('UPDATE room_members SET read_seq=MAX(read_seq,MIN(?,COALESCE((SELECT MAX(seq) FROM messages WHERE room=?),0))) WHERE room=? AND user=?').bind(seq,id,id,user).run();return send({ok:true});
 }
 if(d.action==='leave'){
  if(room.kind!=='group'||room.owner===user)return send({error:'圈主需要保留在圈子内'},403);
  await db.prepare('DELETE FROM room_members WHERE room=? AND user=?').bind(id,user).run();return send({ok:true});
 }
 if(d.action==='update'||d.action==='remove'){
  if(room.kind!=='group'||room.owner!==user)return send({error:'仅圈主可以管理圈子'},403);
  if(d.action==='update'){const name=clean(d.name,40);if(!name)return send({error:'名称不能为空'},400);await db.prepare('UPDATE rooms SET name=?,description=? WHERE id=?').bind(name,clean(d.description,1000),id).run()}
  else{const target=clean(d.user,200);if(target===user)return send({error:'不能移除圈主'},400);await db.prepare('DELETE FROM room_members WHERE room=? AND user=?').bind(id,target).run()}
  return send({ok:true});
 }
 return send({error:'未知操作'},400);
}
