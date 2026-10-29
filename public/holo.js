var LAND=[
/*Afrique*/[[-5.9,35.8],[-2,35.2],[3,36.8],[10,37.3],[11,33.5],[15,32.3],[20,32],[25,31.6],[32,31.3],[34.5,28],[35.5,24],[37.2,21],[38.5,18],[43,12.7],[44,10.5],[51.2,11.8],[51,8],[48,4.5],[44,0.5],[41,-2],[39.3,-5],[40.5,-11],[40.6,-15],[35,-20],[35.5,-24.5],[32.8,-26],[32.5,-28.5],[30.5,-31.5],[27,-33.5],[22,-34.2],[18.4,-34.2],[17.2,-30],[15,-26.5],[14.5,-22],[11.8,-17.2],[13.5,-12],[12.3,-6],[9.5,-1],[9.5,3.5],[6,4.3],[4,6.3],[-2,4.8],[-7.5,4.4],[-12,7.5],[-15,11],[-17.2,14.7],[-16.5,19.5],[-16,23.5],[-13,27.7],[-9.7,30],[-9.8,32.5],[-6.8,34]],
/*Madagascar*/[[49.3,-12],[50.4,-15.5],[47.5,-24.8],[44,-25],[43.3,-22],[44.5,-16.5],[47,-15]],
/*Eurasie*/[[-5.6,36],[-9,37],[-9.5,39],[-8.8,43],[-1.8,43.5],[-4.5,48],[-1,46],[2,51],[5,53.5],[8.5,55],[8,57],[10.5,57.5],[10.8,54.5],[14,54],[19,54.5],[21,57],[24,59.5],[30,60],[25,60.2],[22,60.5],[21.5,63],[25,65.2],[22,65.8],[17,62],[19,59],[16,56],[12.5,56],[11,59],[5.5,58.5],[5,62],[14,67.5],[20,70],[28,71],[40,67],[44,68.5],[60,69],[68,69],[73,72.5],[80,73],[88,75],[100,77],[113,74],[130,71],[140,72.5],[160,70],[170,70],[180,69],[180,65.5],[170,60],[163,58],[157,51],[156,57],[142,59],[136,54],[141,52],[140,48],[133,43],[129,41],[128,38],[126,35],[126.5,37.5],[125,39.5],[121,39],[122,37],[119,35],[121.5,31.5],[122,29.5],[119,25.5],[116,22.8],[110,21.2],[108,21.5],[106.5,19],[108.8,15.5],[109,11.5],[105,8.7],[104.8,10.5],[100.5,13.2],[99.5,9.5],[100.3,6.5],[103.5,1.4],[101,2.7],[98.5,8],[98.3,13],[94.5,16.5],[94,19],[91.5,22.5],[88,21.7],[86.5,20],[80.2,15.7],[80.2,10.3],[77.5,8.1],[76,10.5],[73,17],[72.8,21],[70,21],[67.5,24.8],[61,25.2],[57,25.7],[56.3,27],[52,27.8],[50,30],[48,29.8],[48.5,28],[50.2,26.3],[51.5,24.2],[54,24.2],[56.2,26],[56.5,24.5],[58.5,23.5],[59.8,22.5],[57.5,19],[55,17],[52,16],[48,14],[45,12.8],[43.3,12.7],[42.8,15.5],[41,19.5],[38.8,23.5],[35.5,28],[34.9,29.5],[34.3,31.3],[35.1,33.1],[36,35.7],[34,36.2],[30,36.3],[27.3,36.8],[26.5,38.5],[26.3,40.3],[24,40.8],[22.8,40.5],[23.9,37.9],[22.5,36.5],[21.2,37.5],[19.5,40],[19.4,41.8],[15.5,44.5],[13.7,45.6],[12.4,44.2],[16.2,41.9],[18.5,40.1],[16.5,38.5],[15.7,38],[15.8,40],[12,42],[10.5,43],[8.7,44.4],[7.5,43.7],[3.2,43.2],[3.2,41.8],[0.8,40.8],[-0.4,39.2],[0,38.5],[-2,36.8],[-4.5,36.7]],
/*GB*/[[-5.5,50],[1.5,51],[1.7,52.8],[-0.5,54],[-2,56],[-2,57.6],[-4,58.6],[-6,57.5],[-5,55],[-3,54],[-4.5,53],[-5,51.7]],
/*Irlande*/[[-10,52],[-6,52.2],[-6,54.5],[-8,55],[-10,54]],
/*Japon*/[[130,31],[131.5,33.5],[135,34.5],[140,35],[141,38],[142,40],[141.5,41.5],[140,40],[139.5,38],[136.5,37],[133,35.5],[130.5,34],[129.8,33]],
/*Hokkaido*/[[140,42],[141.5,45.4],[145.3,43.3],[143,42]],
/*Taiwan*/[[120,22],[121.5,25],[121.5,23]],
/*Hainan*/[[108.7,19],[111,20],[110.5,18.2]],
/*Sumatra*/[[95.3,5.5],[98,4],[104,-1],[106,-3.5],[104,-5.8],[101,-3],[98,0.5]],
/*Java*/[[105.2,-6.8],[114.5,-7.8],[114,-8.7],[106,-7.5]],
/*Borneo*/[[109,1.5],[111,2.5],[115.5,5],[117,7],[119,5],[118,1],[116.5,-3.5],[114,-4],[110.5,-3.2],[109,-1]],
/*Nlle-Guinee*/[[131,-0.8],[141,-2.6],[147,-6],[150,-10.5],[143,-9],[138,-8],[134,-4]],
/*Luzon*/[[120,16.5],[122,18.5],[122,14],[124,13],[121,13.5],[120,14.5]],
/*Mindanao*/[[122,7],[126,9.5],[126.5,6.5],[124,6.5]],
/*SriLanka*/[[80,9.8],[81.8,7.5],[80.5,6],[79.8,7.5]],
/*Australie*/[[114,-22],[122,-18],[126,-14],[131,-12],[136,-12],[136.7,-15],[141,-12.5],[142.5,-10.7],[145,-15],[146.3,-19],[150,-22.5],[153.2,-26],[152.5,-32],[150,-37],[146,-39],[140,-38],[138,-35],[135,-34.8],[131,-31.5],[124,-33],[118,-35],[115,-34],[115,-31],[113.5,-26]],
/*NZ*/[[172.5,-34.5],[178,-37.7],[175,-41.5],[172.7,-40.5]],[[172,-41],[174,-41.5],[170,-46.5],[166.5,-46],[168,-44]],
/*Am.Nord*/[[-168,65.5],[-164,69],[-156,71.3],[-141,69.7],[-128,70],[-115,68],[-108,68.5],[-95,72],[-90,69],[-82,69.5],[-81,65],[-87,64],[-94,60],[-93,58.5],[-86,55.5],[-80,52.5],[-79,55],[-77,60],[-72,61.5],[-65,60.2],[-62,57],[-56,52.5],[-60,50],[-67,49],[-64,46.5],[-66,44.5],[-70,43.5],[-70,41.7],[-74,40.5],[-76,38.5],[-76,35],[-81,31.5],[-80,27],[-80.2,25.2],[-82.5,27.5],[-84,30],[-88,30.4],[-90,29.2],[-94,29.5],[-97.3,27],[-97.8,22],[-97,19],[-94.5,18.2],[-91,18.7],[-90.4,21],[-87,21.5],[-88,18],[-88.8,15.8],[-84,15.8],[-83.3,12.5],[-83.5,10.5],[-81.5,9],[-79,9.5],[-77.5,8.5],[-78,7.5],[-80.5,7.3],[-82.8,8.2],[-85.7,10],[-87.5,13],[-91.5,14],[-94.5,16],[-97,15.8],[-102,17.9],[-105.5,20],[-105.2,22.5],[-109,25.5],[-112.5,29.5],[-114.8,31.7],[-114.2,28.5],[-112,25],[-110,23],[-112.2,24.8],[-114.5,28],[-115,30],[-117.2,32.5],[-120.5,34.5],[-122.5,37.7],[-124.3,40.3],[-124,46.5],[-123,48.5],[-127,50.5],[-130,54.5],[-135,58.5],[-140,59.8],[-148,60.5],[-152,59],[-158,57],[-165,54.5],[-160,58.5],[-162,61],[-166,62],[-165,64.5]],
/*Groenland*/[[-73,78.5],[-60,82],[-30,83.5],[-20,80],[-19,75],[-22,70.5],[-32,68],[-40,65],[-43,60],[-50,62],[-53,67],[-55,70.5],[-60,76]],
/*Cuba*/[[-85,22],[-80,23.1],[-74,20],[-78,20.5]],
/*Am.Sud*/[[-77.3,8.7],[-75.5,10.7],[-72,12],[-71.5,10.5],[-68,10.6],[-64,10.7],[-61,10.5],[-60,8.5],[-57,6],[-52,5],[-50,1.5],[-50,0],[-48,-1],[-44.5,-2.5],[-40,-2.8],[-35.2,-5.5],[-35,-9],[-37,-12.5],[-39,-17.5],[-40.8,-22],[-44,-23],[-48,-26],[-48.7,-28.5],[-51,-31],[-53.5,-34],[-57,-34.8],[-58.5,-34.5],[-57.5,-37],[-62,-39],[-65,-41],[-64,-42.5],[-67.5,-46],[-65.8,-48],[-69,-51.5],[-68.5,-54],[-72,-53.5],[-75,-50],[-74,-45],[-73.5,-40],[-72,-33],[-71.5,-28],[-70.3,-18.5],[-76,-14],[-79,-8],[-81.2,-5],[-80,-2.5],[-80.5,0.5],[-78.8,1.8],[-77.5,4],[-77.4,7]]
];

