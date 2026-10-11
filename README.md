# 同校圈 · 校园互助社区

基于 React / Vinext / Cloudflare D1 的校园社区，支持 ChatGPT 登录、校园资料注册、分区发帖、评论、点赞、搜索、热门排序、个人主页及作者删除和互助状态管理。

## 本地开发

Node.js >=22.13，执行 npm ci，然后 npm run build。按照 drizzle/ 中的顺序应用迁移：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_open_jack_power.sql

执行 npm run dev。开发环境通过 /signin-with-chatgpt?return_to=/ 模拟登录；生产环境由 Sites 提供真实 ChatGPT 身份，不接受客户端自报身份。

## 部署

.openai/hosting.json 保存 Sites 项目身份和 DB 绑定。Sites 部署时应用 Drizzle 迁移。生产内容保存在 D1，GitHub 仅保存代码，不保存用户数据、密钥和本地数据库。

网站初始为私有，向同学开放需要在 Sites 中调整访问权限。校园资料为用户填写，尚未实现学生身份核验。支持文字帖子、一对一私聊及校园圈子群聊；暂未加入图片上传和管理员审核。

## 私聊与校园圈子

从帖子作者、评论作者或「消息中心 → 发起私聊」联系同学。私聊仅双方可读写，重复发起会复用原会话。

「校园圈子」支持创建、发现、加入和退出圈子，包括快递代取、代购拼单、学习交流等类型。圈主可编辑公告、移出成员。圈子可被同学发现和加入，聊天记录仅成员可见；新成员可查看历史消息。圈主不能直接退出自己的圈子。

在线页面每 5 秒检查新消息，会话列表显示未读计数。消息保存在 D1，支持加载更早的记录；暂不支持离线推送、附件及端到端加密。站点仍保持原访问范围，要让其他同学加入需配置 Sites 访问权限。

应用新增本地迁移（只应用尚未执行的文件）：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_left_dreadnoughts.sql

测试权限与消息行为：

    node --test tests/chat.test.mjs

消息索引迁移：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_wandering_firelord.sql

## 按学生任务组织页面

- / 校园广场：合并校园动态与学习交流，用动态流交流。
- /help 求助大厅：合并互助问答与失物招领；求助类型、相关地点、待解决 / 已解决状态。
- /market 闲置市场：价格（0 元为免费送）、成色、交接地点，物品卡片、价格排序、在售 / 已售出。
- /partners 找搭子：活动时间、集合地点、总人数（包含发起人），报名 / 取消、满员限制、招募状态和报名名单。
- /circles 校园圈子、/messages 消息中心、/me 我的主页保持独立。

各页面可直接访问、刷新及使用浏览器前进 / 后退。原帖子保持原分类；旧闲置和招募未填写的结构化信息显示为待沟通。发起人可以为招募 / 求助建立关联圈子，创建时包括当前报名同学。报名列表公开展示昵称，圈子消息仍只有成员可以查看。

新增本地迁移（只应用尚未执行的文件）：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_futuristic_queen_noir.sql

    node --test tests/chat.test.mjs tests/student-tasks.test.mjs

## 图片、公开讨论与个人创作

- 广场和闲置支持最多 9 张图片；客户端缩放与重新编码后上传 R2，图片元数据在 D1。手机系统文件选择器提供相册与拍照入口（实际拍照依赖浏览器/设备支持）。服务器检查图片签名和 5 MB 限制，未发布图片仅上传者可查看，发布时验证图片归属。
- 广场回复在帖子下方展开；学习交流筛选联动发布默认分类。
- 求助支持匿名、悬赏金额（展示用途，无支付/托管）、0–5 星难度，以及悬赏/难度排序和筛选。匿名作者标识在 API 层移除，作者依靠 mine 标志管理自己的内容；作者在匿名帖的回复也匿名展示。匿名帖禁止关联实名圈子。
- 校园圈子负责发现、介绍、加入与公开招募讨论；我的圈子详情可返回全部圈子。成员群聊与私聊统一在消息中心，公开圈子回复与私密消息分表保存。
- 个人主页有动态时间线、想法、回答、专栏、生活记录、帖子；发布专栏归入学习交流，个人回答来源于求助回复，数据来自当前登录者。

声明 R2 绑定 BUCKET。只应用尚未执行的迁移：

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0004_clammy_apocalypse.sql

完整服务端测试：

    node --test tests/chat.test.mjs tests/student-tasks.test.mjs tests/social-features.test.mjs
