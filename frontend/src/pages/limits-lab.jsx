import { useState, useEffect, useRef, useCallback } from "react";

(() => {
  if (typeof document === "undefined" || document.getElementById("gf-lim2")) return;
  const l = document.createElement("link");
  l.id = "gf-lim2"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Nunito:wght@400;600;700;800&display=swap";
  document.head.appendChild(l);
})();

const F = { display: "'Rajdhani',sans-serif", mono: "'JetBrains Mono',monospace", body: "'Nunito',sans-serif" };
const W = 640, H = 370;

const TOPICS = [
  { id:1, label:"Concept of Limit",        icon:"⟶",    accent:"#818cf8" },
  { id:2, label:"LHL & RHL",               icon:"⇔",    accent:"#22d3ee" },
  { id:3, label:"Algebra of Limits",       icon:"∑",    accent:"#34d399" },
  { id:4, label:"Poly, Rational & Trig",   icon:"f(x)", accent:"#f59e0b" },
  { id:5, label:"First Principle",         icon:"d/dx", accent:"#c084fc" },
  { id:6, label:"Standard Derivatives",   icon:"xⁿ",   accent:"#67e8f9" },
  { id:7, label:"Product & Quotient",      icon:"u·v",  accent:"#86efac" },
];

/* ── canvas utils ── */
function makeTc(xMin,xMax,yMin,yMax){
  return (x,y)=>[((x-xMin)/(xMax-xMin))*W, H-((y-yMin)/(yMax-yMin))*H];
}
function grid(ctx,tc,xs,xe,ys,ye,dx=1,dy=1){
  ctx.strokeStyle="rgba(255,255,255,0.045)"; ctx.lineWidth=1;
  for(let x=Math.ceil(xs);x<=xe;x+=dx){const[cx]=tc(x,0);ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.stroke();}
  for(let y=Math.ceil(ys/dy)*dy;y<=ye;y+=dy){const[,cy]=tc(0,y);ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(W,cy);ctx.stroke();}
  ctx.strokeStyle="rgba(255,255,255,0.22)"; ctx.lineWidth=1.5;
  const[ax]=tc(0,ys);const[,ay]=tc(xs,0);
  ctx.beginPath();ctx.moveTo(ax,0);ctx.lineTo(ax,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,ay);ctx.lineTo(W,ay);ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,0.28)"; ctx.font=`10px ${F.mono}`;
  for(let x=Math.ceil(xs);x<=xe;x+=dx){if(x===0)continue;const[cx,cy]=tc(x,0);ctx.fillText(x,cx-4,cy+13);}
  for(let y=Math.ceil(ys/dy)*dy;y<=ye;y+=dy){if(y===0)continue;const[cx,cy]=tc(0,y);ctx.fillText(y,cx+5,cy+4);}
}
function curve(ctx,tc,fn,x0,x1,c1,c2,skip,lw=2.6){
  const g=ctx.createLinearGradient(...tc(x0,0),...tc(x1,0));
  g.addColorStop(0,c1);g.addColorStop(1,c2);
  ctx.strokeStyle=g;ctx.lineWidth=lw;ctx.shadowColor=c2;ctx.shadowBlur=9;
  ctx.beginPath();let s=false;
  for(let p=0;p<=W;p++){
    const xv=x0+(p/W)*(x1-x0);
    if(skip&&skip(xv)){s=false;continue;}
    const yv=fn(xv);
    if(yv===null||!isFinite(yv)){s=false;continue;}
    const[cx,cy]=tc(xv,yv);
    if(cy<-30||cy>H+30){s=false;continue;}
    if(!s){ctx.moveTo(cx,cy);s=true;}else ctx.lineTo(cx,cy);
  }
  ctx.stroke();ctx.shadowBlur=0;
}
function hole(ctx,tc,x,y,col="#fbbf24",txt=""){
  const[hx,hy]=tc(x,y);
  const g=ctx.createRadialGradient(hx,hy,3,hx,hy,20);
  g.addColorStop(0,col+"44");g.addColorStop(1,col+"00");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(hx,hy,20,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(hx,hy,7,0,Math.PI*2);
  ctx.fillStyle="#07071c";ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();
  if(txt){ctx.fillStyle=col;ctx.font=`600 11px ${F.mono}`;ctx.fillText(txt,hx+11,hy-6);}
}
function dot(ctx,tc,x,y,col,r=7){
  const[px,py]=tc(x,y);
  const g=ctx.createRadialGradient(px,py,0,px,py,r*3);
  g.addColorStop(0,col+"55");g.addColorStop(1,col+"00");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,r*3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0;
  return[px,py];
}
function dvline(ctx,tc,x,col="rgba(245,158,11,0.38)"){
  const[vx]=tc(x,0);ctx.strokeStyle=col;ctx.setLineDash([5,5]);ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(vx,0);ctx.lineTo(vx,H);ctx.stroke();ctx.setLineDash([]);
}
function dhline(ctx,tc,y,col="rgba(34,211,238,0.32)"){
  const[,hy]=tc(0,y);ctx.strokeStyle=col;ctx.setLineDash([5,5]);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,hy);ctx.lineTo(W,hy);ctx.stroke();ctx.setLineDash([]);
}
function infoBox(ctx,x,y,lines,bord="rgba(139,92,246,0.4)"){
  const lh=17,pad=10,maxW=lines.reduce((a,[t])=>Math.max(a,t.length*7.2),0)+pad*2;
  ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle=bord;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.roundRect(x,y,maxW,lines.length*lh+pad*2,8);ctx.fill();ctx.stroke();
  lines.forEach(([txt,col,fw],i)=>{
    ctx.fillStyle=col;ctx.font=`${fw||"600"} 12px ${F.mono}`;ctx.fillText(txt,x+pad,y+pad+(i+0.8)*lh);
  });
}

/* ════ DRAW FUNCTIONS ════ */

