/**
 * DevShelf — Vengeance UI Liquid Metal Shader Engine
 * Ultra-fast GPU-accelerated molten chrome fluid shader with interactive cursor ripples
 * and IntersectionObserver auto-pause for optimal battery and 60 FPS performance.
 */

(() => {
  const VS_SOURCE = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FS_SOURCE = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform vec3 u_colorBack;
    uniform vec3 u_colorTint;
    uniform float u_distortion;
    uniform float u_repetition;
    uniform float u_speed;
    varying vec2 v_uv;

    vec2 distort(vec2 p, float t, vec2 mouse) {
      vec2 m = mouse * 2.0 - 1.0;
      float dist = length(p - m);
      float mouseInfluence = exp(-dist * 3.5) * 0.45;

      float x = p.x;
      float y = p.y;
      for (int i = 1; i <= 4; i++) {
        float fi = float(i);
        x += sin(y * fi * 2.2 + t * u_speed + mouseInfluence) * (u_distortion / fi);
        y += cos(x * fi * 2.2 + t * u_speed * 1.15 + mouseInfluence) * (u_distortion / fi);
      }
      return vec2(x, y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= (u_resolution.x / max(u_resolution.y, 1.0));

      float t = u_time * 0.75;
      vec2 warped = distort(p, t, u_mouse);

      // High-frequency interference bands mimicking liquid mercury / chrome
      float bands = sin(warped.x * u_repetition + warped.y * u_repetition + t);
      bands = sin(bands * 3.14159265 + warped.y * 3.5);

      // Specular highlights & metallic reflections
      float chrome = pow(abs(bands), 0.32);
      float specular = pow(max(0.0, sin(warped.x * 5.0 + warped.y * 3.5 + t * 1.4)), 3.5);
      float rim = pow(max(0.0, 1.0 - length(p * 0.45)), 1.8);

      // Iridescent Cyberpunk Metallic Blend
      vec3 back = u_colorBack;
      vec3 tint = u_colorTint;
      vec3 mid = mix(back, vec3(0.72, 0.45, 0.98), 0.6); // electric purple chrome
      vec3 light = vec3(0.98, 0.99, 1.0);

      vec3 color = mix(back, mid, chrome);
      color = mix(color, tint, pow(chrome, 2.2) * 0.85);
      color += light * specular * 0.75;
      color = mix(color, tint * 1.2, rim * 0.25);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function hexToRgb(hex) {
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = Number.parseInt(clean, 16) || 0;
    return [(num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  class LiquidMetalInstance {
    constructor(canvas) {
      this.canvas = canvas;
      this.parent = canvas.closest(".liquid-metal-btn") || canvas.parentElement;
      this.gl =
        canvas.getContext("webgl", {
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }) || canvas.getContext("experimental-webgl");

      if (!this.gl) {
        this.canvas.classList.add("webgl-unsupported");
        return;
      }

      this.isVisible = false;
      this.startTime = performance.now();
      this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
      this.rafId = null;

      // Extract data attributes or defaults
      this.colorBack = hexToRgb(canvas.dataset.back || "#030712");
      this.colorTint = hexToRgb(canvas.dataset.tint || "#a855f7");
      this.speed = Number.parseFloat(canvas.dataset.speed || "0.55");
      this.distortion = Number.parseFloat(canvas.dataset.distortion || "0.2");
      this.repetition = Number.parseFloat(canvas.dataset.repetition || "3.8");

      this.initGL();
      this.setupEvents();
    }

    initGL() {
      const gl = this.gl;
      const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Program link error:", gl.getProgramInfoLog(program));
        return;
      }

      this.program = program;
      this.uTime = gl.getUniformLocation(program, "u_time");
      this.uResolution = gl.getUniformLocation(program, "u_resolution");
      this.uMouse = gl.getUniformLocation(program, "u_mouse");
      this.uColorBack = gl.getUniformLocation(program, "u_colorBack");
      this.uColorTint = gl.getUniformLocation(program, "u_colorTint");
      this.uDistortion = gl.getUniformLocation(program, "u_distortion");
      this.uRepetition = gl.getUniformLocation(program, "u_repetition");
      this.uSpeed = gl.getUniformLocation(program, "u_speed");

      const aPosition = gl.getAttribLocation(program, "a_position");

      // Full screen quad
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      this.resize();
    }

    resize() {
      if (!this.gl) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(Math.floor(rect.width * dpr), 10);
      const height = Math.max(Math.floor(rect.height * dpr), 10);

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }
    }

    setupEvents() {
      if (!this.parent) return;

      const onPointerMove = (e) => {
        const rect = this.parent.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const x = (e.clientX - rect.left) / rect.width;
          const y = 1.0 - (e.clientY - rect.top) / rect.height;
          this.mouse.targetX = Math.max(0, Math.min(1, x));
          this.mouse.targetY = Math.max(0, Math.min(1, y));
        }
      };

      this.parent.addEventListener("pointermove", onPointerMove, {
        passive: true,
      });
      this.parent.addEventListener(
        "pointerleave",
        () => {
          this.mouse.targetX = 0.5;
          this.mouse.targetY = 0.5;
        },
        { passive: true },
      );

      window.addEventListener(
        "resize",
        () => {
          if (this.isVisible) this.resize();
        },
        { passive: true },
      );
    }

    start() {
      if (this.rafId || !this.gl) return;
      this.isVisible = true;
      this.resize();

      const loop = (now) => {
        if (!this.isVisible) {
          this.rafId = null;
          return;
        }

        // Smooth mouse lerp
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

        const time = (now - this.startTime) * 0.001;
        const gl = this.gl;

        gl.useProgram(this.program);
        gl.uniform1f(this.uTime, time);
        gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uMouse, this.mouse.x, this.mouse.y);
        gl.uniform3fv(this.uColorBack, this.colorBack);
        gl.uniform3fv(this.uColorTint, this.colorTint);
        gl.uniform1f(this.uDistortion, this.distortion);
        gl.uniform1f(this.uRepetition, this.repetition);
        gl.uniform1f(this.uSpeed, this.speed);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        this.rafId = requestAnimationFrame(loop);
      };

      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      this.isVisible = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  // Initialize all Liquid Metal Buttons with IntersectionObserver
  function initLiquidMetal() {
    const canvases = document.querySelectorAll(".liquid-metal-canvas");
    if (!canvases.length) return;

    const instances = [];
    for (let i = 0; i < canvases.length; i++) {
      instances.push(new LiquidMetalInstance(canvases[i]));
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const inst = instances.find((inst) => inst.canvas === entry.target);
            if (inst) {
              if (entry.isIntersecting) {
                inst.start();
              } else {
                inst.stop();
              }
            }
          }
        },
        { threshold: 0.05 },
      );

      canvases.forEach((c) => observer.observe(c));
    } else {
      instances.forEach((inst) => inst.start());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiquidMetal);
  } else {
    initLiquidMetal();
  }

  window.initLiquidMetal = initLiquidMetal;
})();
