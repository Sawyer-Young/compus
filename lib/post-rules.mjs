export const categories=['校园动态','学习交流','互助问答','闲置交易','搭子招募','失物招领'];
export function validatePost(d){
 const str=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 const p={title:str(d.title,100),body:str(d.body,5000),category:str(d.category,20),price:null,condition:'',place:str(d.place,80),event_time:'',capacity:null,task_kind:''};
 if(!p.title||!p.body||!categories.includes(p.category))throw Error('请填写标题、正文和发布类型');
 if(p.category==='闲置交易'){
  const value=typeof d.price==='string'&&d.price.trim()?Number(d.price):typeof d.price==='number'?d.price:NaN;
  if(!Number.isFinite(value)||value<0||value>100000)throw Error('请填写 0–100000 元之间的价格');
  p.price=Math.round(value*100);p.condition=str(d.condition,20);
  if(!['全新','几乎全新','正常使用','有使用痕迹'].includes(p.condition)||!p.place)throw Error('请填写物品成色和校内交接地点');
 }
 if(p.category==='搭子招募'){
  p.capacity=Number(d.capacity);p.event_time=str(d.event_time,40);
  if(!Number.isInteger(p.capacity)||p.capacity<2||p.capacity>100)throw Error('总人数需为 2–100 人（含发起人）');
  if(!p.place||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(p.event_time)||!Number.isFinite(Date.parse(p.event_time)))throw Error('请填写集合地点与活动时间');
  p.event_time=p.event_time.slice(0,16);
 }
 if(p.category==='互助问答'){p.task_kind=str(d.task_kind,20);if(!['学习问题','生活求助','跑腿代取','代购拼单','其他求助'].includes(p.task_kind))throw Error('请选择求助类型')}
 if(p.category==='失物招领'){p.task_kind=str(d.task_kind,20);if(!['寻找失物','捡到物品'].includes(p.task_kind)||!p.place)throw Error('请填写寻物类型和丢失／拾取地点')}
 return p;
}

