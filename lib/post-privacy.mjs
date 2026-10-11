export function publicPost(post,user){
 const result={...post,mine:post.author===user};
 if(post.anonymous){result.name='匿名同学';result.author=null;result.circle=''}
 return result;
}
export function publicReplies(rows,post,user){return rows.map(c=>post?.anonymous&&c.author===post.author?{...c,author:null,name:'匿名同学',mine:c.author===user}:{...c,mine:c.author===user})}