(function(){
var RAD=Math.PI/180,O='255,122,26',C='80,205,255';
function cl(x,a,b){return Math.max(a,Math.min(b,x))}function sg(t,a,b){return cl((t-a)/(b-a),0,1)}function eo(x){return 1-Math.pow(1-x,3)}function lerp(a,b,u){return a+(b-a)*u}
function rnd(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function inPoly(x,y,p){var c=false;for(var i=0,j=p.length-1;i<p.length;j=i++){var xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c}
var DOTS=null;
function dots(){if(DOTS)return DOTS;DOTS=[];var n=0;for(var lat=-58;lat<=84;lat+=1.9){var st=1.9/Math.max(.2,Math.cos(lat*RAD));for(var lon=-180;lon<180;lon+=st){for(var k=0;k<LAND.length;k++){if(inPoly(lon,lat,LAND[k])){DOTS.push({lat:lat,lon:lon,d:.1+rnd(n)*1.4,ox:(rnd(n+7)-.5)*700,oy:(rnd(n+13)-.5)*700,b:.55+rnd(n+3)*.45});break}}n++}}return DOTS}
var KIN=[15.3,-4.32],ORIG={Chine:[113.3,23.1],'Dubaï':[55.3,25.3],Istanbul:[28.98,41.0]};
function vec(lon,lat){var a=lat*RAD,b=lon*RAD;return[Math.cos(a)*Math.cos(b),Math.cos(a)*Math.sin(b),Math.sin(a)]}
function tll(v){return[Math.atan2(v[1],v[0])/RAD,Math.asin(cl(v[2],-1,1))/RAD]}
function gcpt(A,B,u){var a=vec(A[0],A[1]),b=vec(B[0],B[1]),d=Math.acos(cl(a[0]*b[0]+a[1]*b[1]+a[2]*b[2],-1,1)),s=Math.sin(d);if(s<1e-6)return A;var f=Math.sin((1-u)*d)/s,g=Math.sin(u*d)/s;return tll([f*a[0]+g*b[0],f*a[1]+g*b[1],f*a[2]+g*b[2]])}
function gcd(A,B){var a=vec(A[0],A[1]),b=vec(B[0],B[1]);return Math.acos(cl(a[0]*b[0]+a[1]*b[1]+a[2]*b[2],-1,1))*6371}
var SEAV=[[113.3,23.1],[114.5,21.6],[110,17],[104,1.3],[95,5.8],[80,4.5],[62,-12],[40,-30],[28,-36.5],[19,-36.8],[12,-30],[9,-15],[11.6,-6.5],[12.4,-6.0]];
var SEA=[],SEAL=[0];(function(){for(var i=0;i<SEAV.length-1;i++){var n=Math.max(2,Math.ceil(gcd(SEAV[i],SEAV[i+1])/250));for(var k=0;k<n;k++)SEA.push(gcpt(SEAV[i],SEAV[i+1],k/n))}SEA.push(SEAV[SEAV.length-1]);for(var j=1;j<SEA.length;j++)SEAL.push(SEAL[j-1]+gcd(SEA[j-1],SEA[j]))})();
var SEAKM=SEAL[SEAL.length-1];
function seaPt(u){var L=u*SEAKM,i=1;while(i<SEA.length-1&&SEAL[i]<L)i++;var f=(L-SEAL[i-1])/Math.max(1,SEAL[i]-SEAL[i-1]);return[lerp(SEA[i-1][0],SEA[i][0],f),lerp(SEA[i-1][1],SEA[i][1],f)]}
var PR=[0,0,0,.03,.45,.97,1,1];
window.makeHolo=function(cv,opts){
 opts=opts||{};var ctx=cv.getContext('2d');if(!ctx)return null;
 var W=300,H=380,dpr=1,cam={lon:100,lat:20,R:150},tgt={lon:60,lat:12,R:150},step=4,mode='avion',pg=0,pgT=0,t0=performance.now(),run=false,vis=false,drag=null,hold=0,last=0,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,lastPct=-1;
 function size(){var r=cv.getBoundingClientRect();W=Math.max(200,r.width);H=Math.max(240,r.height);dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr}
 function P(lon,lat,h){var l0=cam.lon*RAD,p0=cam.lat*RAD,p=lat*RAD,d=lon*RAD-l0,e=1+(h||0);var x=Math.cos(p)*Math.sin(d),y=Math.cos(p0)*Math.sin(p)-Math.sin(p0)*Math.cos(p)*Math.cos(d),z=Math.sin(p0)*Math.sin(p)+Math.cos(p0)*Math.cos(p)*Math.cos(d);return{x:W/2+cam.R*x*e,y:H*.41-cam.R*y*e,z:z}}
 function pos(u){if(mode==='bateau')return seaPt(u);return gcpt(ORIG.Chine,KIN,u)}
 function hgt(u){return mode==='bateau'?.004:.26*Math.sin(Math.PI*u)}
 function aim(){var u=Math.max(pgT,.02),p=pos(u),c=gcpt(p,KIN,.4);tgt.lon=c[0];tgt.lat=cl(c[1]*.8+8,-20,40);tgt.R=Math.min(W*.36,H*.34)}
 function setStep(s,m){var nm=m||mode;if(nm!==mode){mode=nm;pg=0}step=s;pgT=s<0?0:PR[cl(s,0,7)];if(!run||reduce){pg=pgT}aim();hold=0;kick()}
 function txt(s,x,y,size,col,w,al,ls){ctx.font=(w||600)+' '+size+'px "Big Shoulders Display","Bricolage Grotesque",system-ui,sans-serif';ctx.fillStyle=col;ctx.textAlign=al||'left';try{ctx.letterSpacing=(ls||0)+'px'}catch(e){}ctx.fillText(s,x,y);try{ctx.letterSpacing='0px'}catch(e){}}
 function draw(now){
  var t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000||.016);last=now;
  if(!drag){hold=Math.max(0,hold-dt);if(hold<=0){cam.lon+=(tgt.lon-cam.lon)*Math.min(1,dt*2.2);cam.lat+=(tgt.lat-cam.lat)*Math.min(1,dt*2.2)}}
  cam.R+=(tgt.R-cam.R)*Math.min(1,dt*3);pg+=(pgT-pg)*Math.min(1,dt*(reduce?30:1.1));if(Math.abs(pgT-pg)<.0006)pg=pgT;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
  var g=ctx.createRadialGradient(W/2,H*.45,10,W/2,H*.5,Math.max(W,H)*.8);g.addColorStop(0,'#071a2e');g.addColorStop(.6,'#040c17');g.addColorStop(1,'#010206');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(var i=0;i<60;i++){var tw=.3+.7*Math.abs(Math.sin(t*(.5+rnd(i+9))+i));ctx.fillStyle='rgba(180,220,255,'+(.45*tw)+')';ctx.fillRect(rnd(i)*W,rnd(i+300)*H,1.1,1.1)}
  var R=cam.R,cx=W/2,cy=H*.41;
  var sp=ctx.createRadialGradient(cx-R*.3,cy-R*.3,R*.1,cx,cy,R);sp.addColorStop(0,'rgba(14,42,70,.95)');sp.addColorStop(1,'rgba(3,10,20,.96)');ctx.fillStyle=sp;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  ctx.globalCompositeOperation='lighter';
  var at=ctx.createRadialGradient(cx,cy,R*.94,cx,cy,R*1.13);at.addColorStop(0,'rgba('+C+',0)');at.addColorStop(.22,'rgba('+C+',.36)');at.addColorStop(1,'rgba('+C+',0)');ctx.fillStyle=at;ctx.beginPath();ctx.arc(cx,cy,R*1.13,0,7);ctx.fill();
  ctx.strokeStyle='rgba('+C+',.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
  ctx.lineWidth=.6;ctx.strokeStyle='rgba('+C+',.12)';
  for(var la=-60;la<=60;la+=20){ctx.beginPath();var on=false;for(var lo=-180;lo<=180;lo+=5){var q=P(lo,la,0);if(q.z>0){if(!on){ctx.moveTo(q.x,q.y);on=true}else ctx.lineTo(q.x,q.y)}else on=false}ctx.stroke()}
  for(var lo2=-180;lo2<180;lo2+=20){ctx.beginPath();var on2=false;for(var la2=-80;la2<=80;la2+=5){var q2=P(lo2,la2,0);if(q2.z>0){if(!on2){ctx.moveTo(q2.x,q2.y);on2=true}else ctx.lineTo(q2.x,q2.y)}else on2=false}ctx.stroke()}
  var D=dots(),ds=Math.max(1.3,R/120);
  for(var k=0;k<D.length;k++){var d=D[k],e=reduce?1:eo(sg(t,d.d,d.d+1));if(e<=0)continue;var q3=P(d.lon,d.lat,0);if(q3.z<=0)continue;var al=Math.min(1,(.38+.9*Math.pow(q3.z,.6))*d.b*e);var drc=d.lon>12&&d.lon<31&&d.lat>-13&&d.lat<5;ctx.fillStyle=drc?'rgba(255,150,60,'+al+')':'rgba('+C+','+al+')';ctx.fillRect(q3.x+d.ox*(1-e)*(R/200)-ds/2,q3.y+d.oy*(1-e)*(R/200)-ds/2,ds,ds)}
  // route complète (faible) + partie parcourue (vive)
  var N=90;
  function trace(frac,col,w,bl){ctx.beginPath();var on=false;for(var i=0;i<=N*frac;i++){var u=i/N,p=pos(u),q=P(p[0],p[1],hgt(u));if(q.z>.02){if(!on){ctx.moveTo(q.x,q.y);on=true}else ctx.lineTo(q.x,q.y)}else on=false}ctx.strokeStyle=col;ctx.lineWidth=w;ctx.shadowColor=col;ctx.shadowBlur=bl;ctx.stroke();ctx.shadowBlur=0}
  ctx.setLineDash([4,6]);trace(1,mode==='bateau'?'rgba('+C+',.5)':'rgba(255,170,90,.4)',1.2,0);ctx.setLineDash([]);
  if(step>=0&&pg>.003)trace(pg,mode==='bateau'?'rgb('+C+')':'rgb(255,150,50)',2.4,12);
  // nœuds
  function node(lonlat,label,a,col,big){var q=P(lonlat[0],lonlat[1],0);if(q.z<.05)return;var ph=(t*.9)%1;ctx.strokeStyle='rgba('+col+','+(.7*(1-ph)*a)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(q.x,q.y,5+ph*(big?22:14),0,7);ctx.stroke();ctx.shadowColor='rgb('+col+')';ctx.shadowBlur=14;ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.beginPath();ctx.arc(q.x,q.y,big?5.5:3.6,0,7);ctx.fill();ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';var left=q.x>W*.55;txt(label,q.x+(left?-11:11),q.y-9,big?15:12,'rgba(255,255,255,'+a+')',700,left?'right':'left',1.2);ctx.globalCompositeOperation='lighter'}
  node(ORIG['Dubaï'],'DUBAÏ',.55,'255,193,90');node(ORIG.Istanbul,'ISTANBUL',.55,'255,138,74');node(ORIG.Chine,'CHINE',1,O,true);node(KIN,'KINSHASA',1,O,true);
  // colis
  if(step>=0){var p=pos(pg),q=P(p[0],p[1],hgt(pg));
   for(var k2=1;k2<22;k2++){var u2=Math.max(0,pg-k2*.007),pp=pos(u2),qq=P(pp[0],pp[1],hgt(u2));if(qq.z>0){ctx.fillStyle=(mode==='bateau'?'rgba('+C+',':'rgba(255,220,160,')+(.65*(1-k2/22))+')';ctx.beginPath();ctx.arc(qq.x,qq.y,3*(1-k2/44),0,7);ctx.fill()}}
   if(q.z>0){var pb=pos(Math.max(0,pg-.012)),qb=P(pb[0],pb[1],hgt(Math.max(0,pg-.012))),ang=Math.atan2(q.y-qb.y,q.x-qb.x);
    ctx.save();ctx.translate(q.x,q.y);ctx.shadowColor='#fff';ctx.shadowBlur=20;ctx.fillStyle='#fff';
    if(mode==='avion'){ctx.rotate(ang);ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-6,-3);ctx.lineTo(-4,0);ctx.lineTo(-6,3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(-5,-11);ctx.lineTo(-7,-11);ctx.lineTo(-2,0);ctx.lineTo(-7,11);ctx.lineTo(-5,11);ctx.closePath();ctx.fill()}
    else{ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill()}
    ctx.restore();ctx.shadowBlur=0;
    var ph2=(t*1.1)%1;ctx.strokeStyle='rgba(255,255,255,'+(.6*(1-ph2))+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(q.x,q.y,8+ph2*18,0,7);ctx.stroke()}}
  // livré : onde sur Kinshasa
  if(step>=6){var kq=P(KIN[0],KIN[1],0);if(kq.z>0){for(var w=0;w<3;w++){var ph3=((t*.7)+w/3)%1;ctx.strokeStyle='rgba(60,220,130,'+(.8*(1-ph3))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(kq.x,kq.y,6+ph3*46,0,7);ctx.stroke()}}}
  ctx.globalCompositeOperation='source-over';
  // balayage + coins
  var sy=((t*90)%(H+60))-30;var sc=ctx.createLinearGradient(0,sy-30,0,sy+2);sc.addColorStop(0,'rgba('+C+',0)');sc.addColorStop(1,'rgba('+C+',.09)');ctx.fillStyle=sc;ctx.fillRect(0,sy-30,W,32);
  ctx.strokeStyle='rgba('+O+',.9)';ctx.lineWidth=2;[[10,10,1,1],[W-10,10,-1,1],[10,H-10,1,-1],[W-10,H-10,-1,-1]].forEach(function(c){ctx.beginPath();ctx.moveTo(c[0],c[1]+c[3]*20);ctx.lineTo(c[0],c[1]);ctx.lineTo(c[0]+c[2]*20,c[1]);ctx.stroke()});
  var km=Math.round((1-pg)*(mode==='bateau'?SEAKM:gcd(ORIG.Chine,KIN))/10)*10,pct=Math.round(pg*100);
  if(opts.onProgress&&pct+'|'+km!==lastPct){lastPct=pct+'|'+km;opts.onProgress(pct,km,mode)}
 }
 function loop(now){if(!run)return;draw(now);if(reduce&&Math.abs(pgT-pg)<.0006){run=false;return}requestAnimationFrame(loop)}
 function kick(){if(vis&&!run){run=true;last=performance.now();requestAnimationFrame(loop)}else if(!vis){size();draw(performance.now())}}
 function start(){if(vis&&!document.hidden&&!run){run=true;last=performance.now();requestAnimationFrame(loop)}}
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){size();aim();start()}else run=false},{threshold:.05}).observe(cv);else{vis=true;size();aim();start()}
 document.addEventListener('visibilitychange',function(){if(document.hidden)run=false;else start()});
 if(window.ResizeObserver)new ResizeObserver(function(){size();aim()}).observe(cv);
 cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY};try{cv.setPointerCapture(e.pointerId)}catch(x){}});
 cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};cam.lon-=dx*.4;cam.lat=cl(cam.lat+dy*.3,-70,70);hold=4});
 function up(){drag=null;hold=4}cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 size();aim();cam.lon=tgt.lon+80;cam.lat=tgt.lat;cam.R=tgt.R*.7;
 return{setStep:setStep,setMode:function(m){setStep(step,m)}};
};
})();
