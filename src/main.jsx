import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleCheck, Clock3, FileText, FolderOpen, LayoutDashboard,
  ListTodo, Mail, MoreHorizontal, Paperclip, Plus, Search, Settings, Upload,
  UserPlus, Users, X, AtSign, Send, ShieldCheck, Download, Filter
} from 'lucide-react';
import './styles.css';

const initialTasks = [
  { id: 1, title: '総会資料の最終確認', project: '令和6年度 総会準備', assignee: '髙橋 宗一郎', avatar: '髙', due: '今日', urgent: true, comments: 3, stale: false, done: false },
  { id: 2, title: '会場レイアウト案の提出', project: '地域交流会 企画・運営', assignee: '田中 誠', avatar: '田', due: '6月19日', urgent: false, comments: 1, stale: true, done: false },
  { id: 3, title: '原稿内容の校正・承認', project: '会報誌「真」夏号制作', assignee: '佐藤 美咲', avatar: '佐', due: '6月20日', urgent: false, comments: 5, stale: false, done: false },
  { id: 4, title: '参加者リストの更新', project: '地域交流会 企画・運営', assignee: '山本 健一', avatar: '山', due: '6月22日', urgent: false, comments: 0, stale: false, done: false },
];

const projects = [
  { id: 1, name: '令和6年度 総会準備', owner: '真誓会 事務局', status: '進行中', progress: 68, due: '6月28日', taskCount: '8 / 12', members: ['髙', '佐', '田'] },
  { id: 2, name: '地域交流会 企画・運営', owner: '地域連携評議会', status: '進行中', progress: 42, due: '7月12日', taskCount: '5 / 14', members: ['田', '山', '鈴'] },
  { id: 3, name: '会報誌「真」夏号制作', owner: '広報評議会', status: '確認待ち', progress: 84, due: '6月21日', taskCount: '11 / 13', members: ['佐', '伊'] },
  { id: 4, name: '新規会員オリエンテーション', owner: '組織運営評議会', status: '企画中', progress: 18, due: '7月31日', taskCount: '2 / 10', members: ['髙', '伊'] },
];

const initialMembers = [
  { id: 1, name: '髙橋 宗一郎', email: 'takahashi@shinseikai.jp', company: '株式会社髙橋商事', council: '組織運営評議会', role: '事務局長', status: '参加中', avatar: '髙' },
  { id: 2, name: '佐藤 美咲', email: 'sato@example.jp', company: '佐藤企画株式会社', council: '広報評議会', role: '評議員', status: '参加中', avatar: '佐' },
  { id: 3, name: '田中 誠', email: 'tanaka@example.jp', company: '株式会社地域デザイン', council: '地域連携評議会', role: '委員長', status: '参加中', avatar: '田' },
  { id: 4, name: '山本 健一', email: 'yamamoto@example.jp', company: '山本経営事務所', council: '地域連携評議会', role: '評議員', status: '参加中', avatar: '山' },
  { id: 5, name: '招待中', email: 'ito@example.jp', company: '—', council: '未設定', role: '未設定', status: '招待中', avatar: '伊' },
];

const notifications = [
  { id: 1, type: 'mention', unread: true, title: '佐藤 美咲さんがあなたをメンションしました', detail: '「@髙橋さん 最終版をご確認いただけますか？」', project: '会報誌「真」夏号制作', time: '10分前' },
  { id: 2, type: 'stale', unread: true, title: '72時間コメントがありません', detail: '会場レイアウト案の提出', project: '地域交流会 企画・運営', time: '1時間前' },
  { id: 3, type: 'task', unread: true, title: '新しいタスクが割り当てられました', detail: '総会資料の最終確認', project: '令和6年度 総会準備', time: '3時間前' },
  { id: 4, type: 'file', unread: false, title: '関連資料が追加されました', detail: '総会資料_最終版.pdf', project: '令和6年度 総会準備', time: '昨日' },
];

