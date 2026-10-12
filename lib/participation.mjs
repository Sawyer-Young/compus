const json=(d,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store'}});
export async function participate(db,user,post){
 if(post.category!=='搭子招募'||!post.capacity)return json({error:'这条招募尚未设置名额，请私聊发起人'},400);
 if(user===post.author)return json({error:'发起人已计入总人数'},400);
 const joined=await db.prepare('SELECT 1 FROM participants WHERE post=? AND user=?').bind(post.id,user).first();
 if(joined){await db.prepare('DELETE FROM participants WHERE post=? AND user=?').bind(post.id,user).run();return json({ok:true})}
 const r=await db.prepare(`INSERT OR IGNORE INTO participants(post,user,created) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM posts p WHERE p.id=? AND p.resolved=0 AND p.capacity>(SELECT COUNT(*) FROM participants a WHERE a.post=p.id))`).bind(post.id,user,Date.now(),post.id).run();
 if(!r.meta.changes)return json({error:'招募已关闭或名额已满'},409);return json({ok:true});
}
export async function createPostCircle(db,user,post){
 if(post.author!==user)return json({error:'仅发起人可以创建关联圈子'},403);
 if(!['搭子招募','互助问答'].includes(post.category))return json({error:'此内容不支持创建圈子'},400);
 if(post.circle)return json({ok:true,id:post.circle});
 const profile=await db.prepare('SELECT school FROM profiles WHERE id=?').bind(user).first();const id=crypto.randomUUID(),now=Date.now();
 // One batch links the circle and includes current applicants; repeated calls reuse it.
 await db.batch([
  db.prepare("UPDATE posts SET circle=? WHERE id=? AND circle='' ").bind(id,post.id),
  db.prepare("INSERT OR IGNORE INTO rooms(id,kind,name,description,category,school,owner,created) SELECT circle,'group',title,body,?,?,author,? FROM posts WHERE id=?").bind(post.category==='搭子招募'?'兴趣搭子':'其他',post.school||profile.school,now,post.id),
  db.prepare('INSERT OR IGNORE INTO room_members(room,user,joined,read_seq) SELECT circle,author,?,0 FROM posts WHERE id=?').bind(now,post.id),
  db.prepare('INSERT OR IGNORE INTO room_members(room,user,joined,read_seq) SELECT p.circle,a.user,?,0 FROM posts p JOIN participants a ON a.post=p.id WHERE p.id=?').bind(now,post.id)
 ]);
 const p=await db.prepare('SELECT circle FROM posts WHERE id=?').bind(post.id).first();return json({ok:true,id:p.circle});
}
