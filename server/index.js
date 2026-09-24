import { createApi } from './app.js';
const port=Number(process.env.PORT||3000);
createApi().listen(port,()=>console.log(`Shinseikai API listening on http://localhost:${port}`));
