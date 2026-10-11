# 同校圈 · 校园互助社区

基于 React / Vinext / Cloudflare D1 的校园社区，支持 ChatGPT 登录、校园资料注册、分区发帖、评论、点赞、搜索、热门排序、个人主页及作者删除和互助状态管理。

## 本地开发

Node.js >=22.13，执行 npm ci，然后 npm run build。按照 drizzle/ 中的顺序应用迁移：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_open_jack_power.sql

执行 npm run dev。开发环境通过 /signin-with-chatgpt?return_to=/ 模拟登录；生产环境由 Sites 提供真实 ChatGPT 身份，不接受客户端自报身份。

## 部署

.openai/hosting.json 保存 Sites 项目身份和 DB 绑定。Sites 部署时应用 Drizzle 迁移。生产内容保存在 D1，GitHub 仅保存代码，不保存用户数据、密钥和本地数据库。

网站初始为私有，向同学开放需要在 Sites 中调整访问权限。校园资料为用户填写，尚未实现学生身份核验。第一版支持文字帖子，暂未加入图片上传、私信及管理员审核。
