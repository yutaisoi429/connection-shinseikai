import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleCheck, Clock3, FileText, FolderOpen, LayoutDashboard, ListTodo,
  MessageCircle, MoreHorizontal, Paperclip, Plus, Search, Settings,
  Users, X, ArrowUpRight, LogOut
} from 'lucide-react';
import './styles.css';

const projects = [
  { id: 1, name: '令和6年度 総会準備', client: '真誓会 事務局', status: '進行中', progress: 68, due: '6月28日', tasks: '8 / 12', members: ['高', '佐', '田'], color: '#a5853d' },
  { id: 2, name: '地域交流会 企画・運営', client: '地域連携委員会', status: '進行中', progress: 42, due: '7月12日', tasks: '5 / 14', members: ['田', '山', '鈴'], color: '#386554' },
  { id: 3, name: '会報誌「真」夏号制作', client: '広報委員会', status: '確認待ち', progress: 84, due: '6月21日', tasks: '11 / 13', members: ['佐', '伊'], color: '#637e95' },
];

const seedTasks = [
  { id: 1, title: '総会資料の最終確認', project: '令和6年度 総会準備', assignee: '高橋', avatar: '高', due: '今日', urgent: true, comments: 3, stale: false, done: false },
  { id: 2, title: '会場レイアウト案の提出', project: '地域交流会 企画・運営', assignee: '田中', avatar: '田', due: '6月19日', urgent: false, comments: 1, stale: true, done: false },
  { id: 3, title: '原稿内容の校正・承認', project: '会報誌「真」夏号制作', assignee: '佐藤', avatar: '佐', due: '6月20日', urgent: false, comments: 5, stale: false, done: false },
  { id: 4, title: '参加者リストの更新', project: '地域交流会 企画・運営', assignee: '山本', avatar: '山', due: '6月22日', urgent: false, comments: 0, stale: false, done: false },
];

const nav = [
  [LayoutDashboard, 'ダッシュボード'], [BriefcaseBusiness, '案件'], [ListTodo, 'タスク'],
  [MessageCircle, 'メッセージ'], [FolderOpen, 'ファイル'], [Users, 'メンバー']
];

function Avatar({ label, small = false }) {
  return <span className={`avatar ${small ? 'small' : ''}`}>{label}</span>;
}

function Sidebar({ active, setActive }) {
  return <aside className="sidebar">
    <div className="brand"><div className="crest">真</div><div><strong>真誓会</strong><span>SHINSEIKAI CONNECT</span></div></div>
    <nav>
      <p className="nav-label">MENU</p>
      {nav.map(([Icon, label]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={19}/><span>{label}</span>{label === 'メッセージ' && <em>3</em>}</button>)}
      <p className="nav-label second">MANAGEMENT</p>
      <button><Settings size={19}/><span>設定</span></button>
    </nav>
    <div className="side-footer"><div className="profile"><Avatar label="髙"/><div><strong>髙橋 宗一郎</strong><span>事務局 管理者</span></div><ChevronDown size={16}/></div><button className="logout"><LogOut size={16}/> ログアウト</button></div>
  </aside>
}

function Header({ query, setQuery }) {
  return <header><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="案件・タスク・メンバーを検索"/><kbd>⌘ K</kbd></div><div className="header-right"><button className="icon-button"><Bell size={20}/><i/></button><div className="header-divider"/><Avatar label="髙" small/><ChevronDown size={15}/></div></header>
}

function Stat({ icon: Icon, tone, value, label, detail, alert }) {
  return <div className="stat card"><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={alert ? 'red' : ''}>{detail}</small></div></div>
}

function TaskRow({ task, onToggle }) {
  return <div className={`task-row ${task.done ? 'completed' : ''}`}>
    <button className="check" onClick={() => onToggle(task.id)}>{task.done && <Check size={14}/>}</button>
    <div className="task-main"><strong>{task.title}</strong><span><BriefcaseBusiness size={13}/>{task.project}</span></div>
    <div className="person"><Avatar label={task.avatar} small/><span>{task.assignee}</span></div>
    <div className={`date ${task.urgent ? 'urgent' : ''}`}><CalendarDays size={15}/>{task.due}</div>
    <div className="comment"><MessageCircle size={15}/>{task.comments}</div>
    {task.stale ? <span className="stale"><Clock3 size={13}/>72h</span> : <span className="stale-placeholder"/>}
    <button className="more"><MoreHorizontal size={18}/></button>
  </div>
}

function NewTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><span>NEW TASK</span><h2>新しいタスクを作成</h2></div><button onClick={onClose}><X/></button></div><label>タスク名<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="対応内容を入力してください"/></label><div className="form-grid"><label>案件<select><option>令和6年度 総会準備</option><option>地域交流会 企画・運営</option></select></label><label>担当者<select><option>髙橋 宗一郎</option><option>田中 誠</option></select></label></div><label>期日<input type="date"/></label><div className="modal-actions"><button onClick={onClose}>キャンセル</button><button className="primary" disabled={!title} onClick={()=>onAdd(title)}>タスクを作成</button></div></div></div>
}

