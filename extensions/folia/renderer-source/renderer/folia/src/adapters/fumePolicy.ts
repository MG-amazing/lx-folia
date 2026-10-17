/** Desktop Fume geometry and workload limits; audio/word clocks are untouched. */
export function fumeLayoutBudget(quality: string) {
 return quality === 'high' ? {columns: 4, density: 8, font: 8} : {columns: 2, density: 4, font: 5};
}
export function fumeFitScale(block: {width:number;height:number;lineHeight:number}, viewport:{width:number;height:number}) {
 const preferred=Math.min(2.2,Math.max(.88,Math.min(124,Math.max(64,Math.min(viewport.width,viewport.height)*.115))/Math.max(block.lineHeight,1)));
 return Math.max(.02, Math.min(preferred,viewport.width*.82/Math.max(block.width,1),viewport.height*.62/Math.max(block.height,1)));
}
export function fumeBlockCenter(block:{x:number;y:number;width:number;height:number}) {
 return {x:block.x+block.width/2,y:block.y+block.height/2};
}
export function fumePixelScale(width:number,height:number,dpr:number,quality:string) {
 return Math.min(dpr,quality==='high'?2:1,Math.sqrt((quality==='high'?3840*2160:1920*1080)/Math.max(width*height,1)));
}
