'use client';
import {GraduationCap} from 'lucide-react';
export default function SchoolScope({school,mode,onChange}:{school?:string;mode:string;onChange:(mode:string)=>void}){
 return <section className="school-scope" aria-label="校园内容范围"><div><GraduationCap size={20}/><span><strong>{school||'发现各校的校园生活'}</strong><small>{!school?'设置学校后，优先看到本校内容。':mode==='local'?'只显示本校发布的内容。':mode==='all'?'按所选排序浏览全部学校。':'本校排在前面，其他学校的内容随后展示。'}</small></span></div>{school&&<nav aria-label="学校范围">{[['priority','本校优先'],['local','只看本校'],['all','全部学校']].map(([value,label])=><button type="button" key={value} aria-pressed={mode===value} className={mode===value?'selected':''} onClick={()=>onChange(value)}>{label}</button>)}</nav>}</section>;
}
