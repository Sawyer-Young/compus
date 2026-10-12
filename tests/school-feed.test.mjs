import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {postFeedSelection,postSchool,schoolOrder,saveCampusProfile} from '../lib/school-feed.mjs';
import {circleRequest} from '../lib/circle-service.mjs';
import {discoverySchool,PILOT_SCHOOL} from '../lib/campus-pilot.mjs';
function setup(){const sql=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+file,'utf8'));for(const [id,school] of [['a','大连医科大学'],['b','清华大学']])sql.prepare('INSERT INTO profiles(id,name,school,created) VALUES(?,?,?,?)').run(id,id,school,1);const db={prepare(query){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}}}}},async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}}};return {sql,db}}
function add(sql,id,author,school,category,created){sql.prepare('INSERT INTO posts(id,author,school,title,body,category,created) VALUES(?,?,?,?,?,?,?)').run(id,author,school,id,'内容',category,created)}
function feed(sql,options){const q=postFeedSelection(options);return sql.prepare(`SELECT p.id,p.author,${postSchool} AS school,p.created FROM posts p JOIN profiles u ON u.id=p.author ${q.sql}`).all(...q.params)}
test('school priority applies before limits and every board category is filtered server-side',()=>{const {sql}=setup();try{
 for(let i=0;i<210;i++)add(sql,'foreign'+i,'b','清华大学','校园动态',100+i);
 for(const c of ['校园动态','学习交流','互助问答','失物招领','闲置交易','搭子招募'])add(sql,c,'a','大连医科大学',c,1);
 for(const board of ['校园广场','求助大厅','闲置市场','找搭子']){const rows=feed(sql,{school:'大连医科大学',board});assert.equal(rows[0].school,'大连医科大学');assert.ok(feed(sql,{school:'大连医科大学',mode:'local',board}).every(p=>p.school==='大连医科大学'))}
 assert.equal(feed(sql,{mode:'all',board:'校园广场'})[0].school,'清华大学');
 assert.ok(schoolOrder({school:'大连医科大学'},{school:'清华大学'},'大连医科大学','priority')<0);
 assert.equal(feed(sql,{school:'大连医科大学',mode:'mine',user:'b'}).length,200);
 assert.equal(feed(sql,{mode:'mine'}).length,0);
 }finally{sql.close()}});
test('changing schools freezes legacy posts and preserves existing snapshot posts',async()=>{const {sql,db}=setup();try{
 add(sql,'legacy','a','','校园动态',1);add(sql,'snapshot','a','大连医科大学','学习交流',2);
 await saveCampusProfile(db,{id:'a',name:'a',school:'清华大学',bio:'',created:2});
 assert.equal(sql.prepare('SELECT school FROM profiles WHERE id=?').get('a').school,'清华大学');
 assert.ok(sql.prepare('SELECT school FROM posts').all().every(p=>p.school==='大连医科大学'));
 assert.equal(feed(sql,{school:'清华大学',mode:'local'}).length,0);
 assert.equal(feed(sql,{school:'清华大学',mode:'mine',user:'a'}).length,2);
 }finally{sql.close()}});
test('circle discovery prioritizes local groups; mine retains joined foreign groups and excludes DMs',async()=>{const {sql,db}=setup();try{
 for(const [id,school,created] of [['local','大连医科大学',1],['foreign','清华大学',2]])sql.prepare("INSERT INTO rooms(id,kind,name,school,owner,created) VALUES(?,'group',?,?,?,?)").run(id,id,school,'a',created);
 sql.prepare("INSERT INTO rooms(id,kind,name,owner,created) VALUES('dm','dm','私聊','a',3)").run();
 sql.prepare("INSERT INTO room_members(room,user,joined) VALUES('foreign','a',1)").run();
 const get=async q=>await (await circleRequest(new Request('https://test/api/circles'+q),db,'a')).json();
 assert.deepEqual((await get('')).map(c=>c.id),['local','foreign']);
 assert.deepEqual((await get('?scope=all')).map(c=>c.id),['foreign','local']);
 assert.deepEqual((await get('?scope=local')).map(c=>c.id),['local']);
 assert.deepEqual((await get('?scope=local&mine=1')).map(c=>c.id),['foreign']);
 // Visitors get the pilot campus, but a saved foreign school still takes precedence.
 assert.equal(discoverySchool(undefined),PILOT_SCHOOL);
 add(sql,'pilot-post','a',PILOT_SCHOOL,'校园动态',1);add(sql,'other-post','b','清华大学','校园动态',2);
 assert.equal(feed(sql,{school:discoverySchool(null)})[0].id,'pilot-post');
 assert.equal(feed(sql,{school:discoverySchool('清华大学')})[0].id,'other-post');
 const guest=async q=>await (await circleRequest(new Request('https://test/api/circles'+q),db,null)).json();
 assert.deepEqual((await guest('')).map(c=>c.id),['local','foreign']);
 assert.deepEqual((await guest('?scope=local')).map(c=>c.id),['local']);
 assert.deepEqual((await guest('?scope=all')).map(c=>c.id),['foreign','local']);
 assert.deepEqual((await (await circleRequest(new Request('https://test/api/circles'),db,'b')).json()).map(c=>c.id),['foreign','local']);
 }finally{sql.close()}});
