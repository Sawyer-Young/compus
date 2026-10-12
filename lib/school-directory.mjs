import schools from '../data/schools.json' with {type:'json'};
export {schools};
export const provinces=[...new Set(schools.map(s=>s.province))];
const names=new Map(schools.map(s=>[s.name,s]));
export function findSchool(name){return typeof name==='string'?names.get(name.trim()):undefined}
export function filterSchools({province='',city='',keyword=''}={}){
 const words=keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return schools.filter(s=>(!province||s.province===province)&&(!city||s.city===city)&&words.every(w=>[s.name,s.province,s.city,s.id].join(' ').toLowerCase().includes(w)));
}
export function citiesIn(province){return [...new Set(schools.filter(s=>s.province===province).map(s=>s.city))]}