function drawT1(ctx,{xSlider,step,showNeigh,t}){
  const tc=makeTc(-0.5,4.8,-1,20);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#08081e");bg.addColorStop(1,"#0c0c28");
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-0.5,4.8,-1,20,1,2);
  const fn=x=>Math.abs(x-2)<1e-5?null:(x**3-8)/(x-2);
  curve(ctx,tc,fn,-0.2,4.5,"#4f46e5","#a78bfa",x=>Math.abs(x-2)<0.018);
  if(showNeigh||step===3){
    const[nx1]=tc(1.55,0),[nx2]=tc(2.45,0);
    const ng=ctx.createLinearGradient(nx1,0,nx2,0);
    ng.addColorStop(0,"rgba(129,140,248,0)");ng.addColorStop(0.5,"rgba(129,140,248,0.14)");ng.addColorStop(1,"rgba(129,140,248,0)");
    ctx.fillStyle=ng;ctx.fillRect(nx1,0,nx2-nx1,H);
    ctx.strokeStyle="rgba(129,140,248,0.4)";ctx.setLineDash([5,5]);ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(nx1,0);ctx.lineTo(nx1,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(nx2,0);ctx.lineTo(nx2,H);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(165,180,252,0.75)";ctx.font=`bold 11px ${F.mono}`;ctx.fillText("neighbourhood of x=2",nx1+6,18);
  }
  dvline(ctx,tc,2);
  if(step>=2)dhline(ctx,tc,12);
  hole(ctx,tc,2,12,"#fbbf24","f(2) undef.");
  const xv=xSlider<=0?0.5+(xSlider+1)*1.499:2.001+(1-xSlider)*1.499;
  const yv=fn(xv);
  if(yv!==null){
    const[px,py]=tc(xv,yv);
    const[ax,ab]=tc(xv,-1);
    ctx.strokeStyle="rgba(251,191,36,0.18)";ctx.setLineDash([3,4]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ax,ab);ctx.stroke();ctx.setLineDash([]);
    dot(ctx,tc,xv,yv,"#fbbf24");
    infoBox(ctx,px+(xv<2?-168:12),py-30,[
      [`x = ${xv.toFixed(5)}`,"#fbbf24","700"],
      [`f(x) = ${yv.toFixed(4)}`,"#22d3ee","600"],
    ],"rgba(251,191,36,0.35)");
  }
  if(step>=2){ctx.fillStyle="#22d3ee";ctx.font=`700 12px ${F.mono}`;ctx.fillText("L = 12",tc(3.6,12)[0],tc(3.6,12)[1]-8);}
  ctx.fillStyle="#f59e0b";ctx.font=`700 12px ${F.mono}`;ctx.fillText("a = 2",tc(2,-1)[0]+6,H-6);
  if(step===4){
    ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle="rgba(129,140,248,0.5)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(W/2-130,18,260,54,10);ctx.fill();ctx.stroke();
    ctx.fillStyle="#c4b5fd";ctx.font=`700 19px ${F.display}`;ctx.textAlign="center";ctx.fillText("lim  f(x)  =  L",W/2,42);
    ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font=`12px ${F.mono}`;ctx.fillText("x → a",W/2,60);ctx.textAlign="left";
  }
}

function drawT2(ctx,{lhlX,rhlX,step}){
  const tc=makeTc(-1,5,-1,7);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-1,5,-1,7,1,1);
  const jump=step>=3;
  const fL=x=>x<2?x+1:null;
  const fR=x=>x>2?(jump?x-1:x+1):null;
  const lhlV=3,rhlV=jump?1:3;
  curve(ctx,tc,fL,-0.8,1.99,"#818cf8","#a5b4fc",null,2.5);
  curve(ctx,tc,fR,2.01,4.8,"#22d3ee","#67e8f9",null,2.5);
  dvline(ctx,tc,2);
  dhline(ctx,tc,lhlV,"rgba(165,180,252,0.4)");
  if(jump)dhline(ctx,tc,rhlV,"rgba(34,211,238,0.4)");
  hole(ctx,tc,2,lhlV,"#a5b4fc","LHL=3");
  if(jump)hole(ctx,tc,2,rhlV,"#67e8f9","RHL=1");
  else{dot(ctx,tc,2,lhlV,"#34d399",8);ctx.fillStyle="#34d399";ctx.font=`700 11px ${F.mono}`;ctx.fillText("LHL=RHL=3 ✓",tc(2,3)[0]+12,tc(2,3)[1]-7);}
  const lx=Math.min(1.998,0.5+lhlX*1.498);
  const rx=Math.max(2.002,2.002+(1-rhlX)*2.398);
  if(fL(lx)!==null)dot(ctx,tc,lx,fL(lx),"#818cf8",6);
  if(fR(rx)!==null)dot(ctx,tc,rx,fR(rx),"#22d3ee",6);
  const ok=!jump;
  const stCol=ok?"#34d399":"#f87171";
  const stTxt=ok?"LHL = RHL  →  Limit Exists ✓":"LHL ≠ RHL  →  Limit DNE ✗";
  ctx.fillStyle="rgba(6,6,22,0.9)";ctx.strokeStyle=stCol+"44";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(W/2-145,H-52,290,38,9);ctx.fill();ctx.stroke();
  ctx.fillStyle=stCol;ctx.font=`700 15px ${F.display}`;ctx.textAlign="center";ctx.fillText(stTxt,W/2,H-28);ctx.textAlign="left";
}

function drawT3(ctx,{activeRule}){
  const tc=makeTc(-0.5,5,-3,14);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-0.5,5,-3,14,1,2);
  const f=x=>x+1, g=x=>x*x-2;
  curve(ctx,tc,f,0.1,4.5,"#818cf8","#c4b5fd",null,2);
  curve(ctx,tc,g,0.5,4.5,"#22d3ee","#67e8f9",null,2);
  const rules=[
    {label:"f+g",fn:x=>f(x)+g(x),res:"3+2=5",col:"#34d399"},
    {label:"f×g",fn:x=>f(x)*g(x),res:"3×2=6",col:"#f59e0b"},
    {label:"f÷g",fn:x=>g(x)!==0?f(x)/g(x):null,res:"3÷2=1.5",col:"#f87171"},
    {label:"f−g",fn:x=>f(x)-g(x),res:"3−2=1",col:"#fb923c"},
  ];
  if(activeRule>=0){
    const r=rules[activeRule];
    curve(ctx,tc,r.fn,0.5,4.5,r.col,r.col+"bb",x=>r.fn(x)===null,3);
    dvline(ctx,tc,2);
    const rv=r.fn(2);if(rv!==null){dhline(ctx,tc,rv,r.col+"44");dot(ctx,tc,2,rv,r.col,8);}
    ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle=r.col+"44";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(W-230,16,214,54,9);ctx.fill();ctx.stroke();
    ctx.fillStyle=r.col;ctx.font=`700 15px ${F.display}`;ctx.fillText(`lim (${r.label}) = ${r.res}`,W-222,38);
    ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font=`11px ${F.mono}`;ctx.fillText("x → 2",W-210,54);
  }
  ctx.fillStyle="#c4b5fd";ctx.font=`700 12px ${F.mono}`;ctx.fillText("f(x) = x+1",14,20);
  ctx.fillStyle="#67e8f9";ctx.font=`700 12px ${F.mono}`;ctx.fillText("g(x) = x²−2",14,36);
}

