import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {circleRequest} from '../../../lib/circle-service.mjs';
async function handle(req:Request){try{const user=await getChatGPTUser();return await circleRequest(req,env.DB,user?.userId)}catch{return Response.json({error:'圈子暂时无法加载，请重试'},{status:503})}}
export const GET=handle;
export const POST=handle;
