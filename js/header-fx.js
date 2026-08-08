/* ═══════════════════════════════════════════════════════════════
   헤더 메타볼 배경 — 라이브러리 없음, WebGL 셰이더 하나
   텍스트 가독성을 위해 낮은 투명도로 텍스트 뒤에 깔립니다.

   WebGL 이 안 되는 환경(일부 iOS, 저전력 모드, 오래된 기기)에서는
   .site-head 의 CSS 그라데이션 배경이 그대로 남습니다.
   성공했을 때만 .fx-on 클래스를 붙여 CSS 배경을 끕니다.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var head = document.querySelector('.site-head');
  if (!head) return;

  function giveUp(canvas) {
    head.classList.remove('fx-on');
    if (canvas && canvas.parentNode) canvas.remove();
  }

  var canvas = document.createElement('canvas');
  canvas.className = 'head-fx';
  canvas.setAttribute('aria-hidden', 'true');
  head.insertBefore(canvas, head.firstChild);

  // premultipliedAlpha 는 기본값(true)을 씁니다.
  // false 로 두면 iOS WebKit 에서 캔버스가 통째로 안 보이는 경우가 있습니다.
  var opts = { alpha: true, antialias: false, depth: false, stencil: false };
  var gl = canvas.getContext('webgl', opts) ||
           canvas.getContext('experimental-webgl', opts);
  if (!gl) { giveUp(canvas); return; }

  var VERT =
    'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uHover;',
    'uniform int uCount;uniform float uScale;',
    'uniform vec3 uC1;uniform vec3 uC2;uniform float uAlpha;',
    'float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'void main(){',
    '  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);',
    '  float t=uTime;float H=uRes.y;float S=uScale;',
    '  float d=1e5;',
    '  float N=float(uCount);',
    '  for(int i=0;i<4;i++){',
    '    if(i>=uCount) break;',
    '    float f=float(i);',
    '    float slot=(f+0.5)/N;',
    '    vec2 c=vec2(uRes.x*slot+sin(t*(0.17+0.05*f)+f*2.1)*uRes.x*(0.34/N),',
    '                H*0.5+sin(t*(0.23+0.07*f)+f*1.3)*(H*0.5-S*0.55));',
    '    float r=S*(1.00+0.26*sin(f*2.0));',
    '    d=smin(d,length(p-c)-r,S*2.6);',
    '  }',
    '  float mr=S*1.2*uHover;',
    '  d=smin(d,length(p-uMouse)-mr,S*2.9);',
    '  float m=smoothstep(3.0,-13.0,d);',
    '  vec3 col=mix(uC1,uC2,clamp(-d/(H*0.9),0.,1.));',
    '  float a=m*uAlpha;',
    '  gl_FragColor=vec4(col*a,a);',   // premultiplied alpha 로 출력
    '}'
  ].join('\n');

  var U = {};

  function setup() {
    function sh(type, src) {
      var o = gl.createShader(type);
      gl.shaderSource(o, src); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; }
      return o;
    }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.disable(gl.BLEND);

    ['uRes', 'uTime', 'uMouse', 'uHover', 'uC1', 'uC2', 'uAlpha', 'uCount', 'uScale'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    return true;
  }
  if (!setup()) { giveUp(canvas); return; }

  function readColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    var m = v.replace('#', '');
    return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255];
  }
  var C1 = readColor('--fx-1', '#c3aef5');
  var C2 = readColor('--fx-2', '#6f55cc');
  var ALPHA = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fx-alpha')) || 0.42;

  var W = 0, H = 0, count = 4, alphaNow = 0.42, lost = false;
  var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    var r = head.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);

    var baseR = W < 560 ? 24 : 28;
    count = W < 560 ? 2 : (W < 900 ? 3 : 4);
    alphaNow = ALPHA * (W < 560 ? 0.8 : 1.0);
    gl.uniform1f(U.uScale, baseR * dpr);
    gl.uniform1i(U.uCount, count);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  // iOS 는 주소창이 접히면서 레이아웃이 늦게 확정되는 일이 있어 한 번 더 맞춥니다.
  window.addEventListener('orientationchange', function () { setTimeout(resize, 250); }, { passive: true });
  window.addEventListener('load', function () { setTimeout(resize, 100); });

  var mx = W * 0.5 * dpr, my = H * 0.5 * dpr, tmx = mx, tmy = my;
  var hover = 0, tHover = 0;

  head.addEventListener('mousemove', function (e) {
    var r = head.getBoundingClientRect();
    tmx = (e.clientX - r.left) * dpr;
    tmy = (e.clientY - r.top) * dpr;
    tHover = 1;
  }, { passive: true });
  head.addEventListener('mouseleave', function () { tHover = 0; }, { passive: true });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; })
      .observe(head);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
  });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    lost = true;
    head.classList.remove('fx-on');   // 복구될 때까지 CSS 배경으로 대체
  }, false);
  canvas.addEventListener('webglcontextrestored', function () {
    try {
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      if (!gl) { giveUp(canvas); return; }
      setup();
      resize();
      lost = false;
      head.classList.add('fx-on');
    } catch (err) { giveUp(canvas); }
  }, false);

  // 캔버스가 실제로 그려졌는지 한 번 확인합니다.
  // iOS 등에서 컨텍스트는 생기지만 화면에는 아무것도 안 나오는 경우를 걸러냅니다.
  var frames = 0, verified = false;
  function verify() {
    try {
      var y = Math.floor(canvas.height / 2);
      var px = new Uint8Array(canvas.width * 4);
      gl.readPixels(0, y, canvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      for (var i = 3; i < px.length; i += 4) {
        if (px[i] > 4) return true;
      }
      return false;
    } catch (e) { return false; }
  }

  var start = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || lost) return;

    mx += (tmx - mx) * 0.08;
    my += (tmy - my) * 0.08;
    hover += (tHover - hover) * 0.06;

    gl.uniform1f(U.uTime, reduce ? 0.0 : (now - start) / 1000);
    gl.uniform2f(U.uMouse, mx, my);
    gl.uniform1f(U.uHover, hover);
    gl.uniform3fv(U.uC1, C1);
    gl.uniform3fv(U.uC2, C2);
    gl.uniform1f(U.uAlpha, alphaNow);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!verified) {
      frames++;
      if (frames === 1) {
        head.classList.add('fx-on');       // 일단 켭니다
      } else if (frames === 20) {
        verified = true;
        if (!verify()) giveUp(canvas);     // 실제로 안 그려졌으면 CSS 배경으로 되돌립니다
      }
    }
  }
  requestAnimationFrame(frame);
})();
