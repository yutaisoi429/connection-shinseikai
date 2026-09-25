import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { JsonStore } from './store.js';

const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
const body = async req => { const chunks=[]; for await (const chunk of req) chunks.push(chunk); if (!chunks.length) return {}; try { return JSON.parse(Buffer.concat(chunks)); } catch { throw Object.assign(new Error('JSONの形式が不正です'), { status: 400 }); } };
const match = (pathname, pattern) => { const keys=[]; const regex=new RegExp(`^${pattern.replace(/:([A-Za-z]+)/g,(_,key)=>(keys.push(key),'([^/]+)'))}$`); const found=pathname.match(regex); return found ? Object.fromEntries(keys.map((key,index)=>[key,decodeURIComponent(found[index+1])])) : null; };
const required = (value, name) => { if (!value || (Array.isArray(value)&&!value.length)) throw Object.assign(new Error(`${name}は必須です`), { status: 422 }); };

export async function runNotificationSweep(store, now = new Date()) {
  const nowMs=now.getTime();
  return store.update(db=>{
    let created=0;
    for(const task of db.tasks) {
      if(task.status==='done'||task.status==='completed') continue;
      const confirmed=new Set(task.confirmedByIds||[]);
      const ageMs=nowMs-new Date(task.createdAt).getTime();
      if(ageMs>=72*60*60*1000) for(const userId of task.assigneeIds||[]) if(!confirmed.has(userId)) {
        const dedupeKey=`task.confirmation.overdue:${task.id}:${userId}`;
        if(!db.notifications.some(n=>n.dedupeKey===dedupeKey)) { db.notifications.push({id:randomUUID(),userId,eventType:'task.confirmation.overdue',resourceType:'task',resourceId:task.id,title:'タスクが72時間確認されていません',dedupeKey,readAt:null,createdAt:now.toISOString()}); created++; }
      }
      if(task.dueAt) {
        const days=Math.ceil((new Date(task.dueAt).getTime()-nowMs)/(24*60*60*1000));
        if(days===3) for(const userId of task.assigneeIds||[]) {
          const dedupeKey=`task.deadline.three_days:${task.id}:${userId}`;
          if(!db.notifications.some(n=>n.dedupeKey===dedupeKey)) { db.notifications.push({id:randomUUID(),userId,eventType:'task.deadline.three_days',resourceType:'task',resourceId:task.id,title:'タスク期限の3日前です',dedupeKey,readAt:null,createdAt:now.toISOString()}); created++; }
        }
      }
    }
    return {created};
  });
}

