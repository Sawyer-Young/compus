'use client';
import {useState} from 'react';
import {X,ChevronLeft,ChevronRight} from 'lucide-react';
export default function PostPhotos({images,compact=false}:{images?:string[];compact?:boolean}){
 const [selected,setSelected]=useState<number|null>(null);if(!images?.length)return null;
 return <><div className={'post-photo-grid '+(compact?'compact':'')}>{(compact?images.slice(0,1):images).map((url,i)=><button type="button" key={url} aria-label={'查看图片 '+(i+1)} onClick={()=>setSelected(i)}><img src={url} alt={'帖子图片 '+(i+1)} loading="lazy"/>{compact&&images.length>1&&<span>{images.length} 张</span>}</button>)}</div>{selected!==null&&<div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" onClick={()=>setSelected(null)}><button className="photo-close" aria-label="关闭图片" onClick={()=>setSelected(null)}><X/></button><button aria-label="上一张" disabled={selected===0} onClick={e=>{e.stopPropagation();setSelected(selected-1)}}><ChevronLeft/></button><img src={images[selected]} alt={'完整图片 '+(selected+1)} onClick={e=>e.stopPropagation()}/><button aria-label="下一张" disabled={selected===images.length-1} onClick={e=>{e.stopPropagation();setSelected(selected+1)}}><ChevronRight/></button><span>{selected+1} / {images.length}</span></div>}</>;
}