const files = [
  { name: '総会資料_最終版.pdf', project: '令和6年度 総会準備', size: '3.2 MB', owner: '佐藤 美咲', updated: '今日 10:24' },
  { name: '会場レイアウト案_v2.pptx', project: '地域交流会 企画・運営', size: '8.7 MB', owner: '田中 誠', updated: '昨日 16:40' },
  { name: '会報誌_初校データ.pdf', project: '会報誌「真」夏号制作', size: '12.4 MB', owner: '佐藤 美咲', updated: '6月17日' },
  { name: '参加者リスト.xlsx', project: '地域交流会 企画・運営', size: '124 KB', owner: '山本 健一', updated: '6月16日' },
];

const nav = [
  [LayoutDashboard, 'ダッシュボード'], [BriefcaseBusiness, '案件'], [ListTodo, 'タスク'],
  [Bell, '通知'], [FolderOpen, 'ファイル'], [Users, 'メンバー']
];

function BrandMark({ compact = false }) {
  return <img className={`brand-mark ${compact ? 'compact' : ''}`} src={`${import.meta.env.BASE_URL}shinseikai-mark.svg`} alt="真誓会ロゴ"/>;
}
function Avatar({ label, small = false }) { return <span className={`avatar ${small ? 'small' : ''}`}>{label}</span>; }

