/** Bound active text scale by the viewport and largest unbreakable lyric atom. */
export function fitLyricScale(requested: number, width: number, height: number, atoms: string[]): number {
  const units = (text: string) => Array.from(text).reduce((sum,char)=>sum+(/[^\u0000-\u00ff]/.test(char)?1:.56),0);
  const base = Math.max(36,Math.min(72,width*.06));
  const longest = Math.max(1,...atoms.map(units));
  const total = Math.max(1,atoms.reduce((sum,text)=>sum+units(text),0));
  const horizontal = Math.max(150,width*.72)/(longest*base*1.9);
  const area = Math.sqrt(Math.max(20000,width*height*.16)/(total*base*base));
  const phrase = Math.max(150,width*.65)/(total*base*2); return Math.max(.16,Math.min(requested,horizontal,area,phrase));
}

