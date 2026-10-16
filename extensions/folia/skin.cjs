'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Presentation layer only: Vue remains responsible for navigation, lists and audio.
module.exports = function installSkin() {
  if (window.__lxFoliaSkin) return;
  require('./ui-i18n.js');
  const tr=text=>window.FoliaUI.t(text);
  const root = document.documentElement;
  const style = document.createElement('style'); style.id = 'lx-folia-skin-css';
  const vars = {
    '--color-theme': '#d6c8f4', '--color-primary': '#d6c8f4', '--color-primary-font': '#d6c8f4', '--color-primary-font-active': '#ece2ff',
    '--color-font': '#e7e5eb', '--color-font-label': '#93909e', '--color-nav-font': '#a8a5b3', '--color-nav-font-active': '#f5efff',
    '--color-app-background': '#101014', '--color-main-background': '#18171e', '--color-content-background': '#18171e',
    '--color-primary-background': '#ffffff08', '--color-primary-background-hover': '#ffffff10', '--color-primary-background-active': '#c6afea20',
    '--color-button-background': '#ffffff09', '--color-button-background-hover': '#ffffff14', '--color-button-background-active': '#ffffff21',
  };
  for (let n = 0; n <= 1000; n += 50) {
    const k = String(n).padStart(3, '0'), v = Math.round(25 + n * .215);
    vars[`--color-${k}`] = `rgb(${v},${v},${v+Math.round((255-v)*.02)})`;
  }
  for (let n = 100; n <= 1000; n += 100) {
    const light = 52 - Math.round(n * .028), dark = 205 + Math.round(n * .028);
    vars[`--color-primary-light-${n}`] = `rgb(${light},${light},${light+5})`;
    vars[`--color-primary-dark-${n}`] = `rgb(${dark},${dark-3},${Math.min(255,dark+8)})`;
    for (let a=100;a<=900;a+=100) {
      const alpha=(1000-a)/1000;
      vars[`--color-primary-light-${n}-alpha-${a}`]=`rgba(${light},${light},${light+5},${alpha})`;
      vars[`--color-primary-dark-${n}-alpha-${a}`]=`rgba(220,210,240,${alpha})`;
    }
  }
  for(let a=100;a<=900;a+=100) vars[`--color-primary-alpha-${a}`]=`rgba(202,181,235,${(1000-a)/1000})`;
  style.textContent = `html.lx-folia-skin{${Object.entries(vars).map(([k,v])=>`${k}:${v}!important`).join(';')}}\n` + fs.readFileSync(path.join(__dirname, 'skin.css'), 'utf8');
  document.head.appendChild(style);
  const toggle = document.createElement('button'); toggle.id='lx-skin-toggle'; toggle.type='button';
  function setEnabled(enabled) {
    root.classList.toggle('lx-folia-skin', enabled);
    localStorage.setItem('lx-folia-skin', enabled ? 'on' : 'off');
    toggle.textContent = tr(enabled ? '原版外观' : 'Folia 外观');
    toggle.title = tr(enabled ? '切换回 LX 原版外观' : '切换 Folia 风格外观');
    toggle.setAttribute('aria-label', toggle.title);
  }
  toggle.onclick=()=>setEnabled(!root.classList.contains('lx-folia-skin'));
  const brand=document.createElement('div'); brand.id='lx-skin-brand';
  brand.innerHTML='<span class="lx-skin-mark">LX</span><div><strong>LX Music</strong><small>你的音乐空间</small></div>';
  const hero=document.createElement('section');hero.id='lx-skin-hero';
  hero.innerHTML='<div class="lx-skin-heading"><span class="lx-skin-eyebrow">YOUR MUSIC, YOUR MOMENT</span><h1></h1><p></p></div><button class="lx-skin-now" type="button" aria-label="打开当前歌曲动效歌词"><span class="lx-skin-art">♫</span><span class="lx-skin-track"><small>继续聆听</small><strong></strong><span></span></span><span class="lx-skin-arrow">↗</span></button>';
  hero.querySelector('button').onclick=()=>document.getElementById('lx-folia-open')?.click();
  const routes=[['/search','发现音乐','找到让你单曲循环的那一首。'],['/songList','精选歌单','每一份歌单，都是另一种心情。'],['/leaderboard','音乐风向','听见正在发生的流行。'],['/list','我的音乐','把喜欢的旋律，留在这里。'],['/download','下载管理','收藏好声音，随时离线聆听。'],['/setting','偏好设置','让音乐空间更合你的心意。']];
  let lastCover=null;
  function refresh() {
    window.FoliaUI.setLocale(window.i18n?.locale||'ja-jp');
    const left=document.getElementById('left'),toolbar=document.getElementById('toolbar'),right=document.getElementById('right'),view=document.getElementById('view');
    if(!left||!toolbar||!right||!view) return;
    if(!brand.isConnected) { for(const e of left.children) if(e.textContent.trim()==='L X') e.dataset.lxOriginalLogo='';left.prepend(brand); }
    if(!toggle.isConnected) toolbar.appendChild(toggle);
    if(!hero.isConnected) right.insertBefore(hero,view);
    const route=routes.find(([p])=>location.hash.slice(1).startsWith(p))||routes[0];
    const heading=hero.querySelector('h1'),sub=hero.querySelector('p');
    if(heading.textContent!==tr(route[1])) {heading.textContent=tr(route[1]);sub.textContent=tr(route[2]);}
    const info=window.lxData?.musicInfo||{},title=info.name||tr('打开动效歌词'),artist=info.singer||tr('让旋律与光影相遇');
    const name=hero.querySelector('.lx-skin-track strong'),singer=hero.querySelector('.lx-skin-track > span');
    if(name.textContent!==title) name.textContent=title;
    if(singer.textContent!==artist) singer.textContent=artist;
    if(lastCover!==info.pic) {
      lastCover=info.pic;const art=hero.querySelector('.lx-skin-art');art.replaceChildren();
      if(info.pic) {const img=document.createElement('img');img.src=info.pic;img.alt='';img.onerror=()=>{art.textContent='♫';};art.appendChild(img);}
      else art.textContent='♫';
      root.style.setProperty('--lx-cover',info.pic?`url(${JSON.stringify(info.pic)})`:'none');
    }
    const search=document.querySelector('#toolbar input');if(search)search.placeholder=window.i18n?.locale==='ja-jp'?'曲やアーティストを検索…':'Search for something...';
    const player=document.getElementById('player');
    if(player) for(const [i,e] of Array.from(player.children).entries()) if(e.dataset.lxPlayerPart!==String(i)) e.dataset.lxPlayerPart=String(i);
  }
  setEnabled(localStorage.getItem('lx-folia-skin')!=='off');refresh();
  let pending=false;
  const observer=new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;refresh();},120);});
  observer.observe(document.getElementById('container')||document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',refresh);
  const timer=setInterval(refresh,1500);
  window.addEventListener('beforeunload',()=>{observer.disconnect();clearInterval(timer);},{once:true});
  for(const el of [brand,hero,toggle])window.FoliaUI.observe(el);
  window.addEventListener('folia-locale',()=>{setEnabled(root.classList.contains('lx-folia-skin'));refresh();});
  window.__lxFoliaSkin={version:1};
};