function drawT4(ctx,{mode}){
  const tc=makeTc(-4,4,-1.5,8);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-4,4,-1.5,8,1,1);
  if(mode===0){
    const fn=x=>x*x+1;
    curve(ctx,tc,fn,-3.5,3.5,"#818cf8","#f59e0b",null,2.5);
    dvline(ctx,tc,2);dhline(ctx,tc,5,"rgba(52,211,153,0.4)");
    dot(ctx,tc,2,5,"#34d399",8);
    ctx.fillStyle="#34d399";ctx.font=`700 12px ${F.mono}`;ctx.fillText("f(2) = 5  ← direct substitution!",tc(2,5)[0]+12,tc(2,5)[1]-8);
    ctx.fillStyle="rgba(6,6,22,0.88)";ctx.strokeStyle="rgba(52,211,153,0.35)";ctx.lineWidth=1.3;
    ctx.beginPath();ctx.roundRect(14,14,210,40,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#f59e0b";ctx.font=`700 13px ${F.display}`;ctx.fillText("f(x) = x² + 1",24,30);
    ctx.fillStyle="#34d399";ctx.font=`600 11px ${F.mono}`;ctx.fillText("lim(x→2) = f(2) = 5",24,46);
  } else if(mode===1){
    const fn=x=>Math.abs(x-2)<1e-5?null:(x*x-4)/(x-2);
    curve(ctx,tc,fn,-3.5,3.8,"#f59e0b","#fde68a",x=>Math.abs(x-2)<0.018,2.5);
    dvline(ctx,tc,2);dhline(ctx,tc,4,"rgba(34,211,238,0.35)");
    hole(ctx,tc,2,4,"#f59e0b","0/0 → factorise!");
    ctx.fillStyle="rgba(6,6,22,0.9)";ctx.strokeStyle="rgba(245,158,11,0.4)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(12,12,240,76,9);ctx.fill();ctx.stroke();
    ctx.fillStyle="#f59e0b";ctx.font=`700 13px ${F.display}`;ctx.fillText("(x²−4)/(x−2)",22,30);
    ctx.fillStyle="rgba(255,255,255,0.45)";ctx.font=`11px ${F.mono}`;ctx.fillText("= (x+2)(x−2)/(x−2)",22,46);
    ctx.fillStyle="#34d399";ctx.font=`600 11px ${F.mono}`;ctx.fillText("= x+2  →  limit = 4 ✓",22,62);
    ctx.fillStyle="#22d3ee";ctx.fillText("Cancel the (x−2) factor!",22,78);
  } else {
    const fn=x=>Math.abs(x)<1e-5?null:Math.sin(x)/x;
    curve(ctx,tc,fn,-3.8,3.8,"#c084fc","#f0abfc",x=>Math.abs(x)<0.02,2.5);
    dvline(ctx,tc,0,"rgba(245,158,11,0.45)");dhline(ctx,tc,1,"rgba(167,139,250,0.4)");
    hole(ctx,tc,0,1,"#c084fc");
    dot(ctx,tc,0.6,Math.sin(0.6)/0.6,"#c084fc",5);
    dot(ctx,tc,-0.6,Math.sin(-0.6)/-0.6,"#c084fc",5);
    ctx.fillStyle="rgba(6,6,22,0.9)";ctx.strokeStyle="rgba(192,132,252,0.4)";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(W/2-140,14,280,50,9);ctx.fill();ctx.stroke();
    ctx.fillStyle="#c084fc";ctx.font=`700 17px ${F.display}`;ctx.textAlign="center";ctx.fillText("lim  sin(x)/x  =  1",W/2,36);
    ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font=`11px ${F.mono}`;ctx.fillText("x → 0   (\"Same Zero\" rule)",W/2,54);ctx.textAlign="left";
    ctx.fillStyle="#f0abfc";ctx.font=`700 12px ${F.mono}`;ctx.fillText("L = 1",tc(3.2,1)[0],tc(3.2,1)[1]-8);
  }
}

function drawT5(ctx,{hVal,step}){
  const tc=makeTc(-0.5,4,-1,14);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-0.5,4,-1,14,1,1);
  const fn=x=>x*x;
  const x0=2,y0=fn(x0);
  const hv=Math.max(0.001,hVal);
  const slope=(fn(x0+hv)-y0)/hv;
  const tan4=x=>y0+4*(x-x0);
  const sec=x=>y0+slope*(x-x0);
  curve(ctx,tc,fn,0,3.8,"#818cf8","#c4b5fd",null,2.8);
  // tangent (fades in as h→0)
  const tAlpha=Math.min(1,1.5/(hv+0.01));
  ctx.strokeStyle=`rgba(34,211,238,${Math.min(0.95,tAlpha)})`;ctx.lineWidth=hv<0.15?2.5:1.5;
  ctx.beginPath();ctx.moveTo(...tc(0.3,tan4(0.3)));ctx.lineTo(...tc(3.8,tan4(3.8)));ctx.stroke();
  // secant (fades out as h→0)
  const sAlpha=Math.min(0.95,hv/0.5);
  ctx.strokeStyle=`rgba(251,191,36,${Math.max(0.08,sAlpha)})`;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(...tc(0.3,sec(0.3)));ctx.lineTo(...tc(3.8,sec(3.8)));ctx.stroke();
  dot(ctx,tc,x0,y0,"#c084fc",7);
  if(hv>0.06){
    dot(ctx,tc,x0+hv,fn(x0+hv),"#fbbf24",6);
    const[p1x,p1y]=tc(x0,y0),[p2x,p2y]=tc(x0+hv,fn(x0+hv));
    ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.setLineDash([3,3]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(p1x,p1y);ctx.lineTo(p2x,p1y);ctx.lineTo(p2x,p2y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle="#fbbf24";ctx.font=`700 11px ${F.mono}`;
    ctx.fillText(`h=${hv.toFixed(3)}`,(p1x+p2x)/2-18,p1y+14);
  }
  ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle="rgba(192,132,252,0.4)";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(W-238,14,222,84,9);ctx.fill();ctx.stroke();
  ctx.fillStyle="#c4b5fd";ctx.font=`700 14px ${F.display}`;ctx.fillText("f(x) = x²   at x = 2",W-228,32);
  ctx.fillStyle="#fbbf24";ctx.font=`600 11px ${F.mono}`;ctx.fillText(`Secant slope: ${slope.toFixed(4)}`,W-228,50);
  ctx.fillStyle="#22d3ee";ctx.font=`600 11px ${F.mono}`;ctx.fillText(`Tangent f'(2): 4.0000`,W-228,66);
  ctx.fillStyle="rgba(255,255,255,0.32)";ctx.font=`11px ${F.mono}`;ctx.fillText(`Error: ${Math.abs(slope-4).toFixed(4)}  (h→0)`,W-228,82);
}

function drawT6(ctx,{fnIdx,xSlider}){
  const tc=makeTc(-4.5,4.5,-2.5,6);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-4.5,4.5,-2.5,6,1,1);
  const fns=[
    {lbl:"f(x) = x³",f:x=>x**3,df:x=>3*x*x,dfLbl:"f'(x) = 3x²",col:"#818cf8"},
    {lbl:"f(x) = sin x",f:x=>Math.sin(x),df:x=>Math.cos(x),dfLbl:"f'(x) = cos x",col:"#22d3ee"},
    {lbl:"f(x) = cos x",f:x=>Math.cos(x),df:x=>-Math.sin(x),dfLbl:"f'(x) = −sin x",col:"#f59e0b"},
    {lbl:"f(x) = 2 (const)",f:x=>2,df:x=>0,dfLbl:"f'(x) = 0",col:"#34d399"},
  ];
  const c=fns[fnIdx];
  curve(ctx,tc,c.f,-4,4,c.col+"88",c.col,null,2.5);
  curve(ctx,tc,c.df,-4,4,"#f8717188","#f87171",null,2);
  const xv=-3.5+(xSlider+1)/2*7;
  const yv=c.f(xv),sl=c.df(xv);
  dot(ctx,tc,xv,yv,c.col,7);
  dot(ctx,tc,xv,sl,"#f87171",5);
  const tanFn=x=>yv+sl*(x-xv);
  ctx.strokeStyle="#fbbf24cc";ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(...tc(Math.max(-4,xv-1.8),tanFn(Math.max(-4,xv-1.8))));ctx.lineTo(...tc(Math.min(4,xv+1.8),tanFn(Math.min(4,xv+1.8))));ctx.stroke();
  ctx.fillStyle="rgba(6,6,22,0.9)";ctx.strokeStyle=c.col+"44";ctx.lineWidth=1.3;
  ctx.beginPath();ctx.roundRect(12,12,226,62,9);ctx.fill();ctx.stroke();
  ctx.fillStyle=c.col;ctx.font=`700 14px ${F.display}`;ctx.fillText(c.lbl,22,30);
  ctx.fillStyle="#f87171";ctx.font=`700 12px ${F.mono}`;ctx.fillText(c.dfLbl,22,46);
  ctx.fillStyle="#fbbf24";ctx.font=`600 11px ${F.mono}`;ctx.fillText(`slope at x=${xv.toFixed(2)}: ${sl.toFixed(3)}`,22,62);
}

