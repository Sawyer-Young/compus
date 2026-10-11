import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {validatePost} from '../lib/post-rules.mjs';
import {participate,createPostCircle} from '../lib/participation.mjs';
test('task forms require meaningful fields and preserve free listings',()=>{
 const common={title:'台灯',body:'正常使用',category:'闲置交易'};
 assert.throws(()=>validatePost(common),/价格/);
 assert.throws(()=>validatePost({...common,price:'-1'}),/价格/);
 const free=validatePost({...common,price:'0',condition:'正常使用',place:'北区楼下'});assert.equal(free.price,0);
 assert.equal(validatePost({...common,price:'19.99',condition:'几乎全新',place:'东门'}).price,1999);
 assert.throws(()=>validatePost({...common,price:'20',condition:'正常使用'}),/交接地点/);
 const event={title:'羽毛球',body:'约一小时',category:'搭子招募',capacity:4,place:'体育馆',event_time:'2026-10-16T19:00'};
 assert.equal(validatePost(event).capacity,4);assert.throws(()=>validatePost({...event,capacity:1}),/总人数/);assert.throws(()=>validatePost({...event,event_time:''}),/活动时间/);
 assert.throws(()=>validatePost({title:'寻钥匙',body:'银色钥匙',category:'失物招领',task_kind:'寻找失物'}),/地点/);
 assert.equal(validatePost({title:'课程经验',body:'一些建议',category:'学习交流'}).price,null);
});
function setup(){const sql=new DatabaseSync(':memory:');for(const n of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+n,'utf8'));
 for(const id of ['a','b','c'])sql.prepare('INSERT INTO profiles(id,name,school,created) VALUES(?,?,?,?)').run(id,id,'测试大学',1);
 const db={prepare(query){let args=[];return{bind(...v){args=v;return this},async first(){return sql.prepare(query).get(...args)||null},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}}}}},async batch(items){sql.exec('BEGIN');try{for(const i of items)await i.run();sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}}};
 sql.prepare("INSERT INTO posts(id,author,title,body,category,created,capacity) VALUES('p','a','羽毛球','每周一起打球','搭子招募',1,2)").run();sql.prepare("INSERT INTO participants VALUES('p','a',1)").run();
 return{sql,db,post:()=>sql.prepare("SELECT * FROM posts WHERE id='p'").get()};}
test('registration enforces seats, preserves author, supports cancellation and closure',async()=>{const {db,sql,post}=setup();try{
 assert.equal((await participate(db,'a',post())).status,400);
 assert.equal((await participate(db,'b',post())).status,200);
 assert.equal((await participate(db,'c',post())).status,409);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM participants').get().n,2);
 assert.equal((await participate(db,'b',post())).status,200);assert.equal((await participate(db,'c',post())).status,200);
 sql.prepare("UPDATE posts SET resolved=1 WHERE id='p'").run();assert.equal((await participate(db,'b',post())).status,409);
 assert.equal((await participate(db,'c',post())).status,200);
 assert.equal((await participate(db,'b',{...post(),category:'闲置交易'})).status,400);
 }finally{sql.close()}});
test('linked circle is owner-only, includes current participants, and reuses the existing circle',async()=>{const {db,sql,post}=setup();try{
 await participate(db,'b',post());assert.equal((await createPostCircle(db,'b',post())).status,403);
 const response=await createPostCircle(db,'a',post());assert.equal(response.status,200);const {id}=await response.json();
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM room_members WHERE room=?').get(id).n,2);
 assert.equal((await (await createPostCircle(db,'a',post())).json()).id,id);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM rooms').get().n,1);
 }finally{sql.close()}});
