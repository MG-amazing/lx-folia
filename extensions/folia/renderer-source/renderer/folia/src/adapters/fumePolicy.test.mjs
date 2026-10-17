import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fumeLayoutBudget,fumeFitScale,fumeBlockCenter,fumePixelScale} from './fumePolicy.ts';
test('Fume active block fits landscape, narrow and oversized windows',()=>{
 for(const viewport of [{width:1920,height:1080},{width:650,height:450},{width:1385,height:896}])
 for(const block of [{x:1200,y:700,width:900,height:80,lineHeight:45},{x:30,y:160,width:2500,height:1500,lineHeight:70}]){
  const scale=fumeFitScale(block,viewport),center=fumeBlockCenter(block);
  const left=viewport.width/2+(block.x-center.x)*scale,right=left+block.width*scale;
  const top=viewport.height/2+(block.y-center.y)*scale,bottom=top+block.height*scale;
  assert.ok(left>=viewport.width*.08&&right<=viewport.width*.92+.01);
  assert.ok(top>=0&&bottom<=viewport.height);
 }
});
test('Fume smooth layout reduces searches while high retains complete search',()=>{
 assert.deepEqual(fumeLayoutBudget('high'),{columns:4,density:8,font:8});
 const smooth=fumeLayoutBudget('smooth');assert.equal(smooth.columns*smooth.density,8);
 assert.ok(smooth.font>=5);
});
test('Fume limits backing pixels on 4K and high DPI without changing CSS geometry',()=>{
 for(const [w,h,dpr] of [[1920,1080,1],[1920,1080,2],[3840,2160,1]]){
  const scale=fumePixelScale(w,h,dpr,'smooth');assert.ok(w*h*scale**2<=1920*1080+1);
  assert.ok(scale>0&&scale<=dpr);
 }
});
