export function normalizedScope(mode,school){return school&&['priority','local','all'].includes(mode)?mode:school?'priority':'all'}
export function schoolOrder(a,b,school,mode){return normalizedScope(mode,school)==='priority'?Number(b.school===school)-Number(a.school===school):0}
const boardCategories={'校园广场':['校园动态','学习交流'],'求助大厅':['互助问答','失物招领'],'闲置市场':['闲置交易'],'找搭子':['搭子招募']};
export const postSchool="COALESCE(NULLIF(p.school,''),u.school)";
export async function saveCampusProfile(db,{id,name,school,bio,created}){
 // Freeze legacy posts before changing the profile; new posts already carry a snapshot.
 await db.batch([
  db.prepare("UPDATE posts SET school=COALESCE((SELECT school FROM profiles WHERE id=?),'') WHERE author=? AND school=''").bind(id,id),
  db.prepare('INSERT INTO profiles(id,name,school,bio,created) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,school=excluded.school,bio=excluded.bio').bind(id,name,school,bio,created)
 ]);
}
export function postFeedSelection({school='',mode='priority',user='',board=''}={}){
 const conditions=[],params=[];let order='p.created DESC,p.id DESC';
 if(mode==='mine'){conditions.push('p.author=?');params.push(user||'')}
 else {
  const scope=normalizedScope(mode,school);
  if(scope==='local'){conditions.push(postSchool+'=?');params.push(school)}
  if(scope==='priority'){order='('+postSchool+'=?) DESC,'+order}
 }
 if(mode!=='mine'&&boardCategories[board]){conditions.push('p.category IN ('+boardCategories[board].map(()=>'?').join(',')+')');params.push(...boardCategories[board])}
 if(mode!=='mine'&&normalizedScope(mode,school)==='priority')params.push(school);
 return {sql:(conditions.length?' WHERE '+conditions.join(' AND '):'')+' ORDER BY '+order+' LIMIT 200',params};
}
export function circleFeedSelection({school='',mode='priority',user='',mine=false}={}){
 const conditions=["r.kind='group'"],params=[];let order='r.created DESC,r.id DESC';
 if(mine){conditions.push('EXISTS(SELECT 1 FROM room_members mine WHERE mine.room=r.id AND mine.user=?)');params.push(user||'')}
 else if(normalizedScope(mode,school)==='local'){conditions.push('r.school=?');params.push(school)}
 if(normalizedScope(mode,school)==='priority'){order='(r.school=?) DESC,'+order;params.push(school)}
 return {sql:' WHERE '+conditions.join(' AND ')+' ORDER BY '+order+' LIMIT 100',params};
}