function Sidebar({ active, setActive }) {
  return <aside className="sidebar">
    <button className="brand" onClick={() => setActive('ダッシュボード')}><BrandMark compact/><div><strong>真誓会</strong><span>SHINSEIKAI CONNECT</span></div></button>
    <nav><p className="nav-label">MENU</p>{nav.map(([Icon, label]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={19}/><span>{label}</span>{label === '通知' && <em>3</em>}</button>)}<p className="nav-label second">MANAGEMENT</p><button><Settings size={19}/><span>設定</span></button></nav>
    <div className="side-footer"><div className="profile"><Avatar label="髙"/><div><strong>髙橋 宗一郎</strong><span>事務局 管理者</span></div><ChevronDown size={16}/></div></div>
  </aside>;
}

function Header({ active, query, setQuery }) {
  return <header><div className="mobile-title"><span>{active}</span></div><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="案件・タスク・メンバーを検索"/><kbd>⌘ K</kbd></div><div className="header-right"><button className="icon-button"><Bell size={20}/><i/></button><div className="header-divider"/><Avatar label="髙" small/><div className="header-user"><strong>髙橋 宗一郎</strong><span>管理者</span></div><ChevronDown size={15}/></div></header>;
}

function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</div>;
}
function Stat({ icon: Icon, tone, value, label, detail }) { return <div className="stat card"><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function SectionHead({ eyebrow, title, action }) { return <div className="panel-head"><div><p>{eyebrow}</p><h2>{title}</h2></div>{action}</div>; }

function TaskRow({ task, toggle, open }) {
  return <div className={`task-row ${task.done ? 'completed' : ''}`} onClick={() => open(task)}>
    <button className="check" onClick={e => { e.stopPropagation(); toggle(task.id); }}>{task.done && <Check size={14}/>}</button>
    <div className="task-main"><strong>{task.title}</strong><span><BriefcaseBusiness size={13}/>{task.project}</span></div>
    <div className="person"><Avatar label={task.avatar} small/><span>{task.assignee}</span></div>
    <div className={`date ${task.urgent ? 'urgent' : ''}`}><CalendarDays size={15}/>{task.due}</div>
    <div className="comment"><AtSign size={15}/>{task.comments}</div>{task.stale ? <span className="stale"><Clock3 size={13}/>72h</span> : <span/>}<ChevronRight size={16}/>
  </div>;
}

function Dashboard({ tasks, toggle, openTask, setActive }) {
  return <>
    <PageTitle eyebrow="OVERVIEW" title="おはようございます、髙橋さん" description="今日も、つながりを大切に。" action={<button className="primary-button" onClick={() => setActive('タスク')}><Plus size={18}/>タスクを登録</button>}/>
    <section className="stats-grid"><Stat icon={ListTodo} tone="blue" label="自分の未完了タスク" value={tasks.filter(t => !t.done).length} detail="今週の期限 3件"/><Stat icon={Clock3} tone="red" label="72時間未返信" value="2" detail="確認が必要です"/><Stat icon={BriefcaseBusiness} tone="gold" label="進行中の案件" value="6" detail="今月完了予定 2件"/><Stat icon={Bell} tone="navy" label="未読の通知" value="3" detail="メンション 1件"/></section>
    <section className="content-grid"><div className="card panel"><SectionHead eyebrow="TASKS" title="対応が必要なタスク" action={<button className="text-button" onClick={() => setActive('タスク')}>すべて見る <ChevronRight size={16}/></button>}/><div className="task-list">{tasks.slice(0,4).map(t => <TaskRow key={t.id} task={t} toggle={toggle} open={openTask}/>)}</div></div>
      <div className="card panel notification-preview"><SectionHead eyebrow="NOTIFICATIONS" title="最新の通知" action={<button className="text-button" onClick={() => setActive('通知')}>すべて見る</button>}/>{notifications.slice(0,3).map(n => <NotificationItem key={n.id} item={n}/>)}</div></section>
    <div className="card panel"><SectionHead eyebrow="PROJECTS" title="進行中の案件" action={<button className="text-button" onClick={() => setActive('案件')}>案件一覧へ <ChevronRight size={16}/></button>}/><ProjectGrid items={projects.slice(0,3)}/></div>
  </>;
}

function ProjectGrid({ items }) { return <div className="project-grid">{items.map(p => <article key={p.id}><div className="project-top"><span className="project-icon"><FolderOpen size={20}/></span><span className={`status ${p.status === '確認待ち' ? 'waiting' : ''}`}>{p.status}</span><MoreHorizontal size={18}/></div><h3>{p.name}</h3><p>{p.owner}</p><div className="progress-title"><span>進捗</span><strong>{p.progress}%</strong></div><div className="progress"><i style={{width: `${p.progress}%`}}/></div><footer><div className="avatars">{p.members.map((m,i) => <Avatar label={m} small key={i}/>)}</div><span><ListTodo size={14}/>{p.taskCount}</span><span><CalendarDays size={14}/>{p.due}</span></footer></article>)}</div>; }

function ProjectsPage({ query }) { const items = projects.filter(p => `${p.name}${p.owner}`.includes(query)); return <><PageTitle eyebrow="PROJECTS" title="案件" description="案件ごとのタスク・資料・やり取りを一か所で管理します。" action={<button className="primary-button"><Plus size={18}/>新しい案件</button>}/><div className="toolbar"><div className="tabs"><button className="selected">すべて <b>6</b></button><button>進行中 <b>4</b></button><button>確認待ち <b>1</b></button><button>完了 <b>1</b></button></div><button className="outline-button"><Filter size={15}/>絞り込み</button></div><div className="card panel"><ProjectGrid items={items}/></div></>; }

function TasksPage({ tasks, toggle, openTask, openNew, query }) { const filtered = tasks.filter(t => `${t.title}${t.project}${t.assignee}`.includes(query)); return <><PageTitle eyebrow="TASK MANAGEMENT" title="タスク" description="担当者と期限を明確にして、対応状況を確認できます。" action={<button className="primary-button" onClick={openNew}><Plus size={18}/>新しいタスク</button>}/><div className="toolbar"><div className="tabs"><button className="selected">未完了 <b>{tasks.filter(t=>!t.done).length}</b></button><button>自分のタスク <b>4</b></button><button>72時間未返信 <b>2</b></button><button>完了済み</button></div></div><div className="card panel task-page"><div className="table-heading"><span>タスク / 案件</span><span>担当者</span><span>期限</span><span>コメント</span><span>状態</span></div>{filtered.map(t => <TaskRow key={t.id} task={t} toggle={toggle} open={openTask}/>)}</div></>; }

function NotificationItem({ item }) { const Icon = item.type === 'mention' ? AtSign : item.type === 'stale' ? Clock3 : item.type === 'file' ? FileText : ListTodo; return <div className={`notification-item ${item.unread ? 'unread' : ''}`}><span className={`notice-icon ${item.type}`}><Icon size={17}/></span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.project} ・ {item.time}</small></div>{item.unread && <i/>}</div>; }
function NotificationsPage() { return <><PageTitle eyebrow="NOTIFICATIONS" title="通知" description="メンション、タスクの割り当て、未返信アラートを確認できます。" action={<button className="outline-button"><Check size={16}/>すべて既読にする</button>}/><div className="content-narrow card panel"><div className="tabs"><button className="selected">すべて <b>4</b></button><button>メンション <b>1</b></button><button>未返信 <b>1</b></button></div><div className="notice-list">{notifications.map(n => <NotificationItem key={n.id} item={n}/>)}</div></div></>; }

