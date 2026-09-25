import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from '../server/app.js';
import { JsonStore } from '../server/store.js';

async function fixture(t) { const dir=await mkdtemp(join(tmpdir(),'shinseikai-')); const app=createApi({store:new JsonStore(join(dir,'db.json'))}); await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve)); t.after(async()=>{await new Promise(resolve=>app.close(resolve));await rm(dir,{recursive:true,force:true})}); return `http://127.0.0.1:${app.address().port}`; }

test('creates one task with multiple assignees',async t=>{const base=await fixture(t); const project=await fetch(`${base}/v1/projects`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'総会'})}).then(r=>r.json()); const response=await fetch(`${base}/v1/projects/${project.id}/tasks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'資料確認',assigneeIds:['u1','u2','u2']})}); assert.equal(response.status,201); const task=await response.json(); assert.deepEqual(task.assigneeIds,['u1','u2']); const list=await fetch(`${base}/v1/projects/${project.id}/tasks`).then(r=>r.json()); assert.equal(list.items.length,1); });
test('creates mention notifications and persists preferences',async t=>{const base=await fixture(t); const project=await fetch(`${base}/v1/projects`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'交流会'})}).then(r=>r.json()); const task=await fetch(`${base}/v1/projects/${project.id}/tasks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'確認',assigneeIds:['u1']})}).then(r=>r.json()); const comment=await fetch(`${base}/v1/tasks/${task.id}/comments`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({body:'確認お願いします',authorId:'u1',mentionedUserIds:['u2']})}); assert.equal(comment.status,201); const notices=await fetch(`${base}/v1/notifications?userId=u2`).then(r=>r.json()); assert.equal(notices.items[0].eventType,'comment.mentioned'); const prefs=await fetch(`${base}/v1/users/u2/notification-preferences`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({preferences:[{channel:'email',eventType:'comment.mentioned',enabled:true}]})}); assert.equal(prefs.status,200); });
test('records assignee confirmation and creates 72-hour / three-day notifications',async t=>{const dir=await mkdtemp(join(tmpdir(),'shinseikai-sweep-'));const store=new JsonStore(join(dir,'db.json'));const app=createApi({store});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>app.close(resolve));await rm(dir,{recursive:true,force:true})});const base=`http://127.0.0.1:${app.address().port}`;const project=await fetch(`${base}/v1/projects`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'総会'})}).then(r=>r.json());const now=new Date('2026-09-24T00:00:00.000Z');const task=await fetch(`${base}/v1/projects/${project.id}/tasks`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'未確認資料',assigneeIds:['u1','u2'],dueAt:'2026-09-27T00:00:00.000Z'})}).then(r=>r.json());await store.update(db=>{const saved=db.tasks.find(item=>item.id===task.id);saved.createdAt='2026-09-20T00:00:00.000Z'});const confirmation=await fetch(`${base}/v1/tasks/${task.id}/confirmations`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:'u1'})}).then(r=>r.json());assert.deepEqual(confirmation.confirmedByIds,['u1']);const {runNotificationSweep}=await import('../server/app.js');const result=await runNotificationSweep(store,now);assert.equal(result.created,3);const db=await store.read();assert.equal(db.notifications.filter(n=>n.eventType==='task.confirmation.overdue').length,1);assert.equal(db.notifications.filter(n=>n.eventType==='task.deadline.three_days').length,2);});

test('supports admin login, invitation registration, role changes, and logout', async t => {
  let message;
  const dir=await mkdtemp(join(tmpdir(),'shinseikai-auth-'));
  const store=new JsonStore(join(dir,'db.json'));
  const app=createApi({store,mailer:{send:async mail=>{message=mail;return {mode:'test'}}}});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>app.close(resolve));await rm(dir,{recursive:true,force:true})});
  const base=`http://127.0.0.1:${app.address().port}`;
  const request=(path,options={})=>fetch(base+path,{...options,headers:{'content-type':'application/json',...(options.headers||{})}});
  assert.equal((await request('/v1/auth/bootstrap',{method:'POST',body:JSON.stringify({email:'admin@example.jp',password:'secure-pass',name:'管理者'})})).status,201);
  const login=await request('/v1/auth/login',{method:'POST',body:JSON.stringify({email:'admin@example.jp',password:'secure-pass'})}).then(r=>r.json());
  const auth={authorization:`Bearer ${login.token}`};
  const inviteResponse=await request('/v1/invitations',{method:'POST',headers:auth,body:JSON.stringify({email:'member@example.jp',council:'広報評議会',title:'評議員'})});
  assert.equal(inviteResponse.status,201);
  const token=new URL(message.html.match(/href="([^"]+)/)[1]).searchParams.get('invite');
  assert.equal((await request(`/v1/invitations/${token}`)).status,200);
  const accepted=await request(`/v1/invitations/${token}`,{method:'POST',body:JSON.stringify({name:'会員 太郎',password:'member-pass'})}).then(r=>r.json());
  assert.equal(accepted.member.title,'評議員');
  assert.equal(accepted.member.passwordHash,undefined);
  assert.equal((await request(`/v1/members/${accepted.member.id}`,{method:'PATCH',headers:auth,body:JSON.stringify({role:'admin'})})).status,200);
  assert.equal((await request('/v1/auth/logout',{method:'POST',headers:auth})).status,204);
  assert.equal((await request('/v1/auth/session',{headers:auth})).status,401);
});