function drawT7(ctx,{mode,xSlider}){
  const tc=makeTc(-0.5,5,-6,18);
  ctx.fillStyle="#08081e";ctx.fillRect(0,0,W,H);
  grid(ctx,tc,-0.5,5,-6,18,1,3);
  const u=x=>x*x,du=x=>2*x,v=x=>Math.sin(x),dv=x=>Math.cos(x);
  if(mode===0){
    const uv=x=>u(x)*v(x),duv=x=>du(x)*v(x)+u(x)*dv(x);
    curve(ctx,tc,uv,0.1,4.8,"#86efac88","#86efac",null,2.5);
    curve(ctx,tc,duv,0.1,4.8,"#f8717188","#f87171",null,2);
    const xv=0.3+(xSlider+1)/2*4.2;
    dot(ctx,tc,xv,uv(xv),"#86efac",7);dot(ctx,tc,xv,duv(xv),"#f87171",5);
    ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle="rgba(134,239,172,0.35)";ctx.lineWidth=1.3;
    ctx.beginPath();ctx.roundRect(10,10,264,80,9);ctx.fill();ctx.stroke();
    ctx.fillStyle="#86efac";ctx.font=`700 13px ${F.display}`;ctx.fillText("f(x) = x²·sin(x)",20,28);
    ctx.fillStyle="#f87171";ctx.font=`700 12px ${F.mono}`;ctx.fillText("f' = u'v + uv'",20,44);
    ctx.fillStyle="rgba(255,255,255,0.4)";ctx.font=`11px ${F.mono}`;ctx.fillText("= 2x·sin(x) + x²·cos(x)",20,58);
    ctx.fillStyle="#fbbf24";ctx.font=`600 11px ${F.mono}`;ctx.fillText(`f'(${xv.toFixed(2)}) = ${duv(xv).toFixed(3)}`,20,74);
  } else {
    const uv=x=>Math.abs(Math.sin(x))<0.06?null:u(x)/v(x);
    const duv=x=>{const s=Math.sin(x);return Math.abs(s)<0.06?null:(du(x)*v(x)-u(x)*dv(x))/(s*s);};
    curve(ctx,tc,uv,0.2,4.8,"#67e8f988","#67e8f9",x=>Math.abs(Math.sin(x))<0.08,2.5);
    curve(ctx,tc,duv,0.2,4.8,"#f8717188","#f87171",x=>Math.abs(Math.sin(x))<0.08,2);
    const xv=0.3+(xSlider+1)/2*2.5;
    const yv=uv(xv),dyv=duv(xv);
    if(yv!==null)dot(ctx,tc,xv,yv,"#67e8f9",7);
    if(dyv!==null)dot(ctx,tc,xv,dyv,"#f87171",5);
    ctx.fillStyle="rgba(6,6,22,0.92)";ctx.strokeStyle="rgba(103,232,249,0.35)";ctx.lineWidth=1.3;
    ctx.beginPath();ctx.roundRect(10,10,272,80,9);ctx.fill();ctx.stroke();
    ctx.fillStyle="#67e8f9";ctx.font=`700 13px ${F.display}`;ctx.fillText("f(x) = x²/sin(x)",20,28);
    ctx.fillStyle="#f87171";ctx.font=`700 12px ${F.mono}`;ctx.fillText("f' = (v·u' − u·v') / v²",20,44);
    ctx.fillStyle="rgba(255,255,255,0.4)";ctx.font=`11px ${F.mono}`;ctx.fillText("v goes FIRST in numerator!",20,58);
    if(dyv!==null){ctx.fillStyle="#fbbf24";ctx.font=`600 11px ${F.mono}`;ctx.fillText(`f'(${xv.toFixed(2)}) = ${dyv.toFixed(3)}`,20,74);}
  }
}

