import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {publicPost,publicReplies} from '../lib/post-privacy.mjs';
import {validatePost} from '../lib/post-rules.mjs';
import {validatePhotoIds,canReadPhoto} from '../lib/photo-access.mjs';
import {detectImage} from '../lib/image-rules.mjs';
import {circleRequest} from '../lib/circle-service.mjs';
function setup(){const sql=new DatabaseSync(':memory:');for(const n of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+n,'utf8'));for(const id of ['a','b'])sql.prepare('INSERT INTO profiles(id,name,school,created) VALUES(?,?,?,?)').run(id,'同学'+id,'测试大学',1);const db={prepare(query){let args=[];return{bind(...v){args=v;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}}}}}};return {sql,db};}
test('anonymous posts and author replies never expose real identity, including to their owner',()=>{
 const p={id:'post',author:'a',name:'真实昵称',anonymous:1,circle:'identifying-circle',reward:1000};
 for(const who of ['b','a',undefined]){const output=publicPost(p,who);assert.equal(output.author,null);assert.equal(output.name,'匿名同学');assert.equal(output.circle,'');assert.equal(output.mine,who==='a')}
 const replies=publicReplies([{id:'1',author:'a',name:'真实昵称',body:'补充'},{id:'2',author:'b',name:'帮助者',body:'建议'}],p,'b');assert.equal(replies[0].author,null);assert.equal(replies[0].name,'匿名同学');assert.equal(replies[1].author,'b');
 assert.equal(publicPost({...p,anonymous:0},'b').author,'a');
});
test('help rewards and stars are validated; learning formats go to learning exchange',()=>{
 const d={title:'请帮忙',body:'问题内容',category:'互助问答',task_kind:'学习问题',anonymous:'1',reward:'12.50',difficulty:'4'};
 const p=validatePost(d);assert.equal(p.anonymous,1);assert.equal(p.reward,1250);assert.equal(p.difficulty,4);
 assert.throws(()=>validatePost({...d,difficulty:'6'}),/难度/);assert.throws(()=>validatePost({...d,reward:'-2'}),/悬赏/);
 const article=validatePost({title:'经验',body:'长文内容',category:'校园动态',content_kind:'专栏'});assert.equal(article.category,'学习交流');assert.equal(article.content_kind,'专栏');
});
test('photo ownership, unpublished previews and file signatures',async()=>{const {sql,db}=setup();try{
 sql.prepare("INSERT INTO photos(id,owner,object_key,mime,created) VALUES('pic','a','photos/pic','image/jpeg',1)").run();assert.deepEqual(await validatePhotoIds(db,'a',['pic']),['pic']);
 await assert.rejects(()=>validatePhotoIds(db,'b',['pic']),/失效/);await assert.rejects(()=>validatePhotoIds(db,'a',['missing']),/失效/);
 assert.equal(canReadPhoto({owner:'a',post:null},'b',false),false);assert.equal(canReadPhoto({owner:'a',post:null},'a',false),true);
 assert.equal(canReadPhoto({owner:'a',post:'post'},'b',true),true);assert.equal(canReadPhoto({owner:'a',post:'post'},'a',false),false);
 sql.prepare("UPDATE photos SET post='already-used' WHERE id='pic'").run();await assert.rejects(()=>validatePhotoIds(db,'a',['pic']),/失效/);
 assert.equal(detectImage(new Uint8Array([255,216,255,1])), 'image/jpeg');assert.equal(detectImage(new TextEncoder().encode('<svg onload="evil()"/>')),null);
 }finally{sql.close()}});
test('circle recruitment replies are public discussion and cannot expose private group messages or DMs',async()=>{const {sql,db}=setup();try{
 sql.prepare("INSERT INTO rooms(id,kind,name,owner,created) VALUES('g','group','运动圈','a',1)").run();sql.prepare("INSERT INTO rooms(id,kind,name,owner,created) VALUES('dm','dm','','a',1)").run();sql.prepare("INSERT INTO messages(room,sender,body,created) VALUES('g','a','私密群消息',1)").run();
 const req=(body)=>new Request('https://test/api/circles',{method:'POST',headers:{Origin:'https://test'},body:JSON.stringify(body)});
 assert.equal((await circleRequest(req({action:'reply',room:'g',body:'公开的招募问题'}),db,'b')).status,200);
 const publicDetail=await (await circleRequest(new Request('https://test/api/circles?id=g'),db,'b')).json();assert.equal(publicDetail.replies[0].body,'公开的招募问题');assert.equal(JSON.stringify(publicDetail).includes('私密群消息'),false);
 assert.equal((await circleRequest(new Request('https://test/api/circles?id=dm'),db,'b')).status,404);assert.equal((await circleRequest(req({action:'reply',room:'g',body:'未登录'}),db,null)).status,401);
 }finally{sql.close()}});