function Dashboard({ query, onOpenModal }) {
  const [tasks, setTasks] = useState(seedTasks);
  const filtered = useMemo(() => tasks.filter(t => `${t.title}${t.project}${t.assignee}`.includes(query)), [tasks, query]);
  const toggle = id => setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
  return <main>
    <section className="welcome"><div><p>2024年6月18日 火曜日</p><h1>おはようございます、髙橋さん</h1><span>今日も、つながりを大切に。</span></div><button className="new-button" onClick={onOpenModal}><Plus size={18}/>新しいタスク</button></section>
    <section className="stats-grid">
      <Stat icon={ListTodo} tone="green" label="自分の未完了タスク" value={tasks.filter(t=>!t.done).length} detail="今週の期限 3件"/>
      <Stat icon={Clock3} tone="red" label="72時間未返信" value="2" detail="確認が必要です" alert/>
      <Stat icon={BriefcaseBusiness} tone="gold" label="進行中の案件" value="6" detail="今月完了予定 2件"/>
      <Stat icon={CircleCheck} tone="blue" label="今月の完了タスク" value="24" detail="先月比 ＋8件"/>
    </section>
    <section className="content-grid">
      <div className="card panel tasks-panel"><div className="panel-head"><div><p>TASKS</p><h2>対応が必要なタスク</h2></div><button>すべて見る <ChevronRight size={16}/></button></div>
        <div className="task-labels"><span>タスク</span><span>担当者</span><span>期日</span><span></span></div>
        <div>{filtered.length ? filtered.map(t => <TaskRow key={t.id} task={t} onToggle={toggle}/>) : <div className="empty">該当するタスクはありません</div>}</div>
      </div>
      <div className="card panel activity"><div className="panel-head"><div><p>ACTIVITY</p><h2>最近の動き</h2></div><button><MoreHorizontal size={20}/></button></div>
        <div className="timeline">
          <div className="event"><Avatar label="佐" small/><div><strong>佐藤 美咲さん</strong> がコメントしました<p>「修正版をアップロードしました。ご確認をお願いいたします。」</p><span>10分前 ・ 会報誌「真」夏号制作</span></div></div>
          <div className="event"><span className="event-icon file"><FileText size={16}/></span><div><strong>資料が追加されました</strong><p>総会資料_最終版.pdf</p><span>1時間前 ・ 令和6年度 総会準備</span></div></div>
          <div className="event"><span className="event-icon done"><Check size={16}/></span><div><strong>田中 誠さん</strong> がタスクを完了<p>会場候補への空き状況確認</p><span>3時間前 ・ 地域交流会</span></div></div>
        </div><button className="activity-more">すべての履歴を見る <ArrowUpRight size={15}/></button>
      </div>
    </section>
    <section className="card panel projects"><div className="panel-head"><div><p>PROJECTS</p><h2>進行中の案件</h2></div><button>案件一覧へ <ChevronRight size={16}/></button></div><div className="project-grid">{projects.filter(p=>p.name.includes(query)||!query).map(p=><article key={p.id}><div className="project-top"><span className="folder-mark" style={{background:p.color}}><FolderOpen size={19}/></span><span className={`status ${p.status==='確認待ち'?'waiting':''}`}>{p.status}</span><button><MoreHorizontal size={18}/></button></div><h3>{p.name}</h3><p>{p.client}</p><div className="progress-title"><span>進捗</span><strong>{p.progress}%</strong></div><div className="progress"><i style={{width:`${p.progress}%`}}/></div><footer><div className="avatars">{p.members.map((m,i)=><Avatar label={m} small key={i}/>)}</div><span><ListTodo size={14}/>{p.tasks}</span><span><CalendarDays size={14}/>{p.due}</span></footer></article>)}</div></section>
  </main>
}

function App(){
  const [active,setActive]=useState('ダッシュボード'); const [query,setQuery]=useState(''); const [modal,setModal]=useState(false); const [toast,setToast]=useState('');
  const addTask = title => { setModal(false); setToast(`「${title}」を作成しました`); setTimeout(()=>setToast(''),3000); };
  return <div className="app"><Sidebar active={active} setActive={setActive}/><div className="shell"><Header query={query} setQuery={setQuery}/><Dashboard query={query} onOpenModal={()=>setModal(true)}/><footer className="page-footer"><span>© 2024 真誓会</span><span>人と人、心と心をつなぐ。</span></footer></div>{modal&&<NewTaskModal onClose={()=>setModal(false)} onAdd={addTask}/>} {toast&&<div className="toast"><CircleCheck size={18}/>{toast}</div>}</div>
}

createRoot(document.getElementById('root')).render(<App/>);
