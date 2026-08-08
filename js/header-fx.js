/* ═══════════════════════════════════════════════════════════════
   헤더 메타볼 배경 — 라이브러리 없음, WebGL 셰이더 하나
   텍스트 가독성을 위해 낮은 투명도로 텍스트 뒤에 깔립니다.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var head = document.querySelector('.site-head');
  if (!head) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'head-fx';
  canvas.setAttribute('aria-hidden', 'true');
  head.insertBefore(canvas, head.firstChild);

  var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) { canvas.remove(); return; }   // 미지원 브라우저에서는 조용히 사라집니다

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
    '    float slot=(f+0.5)/N;',                       // 개수와 무관하게 가로로 균등 분산
    '    vec2 c=vec2(uRes.x*slot+sin(t*(0.17+0.05*f)+f*2.1)*uRes.x*(0.34/N),',
    '                H*0.5+sin(t*(0.23+0.07*f)+f*1.3)*(H*0.5-S*0.55));',
    '    float r=S*(1.00+0.26*sin(f*2.0));',           // 헤더 높이가 아니라 고정 기준 S 사용
    '    d=smin(d,length(p-c)-r,S*2.6);',
    '  }',
    '  float mr=S*1.2*uHover;',
    '  d=smin(d,length(p-uMouse)-mr,S*2.9);',
    '  float m=smoothstep(3.0,-13.0,d);',
    '  vec3 col=mix(uC1,uC2,clamp(-d/(H*0.9),0.,1.));',
    '  gl_FragColor=vec4(col,m*uAlpha);',
    '}'
  ].join('\n');

  var U = {};

  // 셰이더·버퍼 준비. 컨텍스트가 복구될 때 그대로 다시 호출합니다.
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

    // 블렌딩은 끕니다. 삼각형 하나만 그리므로 셰이더 출력이 곧 최종값이고,
    // 여기서 블렌딩을 켜면 알파가 두 번 곱해져 색이 회색으로 죽습니다.
    gl.disable(gl.BLEND);

    ['uRes', 'uTime', 'uMouse', 'uHover', 'uC1', 'uC2', 'uAlpha', 'uCount', 'uScale'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    return true;
  }
  if (!setup()) { canvas.remove(); return; }

  // 색은 CSS 변수에서 읽어옵니다 (--fx-1, --fx-2, --fx-alpha)
  function readColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    var m = v.replace('#', '');
    return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255];
  }
  var C1 = readColor('--fx-1', '#b9a8ec');
  var C2 = readColor('--fx-2', '#7f6ad0');
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

    // 방울 크기는 헤더 높이가 아니라 고정 기준값(px)에 묶습니다.
    // 이렇게 해야 메뉴가 줄바꿈되어 헤더가 높아져도 방울이 커지지 않습니다.
    var baseR = W < 560 ? 24 : 28;                 // CSS px 기준 반지름
    count = W < 560 ? 2 : (W < 900 ? 3 : 4);       // 좁을수록 개수를 줄입니다
    alphaNow = ALPHA * (W < 560 ? 0.8 : 1.0);      // 모바일은 살짝 옅게
    gl.uniform1f(U.uScale, baseR * dpr);
    gl.uniform1i(U.uCount, count);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

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

  // GPU 드라이버 재시작 등으로 컨텍스트가 날아가도 복구되도록 합니다.
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    lost = true;
  }, false);
  canvas.addEventListener('webglcontextrestored', function () {
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
      if (!gl) { canvas.remove(); return; }
      setup();
      resize();
      lost = false;
    } catch (err) { canvas.remove(); }
  }, false);

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
  }
  requestAnimationFrame(frame);
})();
