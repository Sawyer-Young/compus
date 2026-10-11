import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 try{const user=await getChatGPTUser();const db=env.DB!;const profile=user?await db.prepare('SELECT * FROM profiles WHERE id=?').bind(user.userId).first():null;
 const id=new URL(req.url).searchParams.get('post');
 if(id){const rows=await db.prepare('SELECT c.*,p.name FROM comments c JOIN profiles p ON p.id=c.author WHERE c.post=? ORDER BY c.created').bind(id).all();return json(rows.results)}
 const rows=await db.prepare(`SELECT p.*,u.name,u.school,(SELECT COUNT(*) FROM comments c WHERE c.post=p.id) AS comments,(SELECT COUNT(*) FROM likes l WHERE l.post=p.id) AS likes, EXISTS(SELECT 1 FROM likes l WHERE l.post=p.id AND l.user=?) AS liked FROM posts p JOIN profiles u ON u.id=p.author ORDER BY p.created DESC LIMIT 200`).bind(user?.userId||'').all();return json({user:user?{id:user.userId}:null,profile,posts:rows.results});
 }catch{return json({error:'社区暂时无法加载，请稍后重试'},503)}
}
export async function POST(req:Request){
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'请先登录'},401);
 try{const raw=await req.text();if(raw.length>16000)return json({error:'内容过长'},400);const data=JSON.parse(raw);const db=env.DB!;const now=Date.now();const str=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
 if(data.action==='profile'){const name=str(data.name,24),school=str(data.school,60);if(!name||!school)return json({error:'请填写昵称和学校'},400);await db.prepare('INSERT INTO profiles(id,name,school,bio,created) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,school=excluded.school,bio=excluded.bio').bind(user.userId,name,school,str(data.bio,160),now).run();return json({ok:true})}
 const profile=await db.prepare('SELECT id FROM profiles WHERE id=?').bind(user.userId).first();if(!profile)return json({error:'请先完成校园资料注册'},403);
 if(data.action==='post'){const title=str(data.title,100),body=str(data.body,5000),category=str(data.category,20);if(!title||!body||!['校园动态','学习交流','互助问答','闲置交易','搭子招募','失物招领'].includes(category))return json({error:'请填写标题、正文和分区'},400);await db.prepare('INSERT INTO posts(id,author,title,body,category,created) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,title,body,category,now).run();return json({ok:true})}
 const post=await db.prepare('SELECT * FROM posts WHERE id=?').bind(str(data.post,80)).first<{id:string;author:string;resolved:number}>();if(!post)return json({error:'帖子不存在'},404);
 if(data.action==='comment'){const body=str(data.body,2000);if(!body)return json({error:'评论不能为空'},400);await db.prepare('INSERT INTO comments(id,post,author,body,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),post.id,user.userId,body,now).run()}
 else if(data.action==='like'){const liked=await db.prepare('SELECT 1 FROM likes WHERE post=? AND user=?').bind(post.id,user.userId).first();await db.prepare(liked?'DELETE FROM likes WHERE post=? AND user=?':'INSERT INTO likes(post,user) VALUES(?,?)').bind(post.id,user.userId).run()}
 else if(data.action==='resolve'){if(post.author!==user.userId)return json({error:'仅作者可以修改状态'},403);await db.prepare('UPDATE posts SET resolved=? WHERE id=?').bind(post.resolved?0:1,post.id).run()}
 else if(data.action==='delete'){if(post.author!==user.userId)return json({error:'仅作者可以删除'},403);await db.batch([db.prepare('DELETE FROM comments WHERE post=?').bind(post.id),db.prepare('DELETE FROM likes WHERE post=?').bind(post.id),db.prepare('DELETE FROM posts WHERE id=?').bind(post.id)])}
 else return json({error:'未知操作'},400);return json({ok:true});
 }catch{return json({error:'操作未完成，请稍后重试'},500)}
}
