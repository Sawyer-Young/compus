import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {chatRequest} from '../../../lib/chat-service.mjs';
export const dynamic='force-dynamic';
async function handle(req:Request){try{const user=await getChatGPTUser();return await chatRequest(req,env.DB,user?.userId)}catch{return Response.json({error:'消息服务暂不可用，请重试'},{status:503,headers:{'Cache-Control':'no-store'}})}}
export const GET=handle;
export const POST=handle;