/* ════ STEPS ════ */
const STEPS=[
  [
    {title:"What is a Limit?",tag:"The Big Idea",body:"A limit describes the behaviour of f(x) as x approaches a value 'a'. We write lim(x→a) f(x).",tip:"Move the slider — watch f(x) close in on x=2 without touching it!",formula:null},
    {title:"x → a means…",tag:"Close, Not There",body:"x → a means x is very close to 'a' but NOT exactly equal. The function may not even be defined at x = a!",tip:"The open circle at x=2 means f(2) is undefined — yet the limit still exists!",formula:"x → 2,  but  x ≠ 2"},
    {title:"The Hole in the Graph",tag:"Undefined at a Point",body:"Even if f(a) is undefined, the limit can still exist! It is the height the curve is heading toward from both sides.",tip:"The curve heads toward y=12 from both sides — that's the limit!",formula:"f(2) = undefined\nlim = 12"},
    {title:"The Neighbourhood",tag:"Pados of x=a",body:"A limit only cares about what happens in the immediate vicinity of x=a — the neighbourhood or 'pados'.",tip:"Toggle Neighbourhood to see the region around x=2 highlighted!",formula:"0 < |x − 2| < δ"},
    {title:"Formal Notation",tag:"Writing it Down",body:"As x gets arbitrarily close to 'a', f(x) gets close to L. We write: lim(x→a) f(x) = L.",tip:"For our graph: lim(x→2) f(x) = 12, even though f(2) is undefined!",formula:"lim f(x) = L\n x→a"},
  ],
  [
    {title:"Two Sides of Approach",tag:"Left & Right",body:"A limit can be approached from the left (LHL) or the right (RHL). Use the two sliders to control each approach.",tip:"Drag both sliders and watch the coloured dots approach x=2 from each side!",formula:"LHL: x→a⁻\nRHL: x→a⁺"},
    {title:"Left-Hand Limit (LHL)",tag:"From the Left",body:"LHL = lim(x→a⁻) f(x). x approaches 'a' from values smaller than 'a', e.g. x=1.999 for a=2.",tip:"Move the left slider — the purple dot approaches x=2 from the left side.",formula:"x → 2⁻  (x < 2)"},
    {title:"Right-Hand Limit (RHL)",tag:"From the Right",body:"RHL = lim(x→a⁺) f(x). x approaches 'a' from values larger than 'a', e.g. x=2.001 for a=2.",tip:"Move the right slider — the cyan dot approaches x=2 from the right side.",formula:"x → 2⁺  (x > 2)"},
    {title:"Jump Discontinuity!",tag:"Limit DNE",body:"If LHL ≠ RHL, the limit does NOT EXIST (DNE). The graph jumps at x=a — the two sides head to different y-values.",tip:"See the graph jump! LHL=3 but RHL=1. The limit does not exist here.",formula:"LHL ≠ RHL  →  DNE"},
    {title:"Existence Condition",tag:"The Golden Rule",body:"A limit exists at x=a if and only if LHL = RHL = a finite number. Both sides must agree!",tip:"This is the single most important rule for limit existence — never forget it!",formula:"lim exists ⟺\nLHL = RHL = L"},
  ],
  [
    {title:"Limits Distribute",tag:"The Core Idea",body:"Provided individual limits are finite, the limit of an operation equals the operation applied to individual limits.",tip:"Click a rule button above the graph to see it applied live!",formula:"lim[f ★ g] = lim f ★ lim g"},
    {title:"Sum Rule",tag:"Addition",body:"lim(f+g) = lim f + lim g. The limit of a sum equals the sum of the limits.",tip:"Click f+g to see the combined curve plotted and its limit value!",formula:"lim(f+g) = L_f + L_g"},
    {title:"Product Rule",tag:"Multiplication",body:"lim(f·g) = (lim f)·(lim g). Multiply the individual limit values.",tip:"Click f×g — watch the product curve appear with its limit!",formula:"lim(f·g) = L_f × L_g"},
    {title:"Quotient Rule",tag:"Division",body:"lim(f/g) = lim f / lim g, provided lim g ≠ 0. Division by zero is NOT allowed!",tip:"Click f÷g. Works here because lim g = 2 ≠ 0 at x→2.",formula:"lim(f/g) = L_f / L_g\n(L_g ≠ 0 required)"},
    {title:"Power Rule",tag:"Exponents",body:"lim(f)ⁿ = (lim f)ⁿ. Raise the limit value to the required power.",tip:"Together, these rules make computing complex limits straightforward!",formula:"lim(f)ⁿ = (L_f)ⁿ"},
  ],
  [
    {title:"Polynomial Limits",tag:"Well-Behaved",body:"For polynomials, simply substitute x=a directly. No tricks needed — they are always continuous!",tip:"See f(2)=5 directly for f(x)=x²+1. Direct substitution just works!",formula:"lim f(x) = f(a)\n  x→a"},
    {title:"Rational — 0/0 Form",tag:"Indeterminate",body:"When direct substitution gives 0/0, we have an indeterminate form. Factorise to cancel the common factor!",tip:"Switch to Rational mode — watch (x²−4)/(x−2) factorise to (x+2)!",formula:"0/0 form\n→ factorise & cancel"},
    {title:"lim sin(x)/x = 1",tag:"Standard Trig Result",body:"As x→0, sin(x)/x → 1. This is fundamental. The angle in sin MUST equal the denominator — both must → 0.",tip:"Switch to Trig mode — see both sides of the curve approach L=1!",formula:"lim sin(x)/x = 1\n    x→0"},
    {title:"lim tan(x)/x = 1",tag:"Same Zero Rule",body:"lim(x→0) tan(x)/x = 1. The 'Same Zero' rule: the expression inside tan and the denominator must both → 0.",tip:"Remember: angle and denominator must be the same and both approach 0!",formula:"lim tan(x)/x = 1\n    x→0"},
    {title:"lim (1−cos x)/x² = ½",tag:"Half Angle Result",body:"lim(x→0) (1−cos x)/x² = ½. Derived from the double-angle identity. All three trig limits are standard — memorise them!",tip:"These three trig limits are essential for JEE. Keep them on your formula sheet!",formula:"lim (1−cosx)/x² = ½\n      x→0"},
  ],
  [
    {title:"What is a Derivative?",tag:"Instantaneous Rate",body:"The derivative f'(x) is the instantaneous rate of change — the slope of the curve at a single specific point.",tip:"Look at f(x)=x². The slope is different at every point — that's what f' captures!",formula:"f'(x) = instantaneous slope"},
    {title:"The Secant Line",tag:"Two Points",body:"Connect two points on the curve: (x, f(x)) and (x+h, f(x+h)). The slope of this line approximates the derivative.",tip:"Drag h to a large value and see the yellow secant line between two points!",formula:"slope = [f(x+h)−f(x)] / h"},
    {title:"Shrinking h → 0",tag:"The Key Animation!",body:"As h gets smaller and smaller, the second point moves closer to the first. The secant line rotates toward the tangent.",tip:"Slowly drag h toward 0 — watch the yellow secant rotate into the cyan tangent!",formula:"h → 0  →  secant = tangent"},
    {title:"The Tangent Line",tag:"Slope = Derivative",body:"When h→0, the secant slope converges to the exact slope of the tangent line at x. This is the derivative f'(x).",tip:"When h≈0, both lines overlap. The slope at x=2 for f(x)=x² is exactly 4!",formula:"f'(2) = 4  for f(x)=x²"},
    {title:"First Principle",tag:"The Official Definition",body:"f'(x) = lim(h→0) [f(x+h) − f(x)] / h. This is the definition from first principles that gives us all derivative formulas.",tip:"For x²: [(x+h)²−x²]/h = [2xh+h²]/h = 2x+h → 2x as h→0. At x=2, f'=4!",formula:"f'(x) = lim [f(x+h)−f(x)]/h\n           h→0"},
  ],
  [
    {title:"Standard Results",tag:"Memorise These",body:"These derivative formulas are derived from first principles. For JEE, you must know all of them instantly.",tip:"Use the function buttons above to explore each function and its derivative curve!",formula:null},
    {title:"Power Rule",tag:"d/dx(xⁿ) = nxⁿ⁻¹",body:"The exponent 'n' comes down as a multiplier, and the power reduces by 1. The most frequently used rule in calculus!",tip:"Select xⁿ — the red derivative curve is always one degree lower than the original!",formula:"d/dx(xⁿ) = n·xⁿ⁻¹"},
    {title:"d/dx(sin x) = cos x",tag:"Sine Derivative",body:"Differentiating sin x gives cos x. The sine wave shifts by 90° — it becomes the cosine wave!",tip:"Select sin x — the red derivative curve IS the cosine wave plotted alongside!",formula:"d/dx(sin x) = cos x"},
    {title:"d/dx(cos x) = −sin x",tag:"Cosine Derivative",body:"Differentiating cos x gives −sin x. The negative sign is critical — cos decreases where sin is positive.",tip:"Select cos x — the derivative is a flipped (negated) sine wave. Note the sign!",formula:"d/dx(cos x) = −sin x"},
    {title:"d/dx(k) = 0",tag:"Constant Rule",body:"The derivative of any constant k is 0. A horizontal line has zero slope at every point — nothing is changing!",tip:"Select constant — the red derivative line is flat at y=0. Zero slope throughout!",formula:"d/dx(k) = 0"},
  ],
  [
    {title:"Why a Special Rule?",tag:"Can't Just Multiply",body:"When f(x) = u(x)·v(x), we CANNOT simply write f'= u'·v'. We need the Product Rule — it accounts for both functions changing.",tip:"Select Product Rule and explore how the combined derivative behaves!",formula:"(uv)' ≠ u'·v'"},
    {title:"Product Rule — Idea",tag:"One at a Time",body:"Imagine u and v taking turns: first keep u still and differentiate v (gives u·v'), then keep v still and differentiate u (gives u'·v). Add them!",tip:"'One function at a time' — each takes a turn while the other watches!",formula:"(uv)' = u'v + uv'"},
    {title:"Product Rule Example",tag:"f = x²·sin x",body:"u=x², u'=2x. v=sin x, v'=cos x. So f'= 2x·sin(x) + x²·cos(x). Both contributions add up!",tip:"Move the slider and watch the yellow derivative curve combine both parts!",formula:"f' = 2x·sinx + x²·cosx"},
    {title:"Quotient Rule",tag:"The u/v Formula",body:"For f = u/v: f' = (v·u' − u·v') / v². The denominator is always squared, and v goes first in the numerator!",tip:"Switch to Quotient Rule mode! Notice the denominator v² and the order matters.",formula:"(u/v)' = (v·u'−u·v') / v²"},
    {title:"Order Matters!",tag:"Key Caution",body:"In the quotient rule: it's v·u' MINUS u·v'. You cannot swap the order — subtraction is NOT commutative.",tip:"Memory trick: 'Low d-High minus High d-Low, square the bottom and away we go!'",formula:"v·u' − u·v'\n(v always first!)"},
  ],
];

