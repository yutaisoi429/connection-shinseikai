import { createApi, runNotificationSweep } from './app.js';
import { JsonStore } from './store.js';
import { PostgresStore } from './postgres-store.js';
import { FileMailer, SmtpMailer } from './mailer.js';

const port=Number(process.env.PORT||3000);
let store=new JsonStore(process.env.DATA_FILE||'data/database.json');
if(process.env.DATABASE_URL){const {Pool}=await import('pg');store=new PostgresStore(new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='false'?false:{rejectUnauthorized:false}}))}
let mailer=new FileMailer(process.env.MAILBOX_DIR||'data/mailbox');
if(process.env.SMTP_HOST){const {default:nodemailer}=await import('nodemailer');const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined});mailer=new SmtpMailer(transport,process.env.MAIL_FROM||'noreply@example.com')}
createApi({store,mailer}).listen(port,()=>console.log(`Shinseikai API listening on http://localhost:${port}`));
runNotificationSweep(store).catch(console.error);
setInterval(()=>runNotificationSweep(store).catch(console.error),60*60*1000).unref();