function FilesPage() { return <><PageTitle eyebrow="FILES" title="ファイル" description="すべての案件に関連する資料を横断して確認できます。" action={<button className="primary-button"><Upload size={17}/>アップロード</button>}/><div className="card panel data-card"><div className="table-heading files-head"><span>ファイル名</span><span>案件</span><span>追加者</span><span>更新日時</span><span></span></div>{files.map((f,i) => <div className="file-row" key={i}><span className="file-name"><i><FileText size={20}/></i><span><strong>{f.name}</strong><small>{f.size}</small></span></span><span>{f.project}</span><span>{f.owner}</span><span>{f.updated}</span><button><Download size={17}/></button></div>)}</div></>; }

function MembersPage({ members, openInvite }) { return <><PageTitle eyebrow="MEMBERS" title="メンバー" description="協議会に参加するメンバーと所属情報を管理します。" action={<button className="primary-button" onClick={openInvite}><UserPlus size={18}/>メールで招待</button>}/><section className="member-stats"><div><Users/><span><strong>{members.length}</strong>登録メンバー</span></div><div><CircleCheck/><span><strong>{members.filter(m=>m.status==='参加中').length}</strong>参加中</span></div><div><Mail/><span><strong>{members.filter(m=>m.status==='招待中').length}</strong>招待中</span></div></section><div className="card panel data-card"><div className="table-heading member-head"><span>メンバー</span><span>会社名</span><span>所属評議会</span><span>役職</span><span>状態</span><span></span></div>{members.map(m => <div className="member-row" key={m.id}><span className="member-name"><Avatar label={m.avatar}/><span><strong>{m.name}</strong><small>{m.email}</small></span></span><span>{m.company}</span><span>{m.council}</span><span>{m.role}</span><span className={`member-status ${m.status==='招待中'?'pending':''}`}>{m.status}</span><MoreHorizontal size={18}/></div>)}</div></>; }

function TaskModal({ task, close }) { const [comments, setComments] = useState([{name:'佐藤 美咲', avatar:'佐', text:'資料の修正版をアップロードしました。@髙橋 宗一郎 さん、ご確認をお願いいたします。', time:'10分前'}]); const [text,setText]=useState(''); const send=()=>{if(!text.trim())return;setComments([...comments,{name:'髙橋 宗一郎',avatar:'髙',text,time:'たった今'}]);setText('');}; return <div className="modal-backdrop"><div className="drawer"><div className="drawer-head"><div><span>TASK DETAIL</span><h2>{task.title}</h2></div><button onClick={close}><X/></button></div><div className="task-meta"><div><small>案件</small><strong>{task.project}</strong></div><div><small>担当者</small><strong><Avatar label={task.avatar} small/>{task.assignee}</strong></div><div><small>期限</small><strong>{task.due}</strong></div></div><div className="comment-title"><h3>コメント</h3><span>{comments.length}件</span></div><div className="comments">{comments.map((c,i)=><div className="comment-card" key={i}><Avatar label={c.avatar} small/><div><strong>{c.name}<small>{c.time}</small></strong><p>{highlightMentions(c.text)}</p></div></div>)}</div><div className="comment-box"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="コメントを入力…  @ でメンバーをメンション"/><div><button className="mention-button" onClick={()=>setText(text+'@佐藤 美咲 ')}><AtSign size={16}/>メンション</button><button className="send-button" onClick={send}><Send size={15}/>送信</button></div></div></div></div>; }
function highlightMentions(text) { return text.split(/(@[^、。]+?さん|@\S+\s\S+)/).map((part,i)=>part.startsWith('@')?<mark key={i}>{part}</mark>:part); }