/* ════ MAIN APP ════ */
export default function LimitsLab() {
  const [topic, setTopic]           = useState(0);
  const [step, setStep]             = useState(0);
  const canvasRef                   = useRef(null);
  const rafRef                      = useRef(null);
  const [xSlider, setXSlider]       = useState(0);
  const [lhlX, setLhlX]             = useState(0.8);
  const [rhlX, setRhlX]             = useState(0.8);
  const [activeRule, setActiveRule] = useState(-1);
  const [polyMode, setPolyMode]     = useState(0);
  const [hVal, setHVal]             = useState(1.5);
  const [fnIdx, setFnIdx]           = useState(0);
  const [prMode, setPrMode]         = useState(0);
  const [showNeigh, setShowNeigh]   = useState(false);
  const [autoAnim, setAutoAnim]     = useState(false);
  const autoRef = useRef(null);
  const phaseRef = useRef(0);
  const dirRef   = useRef(1);

  useEffect(() => { setStep(0); setAutoAnim(false); }, [topic]);

  /* smooth auto-animate loop */
  useEffect(() => {
    if (!autoAnim) { cancelAnimationFrame(autoRef.current); return; }
    const tick = () => {
      phaseRef.current += 0.008 * dirRef.current;
      if (phaseRef.current >= 1)  dirRef.current = -1;
      if (phaseRef.current <= -1) dirRef.current =  1;
      const p = phaseRef.current;
      if (topic === 0) setXSlider(p);
      else if (topic === 1) { setLhlX(Math.abs(p)); setRhlX(Math.abs(p)); }
      else if (topic === 4) setHVal(Math.max(0.001, (1 - Math.abs(p)) * 1.8));
      else if (topic === 5 || topic === 6) setXSlider(p);
      autoRef.current = requestAnimationFrame(tick);
    };
    autoRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(autoRef.current);
  }, [autoAnim, topic]);

  /* draw loop */
  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    if      (topic === 0) drawT1(ctx, { xSlider, step, showNeigh });
    else if (topic === 1) drawT2(ctx, { lhlX, rhlX, step });
    else if (topic === 2) drawT3(ctx, { activeRule });
    else if (topic === 3) drawT4(ctx, { mode: polyMode });
    else if (topic === 4) drawT5(ctx, { hVal, step });
    else if (topic === 5) drawT6(ctx, { fnIdx, xSlider });
    else if (topic === 6) drawT7(ctx, { mode: prMode, xSlider });
  }, [topic, step, xSlider, lhlX, rhlX, activeRule, polyMode, hVal, fnIdx, prMode, showNeigh]);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const steps   = STEPS[topic];
  const cur     = TOPICS[topic];
  const accent  = cur.accent;

  /* stats */
  const stats = (() => {
    if (topic === 0) {
      const xv = xSlider<=0 ? 0.5+(xSlider+1)*1.499 : 2.001+(1-xSlider)*1.499;
      const yv = Math.abs(xv-2)<1e-5 ? null : (xv**3-8)/(xv-2);
      return [{l:"x value",v:xv.toFixed(5),c:"#fbbf24"},{l:"f(x)",v:yv!=null?yv.toFixed(4):"undef",c:"#22d3ee"},{l:"|x−2|",v:Math.abs(xv-2).toFixed(5),c:"#818cf8"},{l:"Limit L",v:"12.00000",c:"#34d399"}];
    }
    if (topic === 1) {
      const lx=2-lhlX*0.5,rx=2+rhlX*0.5;
      return [{l:"LHL x",v:lx.toFixed(4),c:"#a5b4fc"},{l:"LHL f(x)",v:(lx+1).toFixed(4),c:"#a5b4fc"},{l:"RHL x",v:rx.toFixed(4),c:"#67e8f9"},{l:"RHL f(x)",v:(step>=3?rx-1:rx+1).toFixed(4),c:"#67e8f9"}];
    }
    if (topic === 4) {
      const sl=((2+hVal)**2-4)/hVal;
      return [{l:"h value",v:hVal.toFixed(4),c:"#fbbf24"},{l:"Secant slope",v:sl.toFixed(4),c:"#fbbf24"},{l:"True f'(2)",v:"4.0000",c:"#22d3ee"},{l:"Error",v:Math.abs(sl-4).toFixed(4),c:"#f87171"}];
    }
    return [];
  })();

  /* inline styles shorthand */
  const S = (obj) => obj;

  return (
    <div style={S({minHeight:"100vh",background:"radial-gradient(ellipse at 18% 12%,#1a0533 0%,#080818 55%,#000010 100%)",fontFamily:F.body,color:"#fff",display:"flex",flexDirection:"column",overflow:"hidden"})}>

      {/* ── HEADER ── */}
      <header style={S({display:"flex",alignItems:"center",gap:14,padding:"11px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(6,6,20,0.85)",backdropFilter:"blur(14px)",flexShrink:0,zIndex:10})}>
        <div style={S({fontFamily:F.display,fontSize:22,fontWeight:700,background:"linear-gradient(90deg,#e0c3fc,#c084fc,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:0.5,whiteSpace:"nowrap"})}>
          Limits &amp; Derivatives
        </div>
        <div style={S({width:1,height:22,background:"rgba(255,255,255,0.1)"})}/> 
        <div style={S({fontSize:13,color:"rgba(255,255,255,0.38)",fontFamily:F.mono})}>Class 11 · Interactive Lab</div>
        <div style={S({marginLeft:"auto",display:"flex",gap:8,alignItems:"center"})}>
          <button onClick={()=>setAutoAnim(a=>!a)} style={S({background:autoAnim?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${autoAnim?"rgba(34,211,238,0.45)":"rgba(255,255,255,0.12)"}`,color:autoAnim?"#22d3ee":"#666",borderRadius:8,padding:"5px 16px",cursor:"pointer",fontFamily:F.body,fontSize:13,fontWeight:700,transition:"all 0.2s"})}>
            {autoAnim ? "⏸ Pause" : "▶ Auto"}
          </button>
          {topic===0&&<button onClick={()=>setShowNeigh(n=>!n)} style={S({background:showNeigh?"rgba(129,140,248,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${showNeigh?"rgba(129,140,248,0.45)":"rgba(255,255,255,0.1)"}`,color:showNeigh?"#a5b4fc":"#555",borderRadius:8,padding:"5px 14px",cursor:"pointer",fontFamily:F.body,fontSize:13,fontWeight:600,transition:"all 0.2s"})}>Neighbourhood</button>}
          <div style={S({background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:8,padding:"5px 14px",fontSize:13,fontFamily:F.mono,color:"#a78bfa"})}>{topic+1} / 7</div>
        </div>
      </header>

      {/* ── TOPIC NAV ── */}
      <nav style={S({display:"flex",gap:6,padding:"9px 24px",background:"rgba(6,6,20,0.6)",borderBottom:"1px solid rgba(255,255,255,0.05)",overflowX:"auto",flexShrink:0})}>
        {TOPICS.map((t,i)=>{
          const active=topic===i;
          return(
            <button key={t.id} onClick={()=>setTopic(i)} style={S({
              display:"flex",alignItems:"center",gap:7,padding:"7px 15px",borderRadius:9,
              border:`1px solid ${active?t.accent+"55":"rgba(255,255,255,0.07)"}`,
              background:active?t.accent+"18":"rgba(255,255,255,0.03)",
              color:active?t.accent:"rgba(255,255,255,0.38)",
              cursor:"pointer",fontFamily:F.body,fontSize:12.5,fontWeight:700,
              whiteSpace:"nowrap",transition:"all 0.2s",
              boxShadow:active?`0 0 16px ${t.accent}20`:"none",
            })}>
              <span style={S({fontSize:13,opacity:0.85})}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* ── BODY ── */}
      <div style={S({display:"flex",flex:1,minHeight:0})}>

        {/* LEFT */}
        <div style={S({flex:1,display:"flex",flexDirection:"column",padding:"15px 10px 14px 20px",gap:11,minWidth:0})}>

          {/* Canvas card */}
          <div style={S({border:`1px solid ${accent}2a`,borderRadius:14,overflow:"hidden",background:"rgba(7,7,22,0.75)",boxShadow:`0 0 40px ${accent}09`,flex:1,display:"flex",flexDirection:"column"})}>
            <div style={S({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",flexShrink:0,flexWrap:"wrap",gap:8})}>
              <span style={S({fontFamily:F.display,fontSize:12.5,fontWeight:700,color:accent,letterSpacing:2})}>
                {["📉 LIMIT VISUALIZER","⇔ LHL & RHL","∑ ALGEBRA OF LIMITS","f(x) POLY · RATIONAL · TRIG","d/dx FIRST PRINCIPLE","xⁿ STANDARD DERIVATIVES","u·v PRODUCT & QUOTIENT RULE"][topic]}
              </span>
              <div style={S({display:"flex",gap:6,flexWrap:"wrap"})}>
                {topic===2&&["f+g","f×g","f÷g","f−g"].map((r,i)=>(
                  <button key={r} onClick={()=>setActiveRule(activeRule===i?-1:i)} style={S({background:activeRule===i?"rgba(52,211,153,0.18)":"transparent",border:`1px solid ${activeRule===i?"rgba(52,211,153,0.5)":"rgba(255,255,255,0.1)"}`,color:activeRule===i?"#34d399":"#555",borderRadius:6,padding:"3px 11px",cursor:"pointer",fontFamily:F.mono,fontSize:12,transition:"all 0.15s"})}>{r}</button>
                ))}
                {topic===3&&["Polynomial","Rational (0/0)","sin(x)/x"].map((m,i)=>(
                  <button key={m} onClick={()=>setPolyMode(i)} style={S({background:polyMode===i?accent+"22":"transparent",border:`1px solid ${polyMode===i?accent+"55":"rgba(255,255,255,0.1)"}`,color:polyMode===i?accent:"#555",borderRadius:6,padding:"3px 11px",cursor:"pointer",fontFamily:F.body,fontSize:12,fontWeight:600,transition:"all 0.15s"})}>{m}</button>
                ))}
                {topic===5&&["xⁿ","sin x","cos x","const"].map((m,i)=>(
                  <button key={m} onClick={()=>setFnIdx(i)} style={S({background:fnIdx===i?accent+"22":"transparent",border:`1px solid ${fnIdx===i?accent+"55":"rgba(255,255,255,0.1)"}`,color:fnIdx===i?accent:"#555",borderRadius:6,padding:"3px 11px",cursor:"pointer",fontFamily:F.mono,fontSize:12,transition:"all 0.15s"})}>{m}</button>
                ))}
                {topic===6&&["Product Rule","Quotient Rule"].map((m,i)=>(
                  <button key={m} onClick={()=>setPrMode(i)} style={S({background:prMode===i?accent+"22":"transparent",border:`1px solid ${prMode===i?accent+"55":"rgba(255,255,255,0.1)"}`,color:prMode===i?accent:"#555",borderRadius:6,padding:"3px 11px",cursor:"pointer",fontFamily:F.body,fontSize:12,fontWeight:600,transition:"all 0.15s"})}>{m}</button>
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} width={W} height={H} style={S({display:"block",width:"100%",height:"auto",flex:1})}/>
          </div>

          {/* Sliders */}
          {(topic===0||topic===5||topic===6)&&(
            <div style={S({background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 18px"})}>
              <div style={S({display:"flex",justifyContent:"space-between",marginBottom:7})}>
                <span style={S({color:"rgba(255,255,255,0.45)",fontSize:13,fontWeight:600})}>
                  {topic===0?"Drag x toward a = 2":"Move x along the curve"}
                </span>
                <span style={S({fontFamily:F.mono,fontSize:13,color:"#fbbf24",fontWeight:700})}>
                  {topic===0?`x = ${(xSlider<=0?0.5+(xSlider+1)*1.499:2.001+(1-xSlider)*1.499).toFixed(4)}`:
                   `x = ${(-3.5+(xSlider+1)/2*7).toFixed(3)}`}
                </span>
              </div>
              <input type="range" min={-1} max={1} step={0.002} value={xSlider}
                onChange={e=>{setAutoAnim(false);setXSlider(Number(e.target.value));}}
                style={S({width:"100%",accentColor:accent,cursor:"pointer",height:5})}/>
            </div>
          )}
          {topic===1&&(
            <div style={S({background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14})}>
              {[["LHL — from left","#a5b4fc",lhlX,setLhlX,`x = ${(2-lhlX*0.5).toFixed(3)}`],["RHL — from right","#67e8f9",rhlX,setRhlX,`x = ${(2+rhlX*0.5).toFixed(3)}`]].map(([lbl,col,val,set,xTxt])=>(
                <div key={lbl}>
                  <div style={S({display:"flex",justifyContent:"space-between",marginBottom:6})}>
                    <span style={S({color:col,fontSize:12,fontWeight:700,fontFamily:F.mono})}>{lbl}</span>
                    <span style={S({color:col,fontSize:12,fontFamily:F.mono})}>{xTxt}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.004} value={val}
                    onChange={e=>{setAutoAnim(false);set(Number(e.target.value));}}
                    style={S({width:"100%",accentColor:col,height:5,cursor:"pointer"})}/>
                </div>
              ))}
            </div>
          )}
          {topic===4&&(
            <div style={S({background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 18px"})}>
              <div style={S({display:"flex",justifyContent:"space-between",marginBottom:7})}>
                <span style={S({color:"rgba(255,255,255,0.45)",fontSize:13,fontWeight:600})}>Shrink h → 0 (watch secant become tangent!)</span>
                <span style={S({fontFamily:F.mono,fontSize:13,color:"#fbbf24",fontWeight:700})}>h = {hVal.toFixed(4)}</span>
              </div>
              <input type="range" min={0.001} max={2} step={0.001} value={hVal}
                onChange={e=>{setAutoAnim(false);setHVal(Number(e.target.value));}}
                style={S({width:"100%",accentColor:accent,height:5,cursor:"pointer"})}/>
              <div style={S({display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,0.22)",marginTop:5,fontFamily:F.mono})}>
                <span>h≈0 (tangent)</span><span style={S({color:"#f59e0b"})}>← drag left to shrink →</span><span>h=2 (secant)</span>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats.length>0&&(
            <div style={S({display:"grid",gridTemplateColumns:`repeat(${stats.length},1fr)`,gap:8})}>
              {stats.map(s=>(
                <div key={s.l} style={S({background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,padding:"9px 12px",textAlign:"center"})}>
                  <div style={S({fontSize:10,color:"rgba(255,255,255,0.32)",marginBottom:4,fontFamily:F.mono})}>{s.l}</div>
                  <div style={S({fontSize:14,fontWeight:700,color:s.c,fontFamily:F.mono})}>{s.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: concept panel */}
        <div style={S({width:308,padding:"15px 20px 14px 8px",display:"flex",flexDirection:"column"})}>
          <div style={S({background:"rgba(7,7,22,0.85)",border:`1px solid ${accent}22`,borderRadius:14,padding:15,flex:1,display:"flex",flexDirection:"column",boxShadow:`inset 0 0 28px ${accent}06`})}>
            <div style={S({fontFamily:F.display,fontSize:11,fontWeight:700,color:accent,letterSpacing:2.5,marginBottom:13})}>📖 CONCEPT WALKTHROUGH</div>

            {/* Steps */}
            <div style={S({display:"flex",flexDirection:"column",gap:5,marginBottom:14})}>
              {steps.map((s,i)=>(
                <div key={i} onClick={()=>setStep(i)} style={S({display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:9,cursor:"pointer",
                  background:step===i?`${accent}1e`:"rgba(255,255,255,0.02)",
                  border:`1px solid ${step===i?accent+"44":"rgba(255,255,255,0.05)"}`,
                  transition:"all 0.18s",boxShadow:step===i?`0 0 12px ${accent}18`:"none"})}>
                  <div style={S({width:21,height:21,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:800,flexShrink:0,
                    background:step===i?accent:"rgba(255,255,255,0.07)",
                    color:step===i?"#fff":"rgba(255,255,255,0.25)",
                    fontFamily:F.mono,boxShadow:step===i?`0 0 8px ${accent}55`:"none",transition:"all 0.18s"})}>{i+1}</div>
                  <span style={S({fontSize:12.5,fontWeight:step===i?700:500,color:step===i?"#f0e6ff":"rgba(255,255,255,0.32)",fontFamily:F.body,transition:"all 0.18s"})}>{s.title}</span>
                </div>
              ))}
            </div>

            {/* Active step */}
            <div style={S({background:`linear-gradient(135deg,${accent}16,${accent}07)`,border:`1px solid ${accent}2e`,borderRadius:11,padding:13,flex:1,display:"flex",flexDirection:"column",gap:10})}>
              <div>
                <div style={S({display:"flex",alignItems:"center",gap:8,marginBottom:5})}>
                  <div style={S({width:7,height:7,borderRadius:"50%",background:accent,boxShadow:`0 0 8px ${accent}`,flexShrink:0})}/>
                  <span style={S({fontSize:14.5,fontWeight:800,color:"#ede9fe",fontFamily:F.display,letterSpacing:0.3})}>{steps[step].title}</span>
                </div>
                <div style={S({display:"inline-block",background:`${accent}18`,border:`1px solid ${accent}30`,borderRadius:4,padding:"2px 8px",fontSize:10.5,color:accent,fontFamily:F.mono,marginBottom:8})}>{steps[step].tag}</div>
                <p style={S({margin:0,fontSize:12.5,color:"rgba(255,255,255,0.75)",lineHeight:1.65,fontFamily:F.body})}>{steps[step].body}</p>
              </div>
              {steps[step].formula&&(
                <div style={S({background:"rgba(5,5,18,0.85)",border:`1px solid ${accent}2a`,borderRadius:8,padding:"9px 13px",textAlign:"center"})}>
                  {steps[step].formula.split("\n").map((line,i)=>(
                    <div key={i} style={S({fontFamily:F.mono,fontSize:i===0?13.5:11,color:i===0?"#c4b5fd":"rgba(255,255,255,0.3)",fontWeight:i===0?700:400,marginBottom:i===0?3:0})}>{line}</div>
                  ))}
                </div>
              )}
              <div style={S({background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:8,padding:"9px 12px"})}>
                <div style={S({fontSize:11,fontWeight:800,color:"#4ade80",marginBottom:4,fontFamily:F.display,letterSpacing:1})}>✏️ TRY IT</div>
                <p style={S({margin:0,fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.55,fontFamily:F.body})}>{steps[step].tip}</p>
              </div>
            </div>

            {/* Nav buttons */}
            <div style={S({display:"flex",gap:8,marginTop:11})}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
                style={S({flex:1,padding:"10px 0",borderRadius:9,border:"1.5px solid rgba(255,255,255,0.12)",background:"transparent",color:step===0?"rgba(255,255,255,0.18)":"#ccc",cursor:step===0?"default":"pointer",fontFamily:F.body,fontSize:13,fontWeight:700,transition:"all 0.15s"})}>← Prev</button>
              <button onClick={()=>setStep(s=>Math.min(steps.length-1,s+1))} disabled={step===steps.length-1}
                style={S({flex:1,padding:"10px 0",borderRadius:9,border:"none",
                  background:step===steps.length-1?`${accent}18`:`linear-gradient(90deg,${accent}cc,${accent})`,
                  color:"#fff",cursor:step===steps.length-1?"default":"pointer",fontFamily:F.body,fontSize:13,fontWeight:800,
                  boxShadow:step===steps.length-1?"none":`0 0 16px ${accent}44`,transition:"all 0.15s"})}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
