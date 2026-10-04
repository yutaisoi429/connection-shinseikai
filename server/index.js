import { createApi, runNotificationSweep } from './app.js';
import { JsonStore } from './store.js';

const port=Number(process.env.PORT||3000);
const store=new JsonStore(process.env.DATA_FILE||'data/database.json');
createApi({store}).listen(port,()=>console.log(`Shinseikai API listening on http://localhost:${port}`));
runNotificationSweep(store).catch(console.error);
setInterval(()=>runNotificationSweep(store).catch(console.error),60*60*1000).unref();
