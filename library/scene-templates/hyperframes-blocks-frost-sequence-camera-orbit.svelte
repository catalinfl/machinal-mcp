<!-- Modified Svelte adaptation of registry/blocks/frost-sequence-camera-orbit/frost-sequence-camera-orbit.html and source/src/core/{motion,schedule}.ts; revision 8ec98be29a64e88239a0c05f7e5d09f36e181493; Apache-2.0. Original licence and CREDITS are in hyperframes-library/. -->
<script>
  import {SceneCanvas, SceneThree, useScene} from '@machinal/scenes/svelte';

  let {design={
    durationInFrames:675,fps:30,speed:1,
    headline1:'Hard to|break.',
    headline2:'Easy to|remember.',
    turnYaw:180,turnPitch:-41,approach:7,
    turnYaw2:160,turnPitch2:35,retreat:3.5,
    finalYaw:40,finalPitch:-20,zoomIn:5,
    driftYaw:2,driftSway:4,idleYaw:6,
    shardCount:96,seed:1407,
  }}=$props();
  const runtime=useScene();
  const vertex=`
    varying vec2 vUv;varying vec3 vNormalView;varying vec3 vView;
    void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vNormalView=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}
  `;
  const fragment=`
    precision highp float;uniform sampler2D uMap;uniform float uTime;uniform float uOpacity;
    varying vec2 vUv;varying vec3 vNormalView;varying vec3 vView;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
    void main(){
      vec4 ink=texture2D(uMap,vUv);if(ink.a<.025)discard;
      vec3 n=normalize(vNormalView),v=normalize(vView);float fresnel=pow(1.0-abs(dot(n,v)),3.0);
      float grain=noise(vUv*145.0+uTime*.025);float frost=smoothstep(.55,.91,grain);
      float striation=pow(max(0.0,sin(vUv.x*71.0+vUv.y*37.0+uTime*.13)),18.0);
      vec3 ice=mix(vec3(.24,.48,.68),vec3(.76,.91,1.0),frost*.68+fresnel*.32);
      ice+=vec3(.44,.72,1.0)*(fresnel*.72+striation*.22);
      ice=mix(ice,vec3(.94,.98,1.0),ink.r*.78);
      float alpha=ink.a*uOpacity*(.76+fresnel*.22+frost*.08);
      gl_FragColor=vec4(ice,clamp(alpha,0.0,1.0));
    }
  `;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>{const p=clamp(value);return p*p*(3-2*p);};
  const flow=value=>{const p=clamp(value);return p*p*p*(p*(p*6.0-15.0)+10.0);};
  function randomGenerator(seed) {
    let state=seed>>>0;
    return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  }
  function roundedRect(ctx,x,y,w,h,r) {
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function clipHalfPlane(poly,nx,ny,bound) {
    const result=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=nx*a[0]+ny*a[1]-bound,db=nx*b[0]+ny*b[1]-bound;
      const insideA=da<=1e-8,insideB=db<=1e-8;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=da/(da-db);result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
    }
    return result;
  }
  function voronoi(boundary,sites,index) {
    const site=sites[index];let poly=boundary.slice();
    for(let j=0;j<sites.length&&poly.length>=3;j++){
      if(j===index)continue;
      const other=sites[j],nx=2*(other[0]-site[0]),ny=2*(other[1]-site[1]);
      poly=clipHalfPlane(poly,nx,ny,other[0]**2+other[1]**2-site[0]**2-site[1]**2);
    }
    return poly;
  }
  function makeShardGeometry(THREE,polygon,center,halfWidth,halfHeight,depth) {
    const points=polygon.map(point=>new THREE.Vector2(point[0]-center[0],point[1]-center[1]));
    const contour=THREE.ShapeUtils.isClockWise(points)?points:points.slice().reverse();
    const triangles=THREE.ShapeUtils.triangulateShape(contour,[]),positions=[],uvs=[];
    const add=(point,z)=>{positions.push(point.x,point.y,z);uvs.push((center[0]+point.x+halfWidth)/(2*halfWidth),(center[1]+point.y+halfHeight)/(2*halfHeight));};
    for(const tri of triangles){
      const a=contour[tri[0]],b=contour[tri[1]],c=contour[tri[2]];
      add(a,depth/2);add(b,depth/2);add(c,depth/2);
      add(c,-depth/2);add(b,-depth/2);add(a,-depth/2);
    }
    for(let i=0;i<contour.length;i++){
      const a=contour[i],b=contour[(i+1)%contour.length];
      add(a,depth/2);add(b,depth/2);add(b,-depth/2);
      add(a,depth/2);add(b,-depth/2);add(a,-depth/2);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
    return {geometry,contour};
  }
  function makeTexture(THREE,kind,copy,halfWidth,halfHeight) {
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    if(kind==='logo'){
      const mark=new Path2D('M44.118 0H151.528C195.082 0 230.39 35.307 230.39 78.861V181.297H186.273V78.861C186.273 77.812 186.231 76.77 186.151 75.737L78.74 181.28C79.102 181.291 79.466 181.297 79.83 181.297H186.272V222.964H79.83C36.276 222.964 0 187.311 0 143.757V41.593H44.118V143.756C44.118 145.723 44.27 147.667 44.566 149.574L154.339 41.709C153.413 41.632 152.476 41.593 151.527 41.593H44.117V0H44.118Z');
      ctx.save();ctx.translate(700,195);ctx.scale(2.8,2.8);ctx.fill(mark);ctx.restore();
    }else{
      const lines=String(copy||'').split('|').slice(0,3);
      let size=208;ctx.font=`600 ${size}px Arial,sans-serif`;
      while(size>90&&lines.some(line=>ctx.measureText(line).width>1840)){size-=4;ctx.font=`600 ${size}px Arial,sans-serif`;}
      const lineHeight=size*.95,startY=512-(lines.length-1)*lineHeight/2;
      lines.forEach((line,index)=>ctx.fillText(line,1024,startY+index*lineHeight,1880));
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
    texture.userData.halfWidth=halfWidth;texture.userData.halfHeight=halfHeight;
    return texture;
  }
  function makeShape(THREE,world,random,config) {
    const {kind,copy,halfWidth,halfHeight,count,inStart,inEnd,outStart,outEnd}=config;
    const texture=makeTexture(THREE,kind,copy,halfWidth,halfHeight);
    const material=new THREE.ShaderMaterial({
      uniforms:{uMap:{value:texture},uTime:{value:0},uOpacity:{value:0}},
      vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    });
    const edgeMaterial=new THREE.LineBasicMaterial({color:'#a8ddff',transparent:true,opacity:.4});
    const boundary=[[-halfWidth,-halfHeight],[halfWidth,-halfHeight],[halfWidth,halfHeight],[-halfWidth,halfHeight]];
    const sites=Array.from({length:count},()=>[(random()*2-1)*halfWidth,(random()*2-1)*halfHeight]);
    const layer=new THREE.Group();layer.name=`Frost_${kind}`;world.add(layer);
    const pieces=[];
    for(let i=0;i<sites.length;i++){
      const polygon=voronoi(boundary,sites,i);if(polygon.length<3)continue;
      const center=polygon.reduce((sum,p)=>[sum[0]+p[0]/polygon.length,sum[1]+p[1]/polygon.length],[0,0]);
      const built=makeShardGeometry(THREE,polygon,center,halfWidth,halfHeight,.075);
      const piece=new THREE.Group(),mesh=new THREE.Mesh(built.geometry,material);
      piece.add(mesh);
      const edgePoints=built.contour.map(point=>new THREE.Vector3(point.x,point.y,.042));
      piece.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edgePoints),edgeMaterial));
      piece.position.set(center[0],center[1],0);layer.add(piece);
      const sign=center[0]>=0?1:-1;
      const out=[sign*(.9+random()*2.6),(random()-.5)*2.1,(random()-.25)*2.8];
      const inbound=[sign*(.4+random()*3.3),(random()-.5)*2.8,-1.2-random()*2.1];
      const spin=[(random()-.5)*3.2,(random()-.5)*3.2,(random()-.5)*2.4];
      pieces.push({piece,center,out,inbound,spin,phase:random()*Math.PI*2,frequency:.45+random()*.8});
    }
    return {layer,material,edgeMaterial,pieces,texture,inStart,inEnd,outStart,outEnd};
  }
  function poseAt(time) {
    const schedule={logoBreak:1.5,form1:3.8,break1:10.375,form2:12.675,break2:18.5,fadeOut:22};
    const turns=[
      {t0:schedule.logoBreak-.65,tBreakEnd:schedule.form1,t1:schedule.form1+2.8,yaw:design.turnYaw,pitch:design.turnPitch,z:design.approach,keep:false},
      {t0:schedule.break1-.65,tBreakEnd:schedule.form2,t1:schedule.form2+2.8,yaw:design.turnYaw2,pitch:design.turnPitch2,z:-design.retreat,keep:false},
      {t0:schedule.break2-.65,tBreakEnd:schedule.fadeOut+1.5,t1:schedule.fadeOut+1.5,yaw:design.finalYaw,pitch:design.finalPitch,z:design.approach+design.zoomIn,keep:true},
    ];
    let yaw=0,pitch=0,z=0;
    for(const turn of turns){
      const u=(time-turn.t0)/Math.max(turn.t1-turn.t0,1e-6);if(u<=0)continue;
      yaw+=turn.yaw*flow(u);
      const crest=(turn.tBreakEnd-turn.t0)/Math.max(turn.t1-turn.t0,1e-6);
      const bump=u<=crest?flow(u/Math.max(crest,1e-6)):1-flow((u-crest)/Math.max(1-crest,1e-6));
      const envelope=turn.keep?flow(u):bump;
      pitch+=turn.pitch*envelope;z+=turn.z*envelope;
    }
    const sway=design.driftSway*Math.sin(2*Math.PI*time/11);
    return {yaw:yaw+design.driftYaw*time+design.idleYaw*Math.sin(2*Math.PI*time/9),pitch:pitch+sway,z:z+.0875*sway};
  }
  function setup({THREE,world,camera}) {
    const duration=design.durationInFrames/design.fps;
    camera.fov=30;camera.aspect=1920/1080;camera.near=.5;camera.far=80;camera.position.set(0,1.2,13.5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    world.add(new THREE.HemisphereLight(0xc9e8ff,0x102036,1.1));
    const key=new THREE.DirectionalLight(0xe9f7ff,2.7);key.position.set(-4,5,7);world.add(key);
    const rim=new THREE.PointLight(0x49aaff,3.2,20);rim.position.set(4,2,-4);world.add(rim);
    const fill=new THREE.PointLight(0xc3f2ff,1.5,16);fill.position.set(0,-3,5);world.add(fill);
    const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(40,24),new THREE.MeshBasicMaterial({color:'#060a12'}));
    backdrop.position.set(0,0,-13);world.add(backdrop);
    const rig=new THREE.Group();rig.name='Frost_Object_Motion_Rig';world.add(rig);
    const random=randomGenerator(Number.isFinite(design.seed)?design.seed:1407);
    const count=Math.max(24,Math.min(144,Math.round(design.shardCount||96)));
    const shapes=[
      makeShape(THREE,rig,random,{kind:'Mark',copy:'',halfWidth:1.8,halfHeight:1.75,count,inStart:-1,inEnd:0,outStart:1.5,outEnd:2.3}),
      makeShape(THREE,rig,random,{kind:'Headline_1',copy:design.headline1,halfWidth:3.65,halfHeight:1.8,count,inStart:2.15,inEnd:3.8,outStart:10.375,outEnd:11.05}),
      makeShape(THREE,rig,random,{kind:'Headline_2',copy:design.headline2,halfWidth:3.65,halfHeight:1.8,count,inStart:10.55,inEnd:12.675,outStart:18.5,outEnd:22}),
    ];
    const dustCount=72,positions=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){positions[i*3]=(random()-.5)*12;positions[i*3+1]=(random()-.5)*6;positions[i*3+2]=-1+random()*2;}
    const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#acdfff',size:.022,transparent:true,opacity:.24,depthWrite:false,sizeAttenuation:true}));world.add(dust);
    const fadeIn=(t,start,end)=>flow((t-start)/Math.max(.001,end-start));
    const fadeOut=(t,start,end)=>1-flow((t-start)/Math.max(.001,end-start));
    return {update(frame){
      const time=Math.max(0,Math.min(duration,(frame.time??runtime.frame.time)*design.speed));
      const endFade=1-flow((time-22)/.5);
      const pose=poseAt(time);
      rig.rotation.set(THREE.MathUtils.degToRad(pose.pitch),THREE.MathUtils.degToRad(pose.yaw),0);
      rig.position.z=pose.z;
      dust.rotation.y=time*.018;dust.position.y=Math.sin(time*.25)*.06;
      for(const shape of shapes){
        const assembling=fadeIn(time,shape.inStart,shape.inEnd);
        const breaking=fadeIn(time,shape.outStart,shape.outEnd);
        const opacity=(time<shape.inEnd?assembling:time<shape.outStart?1:time<shape.outEnd?fadeOut(time,shape.outStart,shape.outEnd):0)*endFade;
        shape.material.uniforms.uTime.value=time;
        shape.material.uniforms.uOpacity.value=opacity;
        shape.edgeMaterial.opacity=.45*opacity;
        for(const item of shape.pieces){
          const arrive=1-flow((time-shape.inStart)/Math.max(.001,shape.inEnd-shape.inStart));
          const depart=flow((time-shape.outStart)/Math.max(.001,shape.outEnd-shape.outStart));
          const x=item.center[0]+item.inbound[0]*arrive+item.out[0]*depart;
          const y=item.center[1]+item.inbound[1]*arrive+item.out[1]*depart;
          const z=item.inbound[2]*arrive+item.out[2]*depart+.018*Math.sin(time*item.frequency+item.phase);
          item.piece.position.set(x,y,z);
          const incoming=Math.pow(Math.max(0,arrive),1.2),outgoing=depart*depart;
          item.piece.rotation.set(item.spin[0]*(incoming+outgoing),item.spin[1]*(incoming+outgoing),item.spin[2]*(incoming+outgoing));
        }
      }
    }};
  }
</script>

<SceneCanvas background="#060a12">
  <SceneThree {setup} />
</SceneCanvas>
