export const API_BASE=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
const tokenKey='shinseikai_session';
export const hasApi=Boolean(API_BASE);
export const sessionToken=()=>localStorage.getItem(tokenKey);
export const setSessionToken=token=>token?localStorage.setItem(tokenKey,token):localStorage.removeItem(tokenKey);
export async function api(path,options={}){const headers={'content-type':'application/json',...(options.headers||{})};const token=sessionToken();if(token)headers.authorization=`Bearer ${token}`;const response=await fetch(`${API_BASE}${path}`,{...options,headers,body:options.body&&typeof options.body!=='string'?JSON.stringify(options.body):options.body});if(response.status===204)return null;const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'通信に失敗しました');return data;}
