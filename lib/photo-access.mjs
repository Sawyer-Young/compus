export async function validatePhotoIds(db,user,input){
 if(input!==undefined&&!Array.isArray(input))throw Error('图片列表格式无效');
 const ids=[...new Set(input||[])];if(ids.length>9||ids.some(id=>typeof id!=='string'||id.length>80))throw Error('最多上传 9 张图片');
 for(const id of ids)if(!await db.prepare('SELECT id FROM photos WHERE id=? AND owner=? AND post IS NULL').bind(id,user).first())throw Error('图片已失效，请重新上传');
 return ids;
}
export function canReadPhoto(photo,user,postExists){return !!photo&&(photo.post?!!postExists:photo.owner===user)}
