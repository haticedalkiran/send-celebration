(() => {
  // store/demo/live-shim.js
  var area = (prefix) => ({
    async get(keys) {
      const all = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefix)) all[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k));
      }
      if (keys == null) return all;
      if (typeof keys === "string") return keys in all ? { [keys]: all[keys] } : {};
      if (Array.isArray(keys)) return Object.fromEntries(keys.filter((k) => k in all).map((k) => [k, all[k]]));
      return { ...keys, ...all };
    },
    async set(obj) {
      for (const [k, v] of Object.entries(obj)) localStorage.setItem(prefix + k, JSON.stringify(v));
    },
    async remove(keys) {
      [].concat(keys).forEach((k) => localStorage.removeItem(prefix + k));
    }
  });
  globalThis.chrome = {
    runtime: { getURL: (p) => new URL("../../" + p, location.href).href },
    storage: { sync: area("sync:"), local: area("local:") }
  };

  // src/detector.js
  var SEND_BUTTON = ".aoO";
  var CONFIRM_WINDOW_MS = 8e3;
  var POLL_MS = 80;
  var MAX_ANCESTOR_DEPTH = 25;
  var MODAL = '[role="alertdialog"], .Kj-JD';
  var debug = (...args) => {
    try {
      if (localStorage.getItem("gscDebug")) console.log("[send-celebration]", ...args);
    } catch {
    }
  };
  function findSendButton(from) {
    if (!(from instanceof Element)) return null;
    const direct = from.closest(SEND_BUTTON);
    if (direct) return direct;
    let node = from;
    for (let i = 0; node && node !== document.documentElement && i < MAX_ANCESTOR_DEPTH; i++) {
      const btn = node.querySelector(SEND_BUTTON);
      if (btn) return btn;
      node = node.parentElement;
    }
    return null;
  }
  var gone = (btn) => !btn.isConnected || btn.getClientRects().length === 0;
  var watching = /* @__PURE__ */ new Map();
  var triggerEvent = null;
  function confirmSend(btn, onSent2) {
    if (watching.has(btn)) return;
    const r = btn.getBoundingClientRect();
    const origin = {
      x: Math.min(0.95, Math.max(0.05, (r.left + r.width / 2) / window.innerWidth)),
      y: Math.min(0.95, Math.max(0.05, (r.top + r.height / 2) / window.innerHeight))
    };
    const start = Date.now();
    const stop = () => {
      clearInterval(timer);
      watching.delete(btn);
    };
    const timer = setInterval(() => {
      if (gone(btn)) {
        stop();
        debug("send confirmed (compose closed)");
        onSent2(origin);
      } else if (Date.now() - start > CONFIRM_WINDOW_MS) {
        stop();
        debug("send not confirmed (compose stayed open)");
      }
    }, POLL_MS);
    watching.set(btn, () => {
      stop();
      debug("watch cancelled (user did something else, not counted as a send)");
    });
  }
  function onUserInput(e) {
    if (!watching.size || e === triggerEvent) return;
    const t = e.target;
    if (t instanceof Element && (t.closest(SEND_BUTTON) || t.closest(MODAL))) return;
    [...watching.values()].forEach((cancel) => cancel());
  }
  function watchSends({ onTrigger, onSent: onSent2 }) {
    const handle = (e) => {
      const btn = findSendButton(e.target);
      if (!btn || watching.has(btn)) return;
      triggerEvent = e;
      debug("send triggered");
      onTrigger();
      confirmSend(btn, onSent2);
    };
    document.addEventListener("click", (e) => {
      if (e.target instanceof Element && e.target.closest(SEND_BUTTON)) handle(e);
    }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.repeat) handle(e);
    }, true);
    document.addEventListener("mousedown", onUserInput, true);
    document.addEventListener("keydown", onUserInput, true);
  }

  // node_modules/canvas-confetti/dist/confetti.module.mjs
  var module = {};
  (function main(global, module2, isWorker, workerSize) {
    var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
    var canUsePaths = typeof Path2D === "function" && typeof DOMMatrix === "function";
    var canDrawBitmap = function() {
      if (!global.OffscreenCanvas) {
        return false;
      }
      try {
        var canvas = new OffscreenCanvas(1, 1);
        var ctx2 = canvas.getContext("2d");
        ctx2.fillRect(0, 0, 1, 1);
        var bitmap = canvas.transferToImageBitmap();
        ctx2.createPattern(bitmap, "no-repeat");
      } catch (e) {
        return false;
      }
      return true;
    }();
    function noop() {
    }
    function promise(func) {
      var ModulePromise = module2.exports.Promise;
      var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
      if (typeof Prom === "function") {
        return new Prom(func);
      }
      func(noop, noop);
      return null;
    }
    var bitmapMapper = /* @__PURE__ */ function(skipTransform, map) {
      return {
        transform: function(bitmap) {
          if (skipTransform) {
            return bitmap;
          }
          if (map.has(bitmap)) {
            return map.get(bitmap);
          }
          var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          var ctx2 = canvas.getContext("2d");
          ctx2.drawImage(bitmap, 0, 0);
          map.set(bitmap, canvas);
          return canvas;
        },
        clear: function() {
          map.clear();
        }
      };
    }(canDrawBitmap, /* @__PURE__ */ new Map());
    var raf = function() {
      var TIME = Math.floor(1e3 / 60);
      var frame, cancel;
      var frames = {};
      var lastFrameTime = 0;
      if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
        frame = function(cb) {
          var id = Math.random();
          frames[id] = requestAnimationFrame(function onFrame(time) {
            if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
              lastFrameTime = time;
              delete frames[id];
              cb();
            } else {
              frames[id] = requestAnimationFrame(onFrame);
            }
          });
          return id;
        };
        cancel = function(id) {
          if (frames[id]) {
            cancelAnimationFrame(frames[id]);
          }
        };
      } else {
        frame = function(cb) {
          return setTimeout(cb, TIME);
        };
        cancel = function(timer) {
          return clearTimeout(timer);
        };
      }
      return { frame, cancel };
    }();
    var getWorker = /* @__PURE__ */ function() {
      var worker;
      var prom;
      var resolves = {};
      function decorate(worker2) {
        function execute(options, callback) {
          worker2.postMessage({ options: options || {}, callback });
        }
        worker2.init = function initWorker(canvas) {
          var offscreen = canvas.transferControlToOffscreen();
          worker2.postMessage({ canvas: offscreen }, [offscreen]);
        };
        worker2.fire = function fireWorker(options, size, done) {
          if (prom) {
            execute(options, null);
            return prom;
          }
          var id = Math.random().toString(36).slice(2);
          prom = promise(function(resolve) {
            function workerDone(msg) {
              if (msg.data.callback !== id) {
                return;
              }
              delete resolves[id];
              worker2.removeEventListener("message", workerDone);
              prom = null;
              bitmapMapper.clear();
              done();
              resolve();
            }
            worker2.addEventListener("message", workerDone);
            execute(options, id);
            resolves[id] = workerDone.bind(null, { data: { callback: id } });
          });
          return prom;
        };
        worker2.reset = function resetWorker() {
          worker2.postMessage({ reset: true });
          for (var id in resolves) {
            resolves[id]();
            delete resolves[id];
          }
        };
      }
      return function() {
        if (worker) {
          return worker;
        }
        if (!isWorker && canUseWorker) {
          var code = [
            "var CONFETTI, SIZE = {}, module = {};",
            "(" + main.toString() + ")(this, module, true, SIZE);",
            "onmessage = function(msg) {",
            "  if (msg.data.options) {",
            "    CONFETTI(msg.data.options).then(function () {",
            "      if (msg.data.callback) {",
            "        postMessage({ callback: msg.data.callback });",
            "      }",
            "    });",
            "  } else if (msg.data.reset) {",
            "    CONFETTI && CONFETTI.reset();",
            "  } else if (msg.data.resize) {",
            "    SIZE.width = msg.data.resize.width;",
            "    SIZE.height = msg.data.resize.height;",
            "  } else if (msg.data.canvas) {",
            "    SIZE.width = msg.data.canvas.width;",
            "    SIZE.height = msg.data.canvas.height;",
            "    CONFETTI = module.exports.create(msg.data.canvas);",
            "  }",
            "}"
          ].join("\n");
          try {
            worker = new Worker(URL.createObjectURL(new Blob([code])));
          } catch (e) {
            typeof console !== "undefined" && typeof console.warn === "function" ? console.warn("\u{1F38A} Could not load worker", e) : null;
            return null;
          }
          decorate(worker);
        }
        return worker;
      };
    }();
    var defaults = {
      particleCount: 50,
      angle: 90,
      spread: 45,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      x: 0.5,
      y: 0.5,
      shapes: ["square", "circle"],
      zIndex: 100,
      colors: [
        "#26ccff",
        "#a25afd",
        "#ff5e7e",
        "#88ff5a",
        "#fcff42",
        "#ffa62d",
        "#ff36ff"
      ],
      // probably should be true, but back-compat
      disableForReducedMotion: false,
      scalar: 1
    };
    function convert(val, transform) {
      return transform ? transform(val) : val;
    }
    function isOk(val) {
      return !(val === null || val === void 0);
    }
    function prop(options, name, transform) {
      return convert(
        options && isOk(options[name]) ? options[name] : defaults[name],
        transform
      );
    }
    function onlyPositiveInt(number) {
      return number < 0 ? 0 : Math.floor(number);
    }
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
    function toDecimal(str) {
      return parseInt(str, 16);
    }
    function colorsToRgb(colors) {
      return colors.map(hexToRgb);
    }
    function hexToRgb(str) {
      var val = String(str).replace(/[^0-9a-f]/gi, "");
      if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
      }
      return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6))
      };
    }
    function getOrigin(options) {
      var origin = prop(options, "origin", Object);
      origin.x = prop(origin, "x", Number);
      origin.y = prop(origin, "y", Number);
      return origin;
    }
    function setCanvasWindowSize(canvas) {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = document.documentElement.clientHeight;
    }
    function setCanvasRectSize(canvas) {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    function getCanvas(zIndex) {
      var canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.top = "0px";
      canvas.style.left = "0px";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = zIndex;
      return canvas;
    }
    function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(radiusX, radiusY);
      context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
      context.restore();
    }
    function randomPhysics(opts) {
      var radAngle = opts.angle * (Math.PI / 180);
      var radSpread = opts.spread * (Math.PI / 180);
      return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
        angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
        flat: opts.flat
      };
    }
    function updateFetti(context, fetti) {
      fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
      fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
      fetti.velocity *= fetti.decay;
      if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar;
        fetti.wobbleY = fetti.y + 10 * fetti.scalar;
        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
      } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
      }
      var progress = fetti.tick++ / fetti.totalTicks;
      var x1 = fetti.x + fetti.random * fetti.tiltCos;
      var y1 = fetti.y + fetti.random * fetti.tiltSin;
      var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
      var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
      context.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
      context.beginPath();
      if (canUsePaths && fetti.shape.type === "path" && typeof fetti.shape.path === "string" && Array.isArray(fetti.shape.matrix)) {
        context.fill(transformPath2D(
          fetti.shape.path,
          fetti.shape.matrix,
          fetti.x,
          fetti.y,
          Math.abs(x2 - x1) * 0.1,
          Math.abs(y2 - y1) * 0.1,
          Math.PI / 10 * fetti.wobble
        ));
      } else if (fetti.shape.type === "bitmap") {
        var rotation = Math.PI / 10 * fetti.wobble;
        var scaleX = Math.abs(x2 - x1) * 0.1;
        var scaleY = Math.abs(y2 - y1) * 0.1;
        var width = fetti.shape.bitmap.width * fetti.scalar;
        var height = fetti.shape.bitmap.height * fetti.scalar;
        var matrix = new DOMMatrix([
          Math.cos(rotation) * scaleX,
          Math.sin(rotation) * scaleX,
          -Math.sin(rotation) * scaleY,
          Math.cos(rotation) * scaleY,
          fetti.x,
          fetti.y
        ]);
        matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));
        var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), "no-repeat");
        pattern.setTransform(matrix);
        context.globalAlpha = 1 - progress;
        context.fillStyle = pattern;
        context.fillRect(
          fetti.x - width / 2,
          fetti.y - height / 2,
          width,
          height
        );
        context.globalAlpha = 1;
      } else if (fetti.shape === "circle") {
        context.ellipse ? context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
      } else if (fetti.shape === "star") {
        var rot = Math.PI / 2 * 3;
        var innerRadius = 4 * fetti.scalar;
        var outerRadius = 8 * fetti.scalar;
        var x = fetti.x;
        var y = fetti.y;
        var spikes = 5;
        var step = Math.PI / spikes;
        while (spikes--) {
          x = fetti.x + Math.cos(rot) * outerRadius;
          y = fetti.y + Math.sin(rot) * outerRadius;
          context.lineTo(x, y);
          rot += step;
          x = fetti.x + Math.cos(rot) * innerRadius;
          y = fetti.y + Math.sin(rot) * innerRadius;
          context.lineTo(x, y);
          rot += step;
        }
      } else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
      }
      context.closePath();
      context.fill();
      return fetti.tick < fetti.totalTicks;
    }
    function animate(canvas, fettis, resizer, size, done) {
      var animatingFettis = fettis.slice();
      var context = canvas.getContext("2d");
      var animationFrame;
      var destroy;
      var prom = promise(function(resolve) {
        function onDone() {
          animationFrame = destroy = null;
          context.clearRect(0, 0, size.width, size.height);
          bitmapMapper.clear();
          done();
          resolve();
        }
        function update() {
          if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
            size.width = canvas.width = workerSize.width;
            size.height = canvas.height = workerSize.height;
          }
          if (!size.width && !size.height) {
            resizer(canvas);
            size.width = canvas.width;
            size.height = canvas.height;
          }
          context.clearRect(0, 0, size.width, size.height);
          animatingFettis = animatingFettis.filter(function(fetti) {
            return updateFetti(context, fetti);
          });
          if (animatingFettis.length) {
            animationFrame = raf.frame(update);
          } else {
            onDone();
          }
        }
        animationFrame = raf.frame(update);
        destroy = onDone;
      });
      return {
        addFettis: function(fettis2) {
          animatingFettis = animatingFettis.concat(fettis2);
          return prom;
        },
        canvas,
        promise: prom,
        reset: function() {
          if (animationFrame) {
            raf.cancel(animationFrame);
          }
          if (destroy) {
            destroy();
          }
        }
      };
    }
    function confettiCannon(canvas, globalOpts) {
      var isLibCanvas = !canvas;
      var allowResize = !!prop(globalOpts || {}, "resize");
      var hasResizeEventRegistered = false;
      var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
      var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
      var worker = shouldUseWorker ? getWorker() : null;
      var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
      var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
      var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
      var animationObj;
      function fireLocal(options, size, done) {
        var particleCount = prop(options, "particleCount", onlyPositiveInt);
        var angle = prop(options, "angle", Number);
        var spread = prop(options, "spread", Number);
        var startVelocity = prop(options, "startVelocity", Number);
        var decay = prop(options, "decay", Number);
        var gravity = prop(options, "gravity", Number);
        var drift = prop(options, "drift", Number);
        var colors = prop(options, "colors", colorsToRgb);
        var ticks = prop(options, "ticks", Number);
        var shapes = prop(options, "shapes");
        var scalar = prop(options, "scalar");
        var flat = !!prop(options, "flat");
        var origin = getOrigin(options);
        var temp = particleCount;
        var fettis = [];
        var startX = canvas.width * origin.x;
        var startY = canvas.height * origin.y;
        while (temp--) {
          fettis.push(
            randomPhysics({
              x: startX,
              y: startY,
              angle,
              spread,
              startVelocity,
              color: colors[temp % colors.length],
              shape: shapes[randomInt(0, shapes.length)],
              ticks,
              decay,
              gravity,
              drift,
              scalar,
              flat
            })
          );
        }
        if (animationObj) {
          return animationObj.addFettis(fettis);
        }
        animationObj = animate(canvas, fettis, resizer, size, done);
        return animationObj.promise;
      }
      function fire(options) {
        var disableForReducedMotion = globalDisableForReducedMotion || prop(options, "disableForReducedMotion", Boolean);
        var zIndex = prop(options, "zIndex", Number);
        if (disableForReducedMotion && preferLessMotion) {
          return promise(function(resolve) {
            resolve();
          });
        }
        if (isLibCanvas && animationObj) {
          canvas = animationObj.canvas;
        } else if (isLibCanvas && !canvas) {
          canvas = getCanvas(zIndex);
          document.body.appendChild(canvas);
        }
        if (allowResize && !initialized) {
          resizer(canvas);
        }
        var size = {
          width: canvas.width,
          height: canvas.height
        };
        if (worker && !initialized) {
          worker.init(canvas);
        }
        initialized = true;
        if (worker) {
          canvas.__confetti_initialized = true;
        }
        function onResize() {
          if (worker) {
            var obj = {
              getBoundingClientRect: function() {
                if (!isLibCanvas) {
                  return canvas.getBoundingClientRect();
                }
              }
            };
            resizer(obj);
            worker.postMessage({
              resize: {
                width: obj.width,
                height: obj.height
              }
            });
            return;
          }
          size.width = size.height = null;
        }
        function done() {
          animationObj = null;
          if (allowResize) {
            hasResizeEventRegistered = false;
            global.removeEventListener("resize", onResize);
          }
          if (isLibCanvas && canvas) {
            if (document.body.contains(canvas)) {
              document.body.removeChild(canvas);
            }
            canvas = null;
            initialized = false;
          }
        }
        if (allowResize && !hasResizeEventRegistered) {
          hasResizeEventRegistered = true;
          global.addEventListener("resize", onResize, false);
        }
        if (worker) {
          return worker.fire(options, size, done);
        }
        return fireLocal(options, size, done);
      }
      fire.reset = function() {
        if (worker) {
          worker.reset();
        }
        if (animationObj) {
          animationObj.reset();
        }
      };
      return fire;
    }
    var defaultFire;
    function getDefaultFire() {
      if (!defaultFire) {
        defaultFire = confettiCannon(null, { useWorker: true, resize: true });
      }
      return defaultFire;
    }
    function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
      var path2d = new Path2D(pathString);
      var t1 = new Path2D();
      t1.addPath(path2d, new DOMMatrix(pathMatrix));
      var t2 = new Path2D();
      t2.addPath(t1, new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        x,
        y
      ]));
      return t2;
    }
    function shapeFromPath(pathData) {
      if (!canUsePaths) {
        throw new Error("path confetti are not supported in this browser");
      }
      var path, matrix;
      if (typeof pathData === "string") {
        path = pathData;
      } else {
        path = pathData.path;
        matrix = pathData.matrix;
      }
      var path2d = new Path2D(path);
      var tempCanvas = document.createElement("canvas");
      var tempCtx = tempCanvas.getContext("2d");
      if (!matrix) {
        var maxSize = 1e3;
        var minX = maxSize;
        var minY = maxSize;
        var maxX = 0;
        var maxY = 0;
        var width, height;
        for (var x = 0; x < maxSize; x += 2) {
          for (var y = 0; y < maxSize; y += 2) {
            if (tempCtx.isPointInPath(path2d, x, y, "nonzero")) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        width = maxX - minX;
        height = maxY - minY;
        var maxDesiredSize = 10;
        var scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);
        matrix = [
          scale,
          0,
          0,
          scale,
          -Math.round(width / 2 + minX) * scale,
          -Math.round(height / 2 + minY) * scale
        ];
      }
      return {
        type: "path",
        path,
        matrix
      };
    }
    function shapeFromText(textData) {
      var text, scalar = 1, color = "#000000", fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';
      if (typeof textData === "string") {
        text = textData;
      } else {
        text = textData.text;
        scalar = "scalar" in textData ? textData.scalar : scalar;
        fontFamily = "fontFamily" in textData ? textData.fontFamily : fontFamily;
        color = "color" in textData ? textData.color : color;
      }
      var fontSize = 10 * scalar;
      var font = "" + fontSize + "px " + fontFamily;
      var canvas = new OffscreenCanvas(fontSize, fontSize);
      var ctx2 = canvas.getContext("2d");
      ctx2.font = font;
      var size = ctx2.measureText(text);
      var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
      var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);
      var padding = 2;
      var x = size.actualBoundingBoxLeft + padding;
      var y = size.actualBoundingBoxAscent + padding;
      width += padding + padding;
      height += padding + padding;
      canvas = new OffscreenCanvas(width, height);
      ctx2 = canvas.getContext("2d");
      ctx2.font = font;
      ctx2.fillStyle = color;
      ctx2.fillText(text, x, y);
      var scale = 1 / scalar;
      return {
        type: "bitmap",
        // TODO these probably need to be transfered for workers
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
      };
    }
    module2.exports = function() {
      return getDefaultFire().apply(this, arguments);
    };
    module2.exports.reset = function() {
      getDefaultFire().reset();
    };
    module2.exports.create = confettiCannon;
    module2.exports.shapeFromPath = shapeFromPath;
    module2.exports.shapeFromText = shapeFromText;
  })(function() {
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    return this || {};
  }(), module, false);
  var confetti_module_default = module.exports;
  var create = module.exports.create;

  // src/themes.js
  var THEMES = {
    arcade: {
      label: "Arcade",
      colors: ["#ff2e63", "#08d9d6", "#ffe600", "#7cff4f", "#b967ff"],
      shapes: ["square"],
      text: "#ffe600",
      stroke: "#1a1a2e",
      shadow1: "#ff2e63",
      shadow2: "#1a1a2e",
      scrim: null,
      wave: "square",
      patterns: ["volleys", "rain", "button"]
    },
    synthwave: {
      label: "Synthwave",
      colors: ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"],
      shapes: ["square"],
      text: "#fffb96",
      stroke: "#2b0a4d",
      shadow1: "#ff71ce",
      shadow2: "#01cdfe",
      scrim: "rgba(43,10,77,.35)",
      wave: "sawtooth",
      patterns: ["rain", "volleys", "button"]
    },
    gameboy: {
      label: "Game Boy",
      colors: ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"],
      shapes: ["square"],
      text: "#9bbc0f",
      stroke: "#0f380f",
      shadow1: "#306230",
      shadow2: "#0f380f",
      scrim: "rgba(15,56,15,.45)",
      wave: "square",
      patterns: ["button", "rain", "volleys"]
    },
    casino: {
      label: "Neon Casino",
      colors: ["#ffd700", "#ff1744", "#ffffff", "#00e676"],
      shapes: ["circle"],
      text: "#ffd700",
      stroke: "#4a0010",
      shadow1: "#ff1744",
      shadow2: "#4a0010",
      scrim: "rgba(74,0,16,.3)",
      wave: "triangle",
      patterns: ["button", "volleys", "rain"]
    }
  };
  var JACKPOT_COLORS = ["#ffd700", "#fff3b0", "#ffb300", "#ffffff"];

  // src/settings.js
  var DEFAULTS = {
    enabled: true,
    theme: "arcade",
    // arcade | synthwave | gameboy | casino | random
    sound: true,
    volume: 0.5,
    // 0..1
    quietHours: false,
    // mute sound during these hours
    quietStart: 22,
    quietEnd: 8,
    dailyGoal: 10
  };
  async function getSettings() {
    const s = await chrome.storage.sync.get(DEFAULTS);
    s.dailyGoal = Math.max(1, Math.floor(Number(s.dailyGoal)) || 10);
    s.volume = Math.min(1, Math.max(0, Number(s.volume)));
    return s;
  }
  function isQuiet(settings, hour) {
    if (!settings.quietHours) return false;
    const { quietStart: a, quietEnd: b } = settings;
    return a > b ? hour >= a || hour < b : hour >= a && hour < b;
  }

  // src/sound.js
  var BASE_GAIN = 0.12;
  var C5 = 523.25;
  var E5 = 659.25;
  var G5 = 783.99;
  var C6 = 1046.5;
  var E6 = 1318.51;
  var G6 = 1567.98;
  var ctx = null;
  async function getCtx() {
    ctx = ctx || new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    return ctx;
  }
  function note(c, out, freq, start, dur, wave) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(out, start + 5e-3);
    g.gain.exponentialRampToValueAtTime(1e-4, start + dur);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }
  function slide(c, out, from, to, start, dur, wave) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    g.gain.setValueAtTime(out, start);
    g.gain.exponentialRampToValueAtTime(1e-4, start + dur + 0.05);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + dur + 0.08);
  }
  var VARIANTS = {
    coin(c, out, t, w, p) {
      note(c, out, 987.77 * p, t, 0.08, w);
      note(c, out, E6 * p, t + 0.08, 0.4, w);
    },
    powerup(c, out, t, w, p) {
      slide(c, out, 300 * p, 1200 * p, t, 0.28, w);
      note(c, out, C6 * p, t + 0.3, 0.3, w);
    },
    fanfare(c, out, t, w, p) {
      [C5, E5, G5, C6, E6].forEach((f, i) => note(c, out, f * p, t + i * 0.07, 0.12, w));
      const end = t + 0.35;
      [C6, E6, G6].forEach((f) => note(c, out, f * p, end, 0.5, w));
    },
    levelup(c, out, t, w, p) {
      [C5, E5, G5, C6, G5, C6, E6, G6].forEach((f, i) => note(c, out, f * p, t + i * 0.09, 0.14, w));
      const end = t + 0.8;
      [C6, E6, G6].forEach((f) => note(c, out, f * p, end, 0.8, w));
    },
    jackpot(c, out, t, w, p) {
      for (let r = 0; r < 3; r++) {
        [C6, E6, G6, E6].forEach((f, i) => note(c, out, f * p, t + r * 0.32 + i * 0.07, 0.1, w));
      }
      const end = t + 1;
      [C6, E6, G6, 2093].forEach((f) => note(c, out, f * p, end, 1.1, w));
    }
  };
  function chooseVariant(ev) {
    if (ev.jackpot) return "jackpot";
    if (ev.leveledUp || ev.goalReached) return "levelup";
    const pool = ["coin", "powerup", "fanfare"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function allowed(settings, hour) {
    return settings.sound && !isQuiet(settings, hour);
  }
  async function playBlip(settings) {
    try {
      if (!allowed(settings, (/* @__PURE__ */ new Date()).getHours())) return;
      const c = await getCtx();
      note(c, BASE_GAIN * settings.volume, 880, c.currentTime + 0.01, 0.05, "square");
    } catch {
    }
  }
  async function playCelebrationSound(ev, settings, theme) {
    try {
      if (!allowed(settings, ev.hour)) return;
      const c = await getCtx();
      const night = ev.hour >= 20 || ev.hour < 5;
      const out = BASE_GAIN * settings.volume * (night ? 0.7 : 1);
      const pitch = 2 ** (Math.min(ev.combo - 1, 6) * 2 / 12);
      VARIANTS[chooseVariant(ev)](c, out, c.currentTime + 0.02, theme.wave, pitch);
    } catch {
    }
  }

  // src/effect.js
  var FONT_STACK = '"Press Start 2P","Courier New",ui-monospace,Menlo,monospace';
  var fontReady = null;
  function loadFont() {
    if (!fontReady) {
      const face = new FontFace(
        "Press Start 2P",
        `url(${chrome.runtime.getURL("fonts/press-start-2p.woff2")})`
      );
      fontReady = face.load().then((f) => document.fonts.add(f)).catch(() => {
      });
    }
    return fontReady;
  }
  var rand = (a, b) => a + Math.random() * (b - a);
  var pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  var base = (o) => ({ scalar: 1.3, shapes: o.theme.shapes, colors: o.colors, flat: true });
  var PATTERNS = {
    // Pixels shot from both bottom corners.
    volleys(fire, o) {
      const shot = (x, angle) => fire({
        ...base(o),
        particleCount: Math.round(28 * o.scale),
        angle,
        spread: 70,
        startVelocity: 55,
        gravity: 1.3,
        ticks: 90,
        origin: { x, y: 0.75 }
      });
      return [0, 400, 800].flatMap((t) => [[t, () => shot(0, 60)], [t, () => shot(1, 120)]]);
    },
    // Pixel rain from the top edge.
    rain(fire, o) {
      return [0, 200, 400, 600, 800].map((t) => [t, () => fire({
        ...base(o),
        particleCount: Math.round(24 * o.scale),
        angle: 270,
        spread: 140,
        startVelocity: 20,
        gravity: 0.9,
        ticks: 120,
        origin: { x: rand(0.1, 0.9), y: 0 }
      })]);
    },
    // Burst from where the compose window's send button was, plus a ring.
    button(fire, o) {
      const up = () => fire({
        ...base(o),
        particleCount: Math.round(35 * o.scale),
        angle: 90,
        spread: 80,
        startVelocity: 60,
        gravity: 1.2,
        ticks: 100,
        origin: o.origin
      });
      const ring = () => fire({
        ...base(o),
        particleCount: Math.round(30 * o.scale),
        spread: 360,
        startVelocity: 30,
        gravity: 0.6,
        ticks: 70,
        origin: o.origin
      });
      return [[0, up], [150, ring], [350, up]];
    }
  };
  function css(theme, duration) {
    const blinkAt = Math.max(1200, duration - 700);
    return `
@keyframes gsc-pop { 0%{transform:scale(0) rotate(-4deg)} 60%{transform:scale(1.25) rotate(-4deg)} 100%{transform:scale(1) rotate(-4deg)} }
@keyframes gsc-blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes gsc-rise { 0%{transform:translateY(0);opacity:0} 20%{opacity:1} 100%{transform:translateY(-70px);opacity:0} }
@keyframes gsc-drop { 0%{transform:translateY(-120%)} 100%{transform:translateY(0)} }
@keyframes gsc-fade { from{opacity:0} to{opacity:1} }
#gsc-content { animation: gsc-blink 160ms steps(1,end) ${blinkAt}ms 3; }
#gsc-msg { animation: gsc-pop 350ms steps(6,end) both; }
.gsc-float { animation: gsc-rise 1200ms steps(8,end) 350ms both; }
.gsc-badge { animation: gsc-drop 400ms steps(5,end) 500ms both; }
#gsc-scrim { animation: gsc-fade 200ms steps(3,end) both; }`;
  }
  var textStyle = (theme, px) => `font:400 ${px}px/1.2 ${FONT_STACK};color:${theme.text};text-transform:uppercase;text-shadow:2px 2px 0 ${theme.shadow2};text-align:center;`;
  var cancelCurrent = null;
  function celebrate(ev, settings, theme, origin) {
    if (cancelCurrent) cancelCurrent();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const night = ev.hour >= 20 || ev.hour < 5;
    const duration = ev.jackpot ? 4200 : ev.leveledUp || ev.goalReached ? 3400 : ev.combo >= 3 ? 3e3 : 2500;
    const o = {
      theme,
      colors: ev.jackpot ? JACKPOT_COLORS : theme.colors,
      scale: (night ? 0.6 : 1) * (ev.jackpot ? 1.6 : ev.leveledUp ? 1.3 : 1),
      origin: origin || { x: 0.5, y: 0.85 }
    };
    const root = document.createElement("div");
    root.id = "gsc-root";
    root.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;display:flex;align-items:center;justify-content:center;";
    if (!reduceMotion) {
      const style = document.createElement("style");
      style.textContent = css(theme, duration);
      root.appendChild(style);
    }
    if (theme.scrim) {
      const scrim = document.createElement("div");
      scrim.id = "gsc-scrim";
      scrim.style.cssText = `position:absolute;inset:0;background:${theme.scrim};`;
      root.appendChild(scrim);
    }
    let fire = null;
    if (!reduceMotion) {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
      root.appendChild(canvas);
      fire = confetti_module_default.create(canvas, { resize: true, useWorker: false });
    }
    const content = document.createElement("div");
    content.id = "gsc-content";
    content.setAttribute("role", "status");
    content.setAttribute("aria-live", "polite");
    content.style.cssText = "position:relative;display:flex;flex-direction:column;align-items:center;gap:18px;padding:0 5vw;";
    const msg = document.createElement("div");
    msg.id = "gsc-msg";
    const maxPx = ev.jackpot ? 52 : 44;
    const px = Math.max(16, Math.min(maxPx, Math.floor(window.innerWidth * 0.88 / (ev.message.length * 1.1))));
    msg.style.cssText = `font:400 ${px}px/1.1 ${FONT_STACK};text-transform:uppercase;letter-spacing:${Math.round(px / 11)}px;color:${theme.text};transform:rotate(-4deg);text-align:center;-webkit-text-stroke:2px ${theme.stroke};text-shadow:4px 4px 0 ${theme.shadow1},8px 8px 0 ${theme.shadow2};`;
    const subPx = window.innerWidth < 520 ? 10 : 14;
    const line = document.createElement("div");
    line.style.cssText = textStyle(theme, subPx);
    const lvl = document.createElement("div");
    lvl.style.cssText = textStyle(theme, subPx);
    const goalLabel = document.createElement("div");
    goalLabel.style.cssText = textStyle(theme, Math.max(8, subPx - 4));
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;gap:3px;";
    const filled = Math.round(Math.min(ev.today, ev.goal) / ev.goal * 10);
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement("div");
      cell.style.cssText = `width:14px;height:14px;border:2px solid ${theme.stroke};background:${i < filled ? theme.text : "transparent"};`;
      bar.appendChild(cell);
    }
    const float = document.createElement("div");
    float.className = "gsc-float";
    float.style.cssText = textStyle(theme, subPx + 6) + "position:absolute;top:-34px;right:5vw;";
    content.append(msg, line, lvl, goalLabel, bar, float);
    root.appendChild(content);
    if (ev.newBadges.length) {
      const stack = document.createElement("div");
      stack.style.cssText = "position:absolute;top:16px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px;";
      ev.newBadges.forEach((b) => {
        const el = document.createElement("div");
        el.className = "gsc-badge";
        el.style.cssText = textStyle(theme, subPx) + `background:${theme.stroke};border:3px solid ${theme.text};padding:10px 16px;`;
        el.textContent = `BADGE UNLOCKED: ${b.name}`;
        stack.appendChild(el);
      });
      root.appendChild(stack);
    }
    document.body.appendChild(root);
    requestAnimationFrame(() => {
      msg.textContent = ev.message;
      line.textContent = `SCORE ${ev.score}`;
      lvl.textContent = ev.leveledUp ? `LEVEL ${ev.level.level}: ${ev.level.name}` : `LVL ${ev.level.level} ${ev.level.name}`;
      goalLabel.textContent = ev.goalReached ? `DAILY GOAL DONE ${ev.today}/${ev.goal}` : `TODAY ${ev.today}/${ev.goal}`;
      float.textContent = `+${ev.points}`;
    });
    playCelebrationSound(ev, settings, theme);
    const timers = [];
    if (fire) {
      const names = ev.jackpot ? Object.keys(PATTERNS) : [pick(theme.patterns)];
      if (ev.leveledUp || ev.goalReached) names.push(pick(theme.patterns));
      names.forEach((n, i) => {
        PATTERNS[n](fire, o).forEach(([delay, fn]) => timers.push(setTimeout(fn, delay + i * 500)));
      });
    }
    const cleanup = () => {
      timers.forEach(clearTimeout);
      clearTimeout(endTimer);
      if (fire) fire.reset();
      root.remove();
      if (cancelCurrent === cleanup) cancelCurrent = null;
    };
    const endTimer = setTimeout(cleanup, duration);
    cancelCurrent = cleanup;
  }
  function resolveTheme(settings) {
    const keys = Object.keys(THEMES);
    const key = settings.theme === "random" ? pick(keys) : THEMES[settings.theme] ? settings.theme : "arcade";
    return { key, ...THEMES[key] };
  }

  // src/game.js
  var COMBO_WINDOW_MS = 2 * 60 * 1e3;
  var JACKPOT_CHANCE = 0.02;
  var LEVELS = [
    { name: "ROOKIE", at: 0 },
    { name: "MAIL RUNNER", at: 10 },
    { name: "INBOX NINJA", at: 50 },
    { name: "SEND MASTER", at: 100 },
    { name: "MAIL LEGEND", at: 250 },
    { name: "INBOX OVERLORD", at: 500 }
  ];
  var BADGES = [
    { id: "first_send", name: "FIRST SEND", desc: "Send your first mail", test: (c) => c.stats.total === 1 },
    { id: "early_bird", name: "EARLY BIRD", desc: "Send a mail between 4 and 8 AM", test: (c) => c.hour >= 4 && c.hour < 8 },
    { id: "night_owl", name: "NIGHT OWL", desc: "Send a mail between 10 PM and 4 AM", test: (c) => c.hour >= 22 || c.hour < 4 },
    { id: "ten_a_day", name: "TEN A DAY", desc: "Send 10 mails in one day", test: (c) => c.stats.today >= 10 },
    { id: "combo_5", name: "COMBO x5", desc: "Chain 5 sends within 2 minutes each", test: (c) => c.stats.combo >= 5 },
    { id: "century", name: "CENTURY", desc: "Send 100 mails", test: (c) => c.stats.total >= 100 },
    { id: "jackpot", name: "LUCKY STRIKE", desc: "Hit a jackpot", test: (c) => c.jackpot }
  ];
  function levelFor(total) {
    let index = 0;
    LEVELS.forEach((l, i) => {
      if (total >= l.at) index = i;
    });
    return { index, level: index + 1, name: LEVELS[index].name, next: LEVELS[index + 1] || null };
  }
  function dayKey(d = /* @__PURE__ */ new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  var emptyStats = () => ({
    total: 0,
    score: 0,
    bestCombo: 0,
    combo: 0,
    lastSendAt: 0,
    day: dayKey(),
    today: 0,
    goalDay: "",
    lastMessage: "",
    badges: {}
  });
  async function getStats() {
    const { stats } = await chrome.storage.local.get("stats");
    return { ...emptyStats(), ...stats || {} };
  }
  var pick2 = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function pickMessage(ev, last = "") {
    if (ev.jackpot) return "JACKPOT!!!";
    if (ev.leveledUp) return "LEVEL UP!";
    if (ev.goalReached) return "MISSION COMPLETE!";
    if (ev.combo >= 2) return `COMBO x${ev.combo}!`;
    const { today, goal, hour } = ev;
    const progress = [];
    if (today === 1) progress.push(hour >= 5 && hour < 11 ? "GOOD MORNING, CHAMP" : "FIRST SEND OF THE DAY");
    if (goal >= 4 && today === Math.ceil(goal / 2)) progress.push("HALFWAY THERE!");
    if (goal >= 3 && today === goal - 1) progress.push("ONE TO GO!");
    if (progress.length) return progress[0];
    const pool = today > goal ? ["BONUS ROUND!", "OVERTIME!", "GG"] : [];
    if (hour >= 22 || hour < 4) pool.push("NIGHT SHIFT!");
    else if (hour >= 18) pool.push("ONE MORE DOWN", "WRAPPING UP!");
    else if (hour >= 5 && hour < 11) pool.push("NICE SEND!", "EARLY BIRD MODE");
    pool.push("NICE SEND!", "GG", "ONE MORE DOWN");
    const fresh = pool.filter((m) => m !== last);
    return pick2(fresh.length ? fresh : pool);
  }
  async function recordSend(settings, now = /* @__PURE__ */ new Date()) {
    const s = await getStats();
    const t = now.getTime();
    const key = dayKey(now);
    if (s.day !== key) {
      s.day = key;
      s.today = 0;
    }
    const levelBefore = levelFor(s.total).index;
    s.combo = s.lastSendAt && t - s.lastSendAt <= COMBO_WINDOW_MS ? s.combo + 1 : 1;
    s.lastSendAt = t;
    s.total += 1;
    s.today += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const multiplier = Math.min(s.combo, 5);
    const points = 100 * multiplier;
    s.score += points;
    const lvl = levelFor(s.total);
    const goal = settings.dailyGoal;
    const goalReached = s.today === goal && s.goalDay !== key;
    if (goalReached) s.goalDay = key;
    const jackpot = Math.random() < JACKPOT_CHANCE;
    const hour = now.getHours();
    const newBadges = BADGES.filter((b) => !s.badges[b.id] && b.test({ stats: s, hour, jackpot }));
    newBadges.forEach((b) => {
      s.badges[b.id] = t;
    });
    const ev = {
      points,
      multiplier,
      combo: s.combo,
      score: s.score,
      total: s.total,
      today: s.today,
      goal,
      level: lvl,
      leveledUp: lvl.index > levelBefore,
      goalReached,
      jackpot,
      newBadges,
      hour
    };
    ev.message = pickMessage(ev, s.lastMessage);
    s.lastMessage = ev.message;
    await chrome.storage.local.set({ stats: s });
    return ev;
  }

  // src/content.js
  loadFont();
  var queue = Promise.resolve();
  function onSent(origin) {
    queue = queue.then(async () => {
      const settings = await getSettings();
      if (!settings.enabled) return;
      const ev = await recordSend(settings);
      celebrate(ev, settings, resolveTheme(settings), origin);
    }).catch(() => {
    });
  }
  watchSends({
    onTrigger: () => getSettings().then((s) => s.enabled && playBlip(s)).catch(() => {
    }),
    onSent
  });
})();