export function createApi({ store = new JsonStore(process.env.DATA_FILE || 'data/database.json'), allowedOrigin = process.env.CORS_ORIGIN || '*' } = {}) {
  return createServer(async (req,res) => {
    res.setHeader('access-control-allow-origin', allowedOrigin); res.setHeader('access-control-allow-methods','GET,POST,PATCH,PUT,DELETE,OPTIONS'); res.setHeader('access-control-allow-headers','content-type,authorization,idempotency-key');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    const url=new URL(req.url,'http://localhost'); const path=url.pathname;
    try {
      if (req.method==='GET' && path==='/health') return json(res,200,{status:'ok'});
      if (req.method==='GET' && path==='/v1/projects') { const db=await store.read(); const q=(url.searchParams.get('q')||'').toLowerCase(); const status=url.searchParams.get('status'); return json(res,200,{items:db.projects.filter(p=>(!q||`${p.name}${p.ownerName||''}`.toLowerCase().includes(q))&&(!status||p.status===status))}); }
      if (req.method==='POST' && path==='/v1/projects') { const input=await body(req); required(input.name,'name'); const item={id:randomUUID(),name:input.name,description:input.description||'',status:input.status||'企画中',ownerId:input.ownerId||null,ownerName:input.ownerName||'',council:input.council||'',dueAt:input.dueAt||null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; await store.update(db=>db.projects.push(item)); return json(res,201,item); }
      let params=match(path,'/v1/projects/:projectId/tasks');
      if (params && req.method==='GET') { const db=await store.read(); return json(res,200,{items:db.tasks.filter(t=>t.projectId===params.projectId)}); }
      if (params && req.method==='POST') { const input=await body(req); required(input.title,'title'); required(input.assigneeIds,'assigneeIds'); const task={id:randomUUID(),projectId:params.projectId,title:input.title,description:input.description||'',status:'open',dueAt:input.dueAt||null,assigneeIds:[...new Set(input.assigneeIds)],confirmedByIds:[],lastActivityAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; await store.update(db=>{db.tasks.push(task); for(const userId of task.assigneeIds) db.notifications.push({id:randomUUID(),userId,eventType:'task.assigned',resourceType:'task',resourceId:task.id,title:'タスクが割り当てられました',readAt:null,createdAt:new Date().toISOString()});}); return json(res,201,task); }
      params=match(path,'/v1/tasks/:taskId');
      if (params && req.method==='PATCH') { const input=await body(req); const updated=await store.update(db=>{const task=db.tasks.find(t=>t.id===params.taskId); if(!task) throw Object.assign(new Error('タスクが見つかりません'),{status:404}); Object.assign(task,input,{updatedAt:new Date().toISOString(),lastActivityAt:new Date().toISOString()}); return task;}); return json(res,200,updated); }
      params=match(path,'/v1/tasks/:taskId/confirmations');
      if (params && req.method==='POST') { const input=await body(req); required(input.userId,'userId'); const task=await store.update(db=>{const found=db.tasks.find(t=>t.id===params.taskId); if(!found) throw Object.assign(new Error('タスクが見つかりません'),{status:404}); if(!found.assigneeIds.includes(input.userId)) throw Object.assign(new Error('担当者だけが確認できます'),{status:403}); found.confirmedByIds=[...new Set([...(found.confirmedByIds||[]),input.userId])]; found.lastActivityAt=new Date().toISOString(); found.updatedAt=found.lastActivityAt; return found;}); return json(res,200,task); }
      params=match(path,'/v1/tasks/:taskId/comments');
      if (params && req.method==='GET') { const db=await store.read(); return json(res,200,{items:db.comments.filter(c=>c.taskId===params.taskId)}); }
      if (params && req.method==='POST') { const input=await body(req); required(input.body,'body'); const comment={id:randomUUID(),taskId:params.taskId,authorId:input.authorId,body:input.body,mentionedUserIds:[...new Set(input.mentionedUserIds||[])],createdAt:new Date().toISOString()}; await store.update(db=>{if(!db.tasks.some(t=>t.id===params.taskId)) throw Object.assign(new Error('タスクが見つかりません'),{status:404}); db.comments.push(comment); const task=db.tasks.find(t=>t.id===params.taskId); task.lastActivityAt=comment.createdAt; for(const userId of comment.mentionedUserIds) db.notifications.push({id:randomUUID(),userId,eventType:'comment.mentioned',resourceType:'task',resourceId:task.id,title:'コメントでメンションされました',readAt:null,createdAt:comment.createdAt});}); return json(res,201,comment); }
      if (req.method==='GET' && path==='/v1/members') { const db=await store.read(); return json(res,200,{items:db.members}); }
      params=match(path,'/v1/members/:memberId');
      if (params && req.method==='DELETE') { await store.update(db=>{const index=db.members.findIndex(m=>m.id===params.memberId); if(index<0) throw Object.assign(new Error('メンバーが見つかりません'),{status:404}); db.members.splice(index,1); for(const task of db.tasks) task.assigneeIds=(task.assigneeIds||[]).filter(id=>id!==params.memberId);}); res.writeHead(204); return res.end(); }
      if (req.method==='POST' && path==='/v1/invitations') { const input=await body(req); required(input.email,'email'); const invitation={id:randomUUID(),email:input.email,status:'pending',expiresAt:new Date(Date.now()+7*86400000).toISOString(),createdAt:new Date().toISOString()}; await store.update(db=>db.members.push({...invitation,name:input.name||'招待中',company:input.company||'',council:input.council||'',role:input.role||'member'})); return json(res,201,invitation); }
      if (req.method==='GET' && path==='/v1/notifications') { const db=await store.read(); const userId=url.searchParams.get('userId'); return json(res,200,{items:db.notifications.filter(n=>!userId||n.userId===userId)}); }
      params=match(path,'/v1/users/:userId/notification-preferences');
      if (params && req.method==='GET') { const db=await store.read(); return json(res,200,{items:db.notificationPreferences.filter(p=>p.userId===params.userId)}); }
      if (params && req.method==='PUT') { const input=await body(req); required(input.preferences,'preferences'); const items=input.preferences.map(p=>({userId:params.userId,channel:p.channel,eventType:p.eventType,enabled:Boolean(p.enabled)})); await store.update(db=>{db.notificationPreferences=db.notificationPreferences.filter(p=>p.userId!==params.userId).concat(items)}); return json(res,200,{items}); }
      return json(res,404,{error:'NOT_FOUND',message:'エンドポイントが見つかりません'});
    } catch (error) { return json(res,error.status||500,{error:error.status===422?'VALIDATION_ERROR':'REQUEST_ERROR',message:error.message}); }
  });
}