function FormModal({ type, close, onInvite }) { const [form,setForm]=useState({email:'',name:'',company:'',council:'地域連携評議会',role:'評議員',title:''}); const change=e=>setForm({...form,[e.target.name]:e.target.value}); if(type==='task') return <SimpleTaskModal close={close}/>; return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span>INVITE MEMBER</span><h2>メンバーをメールで招待</h2><p>招待メールを送信し、所属情報を登録します。</p></div><button onClick={close}><X/></button></div><div className="form-grid"><label className="full">メールアドレス<input name="email" value={form.email} onChange={change} type="email" placeholder="member@example.jp"/></label><label>氏名<input name="name" value={form.name} onChange={change} placeholder="例：佐藤 太郎"/></label><label>会社名<input name="company" value={form.company} onChange={change} placeholder="例：株式会社〇〇"/></label><label>所属評議会<select name="council" value={form.council} onChange={change}><option>地域連携評議会</option><option>広報評議会</option><option>組織運営評議会</option></select></label><label>役職<input name="role" value={form.role} onChange={change}/></label></div><div className="modal-actions"><button onClick={close}>キャンセル</button><button className="primary-button" disabled={!form.email} onClick={()=>onInvite(form)}><Mail size={16}/>招待メールを送信</button></div></div></div>; }
function SimpleTaskModal({close}) { return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span>NEW TASK</span><h2>新しいタスク</h2></div><button onClick={close}><X/></button></div><label>タスク名<input placeholder="対応内容を入力"/></label><div className="form-grid"><label>案件<select><option>令和6年度 総会準備</option></select></label><label>担当者<select><option>髙橋 宗一郎</option></select></label><label>期日<input type="date"/></label></div><div className="modal-actions"><button onClick={close}>キャンセル</button><button className="primary-button" onClick={close}>作成する</button></div></div></div>; }

function App() {
  const [active,setActive]=useState('ダッシュボード'); const [query,setQuery]=useState(''); const [tasks,setTasks]=useState(initialTasks); const [members,setMembers]=useState(initialMembers); const [modal,setModal]=useState(null); const [selectedTask,setSelectedTask]=useState(null); const [toast,setToast]=useState('');
  const toggle=id=>setTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const invite=form=>{setMembers([...members,{id:Date.now(),name:form.name||'招待中',email:form.email,company:form.company||'—',council:form.council,role:form.role,status:'招待中',avatar:(form.name||form.email)[0]}]);setModal(null);setToast(`${form.email} に招待を送信しました`);setTimeout(()=>setToast(''),3000);};
  const pages={
    'ダッシュボード':<Dashboard tasks={tasks} toggle={toggle} openTask={setSelectedTask} setActive={setActive}/>,
    '案件':<ProjectsPage query={query}/>, 'タスク':<TasksPage tasks={tasks} toggle={toggle} openTask={setSelectedTask} openNew={()=>setModal('task')} query={query}/>,
    '通知':<NotificationsPage/>, 'ファイル':<FilesPage/>, 'メンバー':<MembersPage members={members} openInvite={()=>setModal('invite')}/>
  };
  return <div className="app"><Sidebar active={active} setActive={setActive}/><div className="shell"><Header active={active} query={query} setQuery={setQuery}/><main>{pages[active]}</main><footer className="page-footer"><span>© 真誓会</span><span>人と人、心と心をつなぐ。</span></footer></div>{selectedTask&&<TaskModal task={selectedTask} close={()=>setSelectedTask(null)}/>} {modal&&<FormModal type={modal} close={()=>setModal(null)} onInvite={invite}/>} {toast&&<div className="toast"><CircleCheck size={18}/>{toast}</div>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);
