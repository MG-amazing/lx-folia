'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),net=require('node:net');
const registry=globalThis[Symbol.for('lx-folia.api-auth')]??=new Map();
function isLanAddress(value='') {
  const ip=value.toLowerCase().replace(/^::ffff:/,'').split('%')[0];
  if(net.isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return a===127||a===10||a===192&&b===168||a===172&&b>=16&&b<=31;}
  return net.isIP(ip)===6&&(ip==='::1'||/^f[cd]/.test(ip)||/^fe[89ab]/.test(ip));
}
const digest=(password,salt)=>crypto.createHash('sha256').update(salt+'\0'+password).digest();
function createAuth(file) {
  let state=registry.get(file);if(!state){state={responses:new Set()};registry.set(file,state);}
  const read=()=>{try{const data=JSON.parse(fs.readFileSync(file,'utf8'));return data.version===1&&/^[a-f0-9]{64}$/.test(data.hash)&&/^[a-f0-9]{32}$/.test(data.salt)?data:null;}catch{return null;}};
  const status=()=>({configured:Boolean(read()),lanOnly:true,expiresAt:null});
  function setPassword(password) {
    if(typeof password!=='string'||! /^[\x20-\x7e]{1,128}$/.test(password))throw Error('请使用 1–128 位英文字母、数字或符号');
    const salt=crypto.randomBytes(16).toString('hex');
    const data={version:1,salt,hash:digest(password,salt).toString('hex')};
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file+'.next',JSON.stringify(data),{mode:0o600});fs.renameSync(file+'.next',file);
    for(const res of state.responses)res.destroy();state.responses.clear();
    return status();
  }
  function guard(req,res) {
    const deny=(code,message)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));return false;};
    // Never trust forwarded headers: this is a direct LAN service, not a proxy.
    if(!isLanAddress(req.socket.remoteAddress))return deny(403,'LAN access only');
    res.setHeader('Access-Control-Allow-Origin','*');
    const data=read();if(!data)return deny(503,'API password not configured in LX settings');
    if(req.method==='OPTIONS'){
      res.writeHead(204,{'Access-Control-Allow-Headers':'X-API-Key, Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Max-Age':'600'});res.end();return false;
    }
    const supplied=req.headers['x-api-key']??req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if(typeof supplied!=='string'||supplied.length>128||!crypto.timingSafeEqual(digest(supplied,data.salt),Buffer.from(data.hash,'hex')))return deny(401,'Invalid API password');
    state.responses.add(res);const remove=()=>state.responses.delete(res);res.once('finish',remove);res.once('close',remove);
    return true;
  }
  return {guard,status,setPassword};
}
let local;
const current=()=>local??=createAuth(path.join(require('electron').app.getPath('userData'),'open-api-auth.json'));
exports.isLanAddress=isLanAddress;exports.createAuth=createAuth;
exports.guard=(req,res)=>current().guard(req,res);
exports.status=()=>current().status();
exports.setPassword=password=>current().setPassword(password);
