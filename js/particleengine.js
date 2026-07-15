function random(min, max) { return Math.random() * (max - min) + min; }
function degtorad(deg) { return deg * Math.PI / 180; }
const pi = Math.PI;
const HALF_PI = Math.PI / 2;
const WORLD_TILE_SIZE = 16;
const PARTICLE_DEBUG = false;
const MAX_FRAME_DELTA = 1 / 30;
const RESUME_DELTA_LIMIT = 0.25;
const GIF_MIN_FRAME_DELAY = 1000 / 30;
const GRAAL_TICK_DELTA = 1 / 20;
function debugLog(...args) { if (PARTICLE_DEBUG) console.log(...args); }

function normalizeParticleOptions(options = {}) {
  return {
    assetBaseUrl: options.assetBaseUrl || "images/",
    x: options.x ?? options.ownerX ?? options.thiso?.x ?? 24,
    y: options.y ?? options.ownerY ?? options.thiso?.y ?? 24,
    env: options.env || {},
    thiso: options.thiso || null
  };
}

function particleAssetUrl(baseUrl, filename) {
  return `${baseUrl.replace(/\/?$/, "/")}${filename}`;
}

function normalizeAngle(angle) {
  return angle - Math.floor(angle / (Math.PI * 2)) * Math.PI * 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function particleByte(value) {
  return Math.round(Math.max(0, value) * 255) & 255;
}

function particleUnit(value) {
  return particleByte(value) / 255;
}

function particleCompositeOperation(mode, alpha) {
  if (mode > 0 && mode < 1) return "lighter";
  if (mode === 0) return alpha > 0 ? "lighter" : "source-over";
  if (mode === 1) return "source-over";
  if (mode === 2) return "multiply";
  if (mode === 3) return "lighter";
  return "source-over";
}

const particleTintCache = new WeakMap();

function lzwDecode(minCodeSize, data, expectedSize) {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let bit = 0;
  let codeSize = minCodeSize + 1;
  let dict = [];
  let prev = null;
  const out = [];
  function reset() {
    dict = [];
    for (let i = 0; i < clearCode; i++) dict[i] = [i];
    dict[clearCode] = [];
    dict[endCode] = null;
    codeSize = minCodeSize + 1;
    prev = null;
  }
  function readCode(size) {
    let code = 0;
    for (let i = 0; i < size; i++) {
      if (data[bit >> 3] & (1 << (bit & 7))) code |= 1 << i;
      bit++;
    }
    return code;
  }
  reset();
  while (bit < data.length * 8 && out.length < expectedSize) {
    const code = readCode(codeSize);
    if (code === clearCode) {
      reset();
      continue;
    }
    if (code === endCode) break;
    let entry;
    if (dict[code]) entry = dict[code].slice();
    else if (code === dict.length && prev) entry = prev.concat(prev[0]);
    else break;
    out.push(...entry);
    if (prev) {
      dict.push(prev.concat(entry[0]));
      if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    prev = entry;
  }
  return out.slice(0, expectedSize);
}

function deinterlaceGifPixels(pixels, width) {
  const rows = pixels.length / width;
  const out = new Array(pixels.length);
  const passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
  let from = 0;
  for (const [start, step] of passes) {
    for (let y = start; y < rows; y += step) {
      for (let x = 0; x < width; x++) out[y * width + x] = pixels[from++];
    }
  }
  return out;
}

function readGifColorTable(bytes, state, count) {
  const colors = [];
  for (let i = 0; i < count; i++) colors.push([bytes[state.pos++], bytes[state.pos++], bytes[state.pos++]]);
  return colors;
}

function readGifSubBlocks(bytes, state) {
  const blocks = [];
  let total = 0;
  while (state.pos < bytes.length) {
    const size = bytes[state.pos++];
    if (size === 0) break;
    blocks.push(bytes.slice(state.pos, state.pos + size));
    state.pos += size;
    total += size;
  }
  const data = new Uint8Array(total);
  let offset = 0;
  for (const block of blocks) {
    data.set(block, offset);
    offset += block.length;
  }
  return data;
}

function decodeGif(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const state = {pos: 0};
  const readU16 = () => bytes[state.pos++] | (bytes[state.pos++] << 8);
  state.pos += 6;
  const width = readU16();
  const height = readU16();
  const packed = bytes[state.pos++];
  state.pos++;
  state.pos++;
  const globalColorTable = (packed & 0x80) ? readGifColorTable(bytes, state, 1 << ((packed & 7) + 1)) : null;
  const frames = [];
  let gce = {disposal: 0, delay: 100, transparentIndex: null};
  while (state.pos < bytes.length) {
    const marker = bytes[state.pos++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[state.pos++];
      if (label === 0xf9) {
        state.pos++;
        const flags = bytes[state.pos++];
        const delay = readU16() * 10;
        const transparentIndex = bytes[state.pos++];
        state.pos++;
        gce = {disposal: (flags >> 2) & 7, delay: delay || 100, transparentIndex: (flags & 1) ? transparentIndex : null};
      } else {
        readGifSubBlocks(bytes, state);
      }
      continue;
    }
    if (marker !== 0x2c) break;
    const x = readU16();
    const y = readU16();
    const frameWidth = readU16();
    const frameHeight = readU16();
    const imagePacked = bytes[state.pos++];
    const localColorTable = (imagePacked & 0x80) ? readGifColorTable(bytes, state, 1 << ((imagePacked & 7) + 1)) : null;
    const lzwMin = bytes[state.pos++];
    const compressed = readGifSubBlocks(bytes, state);
    let pixels = lzwDecode(lzwMin, compressed, frameWidth * frameHeight);
    if (imagePacked & 0x40) pixels = deinterlaceGifPixels(pixels, frameWidth);
    frames.push({x, y, width: frameWidth, height: frameHeight, pixels, colorTable: localColorTable || globalColorTable, disposal: gce.disposal, delay: gce.delay, transparentIndex: gce.transparentIndex});
    gce = {disposal: 0, delay: 100, transparentIndex: null};
  }
  const composite = new Uint8ClampedArray(width * height * 4);
  let elapsed = 0;
  let previousFrame = null;
  const rendered = frames.map(frame => {
    if (previousFrame && previousFrame.transparentIndex !== null && previousFrame.disposal < 2) {
      for (let py = 0; py < previousFrame.height; py++) {
        for (let px = 0; px < previousFrame.width; px++) {
          const target = ((previousFrame.y + py) * width + previousFrame.x + px) * 4;
          composite[target] = 0;
          composite[target + 1] = 0;
          composite[target + 2] = 0;
          composite[target + 3] = 0;
        }
      }
    }
    const restore = frame.disposal === 3 ? new Uint8ClampedArray(composite) : null;
    for (let py = 0; py < frame.height; py++) {
      for (let px = 0; px < frame.width; px++) {
        const index = frame.pixels[py * frame.width + px];
        if (index === frame.transparentIndex) continue;
        const color = frame.colorTable && frame.colorTable[index];
        if (!color) continue;
        const brightness = Math.max(color[0], color[1], color[2]);
        if (brightness < 24) continue;
        const whiten = clamp((brightness - 80) / 175, 0, 0.65);
        const target = ((frame.y + py) * width + frame.x + px) * 4;
        composite[target] = Math.round(color[0] + (255 - color[0]) * whiten);
        composite[target + 1] = Math.round(color[1] + (255 - color[1]) * whiten);
        composite[target + 2] = Math.round(color[2] + (255 - color[2]) * whiten);
        composite[target + 3] = Math.round(Math.pow(clamp((brightness - 32) / 160, 0, 1), 1.35) * 255);
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(composite), width, height), 0, 0);
    const delay = Math.max(GIF_MIN_FRAME_DELAY, frame.delay || 100);
    elapsed += delay;
    if (frame.disposal === 2) {
      for (let py = 0; py < frame.height; py++) {
        for (let px = 0; px < frame.width; px++) {
          const target = ((frame.y + py) * width + frame.x + px) * 4;
          composite[target] = 0;
          composite[target + 1] = 0;
          composite[target + 2] = 0;
          composite[target + 3] = 0;
        }
      }
    } else if (frame.disposal === 3 && restore) {
      composite.set(restore);
    }
    previousFrame = frame;
    return {canvas, delay, end: elapsed};
  });
  return {animated: true, width, height, frames: rendered, duration: elapsed || 100};
}

function getGifFrame(image) {
  if (!image?.frames?.length) return null;
  const t = performance.now() % image.duration;
  return (image.frames.find(frame => t < frame.end) || image.frames[image.frames.length - 1])?.canvas || null;
}

function getTintedSource(source, r, g, b, fastColor) {
  const red = fastColor ? particleByte(r) : Math.round(clamp(r, 0, 1) * 255);
  const green = fastColor ? particleByte(g) : Math.round(clamp(g, 0, 1) * 255);
  const blue = fastColor ? particleByte(b) : Math.round(clamp(b, 0, 1) * 255);
  const key = `${fastColor ? "f" : "s"}:${red},${green},${blue}`;
  let cache = particleTintCache.get(source);
  if (!cache) {
    cache = new Map();
    particleTintCache.set(source, cache);
  }
  if (cache.has(key)) return cache.get(key);
  const width = source.naturalWidth || source.width || 0;
  const height = source.naturalHeight || source.height || 0;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const tintCtx = canvas.getContext("2d");
  tintCtx.drawImage(source, 0, 0, width, height);
  const imageData = tintCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.round(pixels[i] * red / 255);
    pixels[i + 1] = Math.round(pixels[i + 1] * green / 255);
    pixels[i + 2] = Math.round(pixels[i + 2] * blue / 255);
  }
  tintCtx.putImageData(imageData, 0, 0);
  cache.set(key, canvas);
  return canvas;
}


function getParticleImageSource(image) {
  if (image && image.animated) return getGifFrame(image);
  return image;
}

function getParticleImageWidth(image, source) {
  return image && image.animated ? image.width : source?.naturalWidth || source?.width || source?.offsetWidth || 0;
}

function getParticleImageHeight(image, source) {
  return image && image.animated ? image.height : source?.naturalHeight || source?.height || source?.offsetHeight || 0;
}

function isTintedParticle(particle) {
  return particle.r !== 1 || particle.g !== 1 || particle.b !== 1;
}

function resolveTintedParticleSource(particle, source, fastColor) {
  return isTintedParticle(particle) ? getTintedSource(source, particle.r, particle.g, particle.b, fastColor) : source;
}

function drawStaticImage(ctx, item, img) {
  if (!img || item.hidden) return;
  const source = getParticleImageSource(img);
  const width = getParticleImageWidth(img, source);
  const height = getParticleImageHeight(img, source);
  if (!source || width === 0 || height === 0 || item.a <= 0) return;
  const drawSource = getTintedSource(source, item.r, item.g, item.b, false);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(item.x * WORLD_TILE_SIZE - width * (item.zoom - 1) * 0.5, item.y * WORLD_TILE_SIZE - height * (item.zoom - 1) * 0.5);
  ctx.scale(item.zoom, item.zoom);
  ctx.globalAlpha = clamp(item.a, 0, 1);
  ctx.globalCompositeOperation = particleCompositeOperation(item.mode, item.a);
  ctx.drawImage(drawSource, 0, 0);
  ctx.restore();
}

class Particle {
  constructor(template) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.lifetime = template.lifetime || 1;
    this.age = 0;
    this.r = template.red !== undefined ? template.red : 1;
    this.g = template.green !== undefined ? template.green : 1;
    this.b = template.blue !== undefined ? template.blue : 1;
    this.a = template.alpha !== undefined ? template.alpha : 1;
    this.zoom = template.zoom !== undefined ? template.zoom : 1;
    this.angle = template.angle !== undefined ? template.angle : 0;
    this.rotation = template.rotation !== undefined ? template.rotation : 0;
    this.spin = template.spin !== undefined ? template.spin : 0;
    this.stretchx = template.stretchx !== undefined ? template.stretchx : 1;
    this.stretchy = template.stretchy !== undefined ? template.stretchy : 1;
    this.image = template.image || "";
    this.mode = template.mode !== undefined ? template.mode : 0;
    this.speed = template.speed || 0;
    this.zangle = template.zangle !== undefined ? template.zangle : 0;
    this.movex = template.movex;
    this.movey = template.movey;
    this.movez = template.movez;
    this.offset = template.offset || template.attachoffset || {x: 0, y: 0, z: 0};
    this.updateVelocity();
    if (template.movex !== undefined || template.movey !== undefined || template.movez !== undefined) {
      this.setMovementVector(
        template.movex !== undefined ? template.movex : this.vx,
        template.movey !== undefined ? template.movey : this.vy,
        template.movez !== undefined ? template.movez : this.vz
      );
    }
    this.modifiers = [];
    this.dropemitter = null;
    this.dropwateremitter = null;
  }
  update(deltaTime, movementScale = 1) {
    this.age += deltaTime;
    if (this.age >= this.lifetime) return false;
    this.x += this.vx * deltaTime * movementScale;
    this.y += this.vy * deltaTime * movementScale;
    this.z += this.vz * deltaTime * movementScale;
    if (this.spin) this.rotation += this.spin * deltaTime;
    return true;
  }
  applyModifier(mod, age, deltaTime) {
    let value;
    if (mod.type === "range" && age !== undefined) {
      if (age < mod.minTime || age > mod.maxTime) {
        if (mod.attribute === "alpha" && this.age < 0.1) {
          debugLog(`Range modifier applied outside range: age=${age}, minTime=${mod.minTime}, maxTime=${mod.maxTime}`);
        }
        return;
      }
      const t = Math.max(0, Math.min(1, (age - mod.minTime) / (mod.maxTime - mod.minTime)));
      const interpolatedVal = mod.minVal + (mod.maxVal - mod.minVal) * t;
      if (mod.operation === "replace") {
        value = interpolatedVal;
      } else if (mod.operation === "add") {
        const current = this.getAttribute(mod.attribute);
        const deltaValue = interpolatedVal * (deltaTime || 0.016);
        value = current + deltaValue;
      } else if (mod.operation === "multiply") {
        const current = this.getAttribute(mod.attribute);
        value = current * interpolatedVal;
      } else {
        value = interpolatedVal;
      }
      if (mod.attribute === "alpha" && this.age < 0.1) {
        debugLog(`Range modifier alpha: age=${age}, minTime=${mod.minTime}, maxTime=${mod.maxTime}, minVal=${mod.minVal}, maxVal=${mod.maxVal}, t=${t}, interpolated=${interpolatedVal}, final=${value}`);
      }
    } else if (mod.type === "impulse") {
      value = random(mod.minVal, mod.maxVal);
      if (mod.operation === "multiply") {
        const current = this.getAttribute(mod.attribute);
        value = current * value;
      } else if (mod.operation === "add") {
        const current = this.getAttribute(mod.attribute);
        value = current + value;
      } else if (mod.operation === "replace") {
        value = random(mod.minVal, mod.maxVal);
      }
    } else {
      value = random(mod.minVal, mod.maxVal);
      if (mod.operation === "multiply") {
        const current = this.getAttribute(mod.attribute);
        value = current * value;
      } else if (mod.operation === "add") {
        const current = this.getAttribute(mod.attribute);
        value = current + value;
      } else if (mod.operation === "replace") {
        value = random(mod.minVal, mod.maxVal);
      }
    }
    const oldValue = this.getAttribute(mod.attribute);
    this.setAttribute(mod.attribute, value);
    if (mod.attribute === "alpha" && this.age < 0.1 && Math.abs(oldValue - value) > 0.01) {
      debugLog(`Alpha changed: ${oldValue} -> ${value} (mod: ${mod.type}, op: ${mod.operation}, age=${this.age})`);
    }
  }
  applyZeroImpulse(mod) {
    if (!this.zeroImpulseSteps) this.zeroImpulseSteps = new Map();
    const step = Math.floor(this.age / MAX_FRAME_DELTA);
    if (this.zeroImpulseSteps.get(mod) === step) return;
    this.applyModifier(mod);
    this.zeroImpulseSteps.set(mod, step);
  }
  getAttribute(attr) {
    switch(attr) {
      case "x": return this.x;
      case "y": return this.y;
      case "z": return this.z;
      case "alpha": return this.a;
      case "zoom": return this.zoom;
      case "red": return this.r;
      case "green": return this.g;
      case "blue": return this.b;
      case "angle": return this.angle;
      case "zangle": return this.zangle;
      case "speed": return this.speed;
      case "stretchx": return this.stretchx;
      case "stretchy": return this.stretchy;
      case "rotation": return this.rotation;
      case "movez": return this.vz;
      case "movex": return this.vx;
      case "movey": return this.vy;
      default: return 0;
    }
  }
  setAttribute(attr, value) {
    switch(attr) {
      case "x": this.x = value; break;
      case "y": this.y = value; break;
      case "z": this.z = value; break;
      case "alpha": this.a = Math.max(0, value); break;
      case "zoom": this.zoom = Math.max(0, value); break;
      case "red": this.r = value; break;
      case "green": this.g = value; break;
      case "blue": this.b = value; break;
      case "angle": 
        this.angle = normalizeAngle(value);
        this.updateVelocity();
        break;
      case "speed": 
        this.setSpeed(value);
        break;
      case "stretchx": this.stretchx = value; break;
      case "stretchy": this.stretchy = value; break;
      case "rotation": this.rotation = value; break;
      case "movez": 
        this.setMovementVector(this.vx, this.vy, value);
        this.movez = value;
        break;
      case "movex": 
        this.setMovementVector(value, this.vy, this.vz);
        this.movex = value;
        break;
      case "movey": 
        this.setMovementVector(this.vx, value, this.vz);
        this.movey = value;
        break;
      case "zangle":
        this.zangle = clamp(value, -HALF_PI, HALF_PI);
        this.updateVelocity();
        break;
    }
  }
  setMovementVector(x, y, z) {
    this.vx = x;
    this.vy = y;
    this.vz = z;
    if (x === 0 && y === 0) {
      if (z > 0) this.zangle = HALF_PI;
      else if (z < 0) this.zangle = -HALF_PI;
    } else {
      this.angle = normalizeAngle(Math.atan2(-y, x));
    }
    const flat = Math.sqrt(x * x + y * y);
    if (flat !== 0 || z !== 0) this.zangle = Math.atan2(z, flat);
    this.speed = Math.sqrt(x * x + y * y + z * z);
  }
  setSpeed(speed) {
    speed = Math.max(0, speed);
    if (this.speed > 0) {
      const scale = speed / this.speed;
      this.vx *= scale;
      this.vy *= scale;
      this.vz *= scale;
    } else if (speed > 0) {
      this.speed = speed;
      this.updateVelocity();
      return;
    }
    this.speed = speed;
  }
  updateVelocity() {
    this.zangle = clamp(this.zangle, -HALF_PI, HALF_PI);
    this.vx = this.speed * Math.cos(this.angle) * Math.cos(this.zangle);
    this.vy = -this.speed * Math.sin(this.angle) * Math.cos(this.zangle);
    this.vz = this.speed * Math.sin(this.zangle);
  }
  draw(ctx, img, fastColor) {
    if (!img) {
      debugLog('Particle.draw: no image provided');
      return;
    }
    const source = getParticleImageSource(img);
    if (!source) return;
    const width = getParticleImageWidth(img, source);
    const height = getParticleImageHeight(img, source);
    if (width === 0 || height === 0) {
      debugLog('Particle.draw: invalid image dimensions', width, height);
      return;
    }
    if (this.a <= 0) return;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(this.x * WORLD_TILE_SIZE + width * 0.5, (this.y - this.z) * WORLD_TILE_SIZE + height * 0.5);
    ctx.rotate(this.rotation);
    ctx.scale(this.zoom * this.stretchx, this.zoom * this.stretchy);
    const drawSource = resolveTintedParticleSource(this, source, fastColor);
    const drawAlpha = fastColor ? particleUnit(this.a) : clamp(this.a, 0, 1);
    ctx.globalAlpha = drawAlpha;
    ctx.globalCompositeOperation = particleCompositeOperation(this.mode, this.a);
    ctx.drawImage(drawSource, -width/2, -height/2);
    ctx.restore();
  }
}

class Emitter {
  constructor(config) {
    this.delaymin = config.delaymin !== undefined ? config.delaymin : 1;
    this.delaymax = config.delaymax !== undefined ? config.delaymax : 1;
    this.nrofparticles = Math.max(0, Math.min(1000, config.nrofparticles !== undefined ? config.nrofparticles : 0));
    this.baseNrofParticles = this.nrofparticles;
    this.maxparticles = Math.max(0, Math.min(100000, config.maxparticles !== undefined ? config.maxparticles : 100000));
    this.particletypes = Math.max(1, Math.min(100, config.particletypes || 1));
    this.particles = config.particles || [];
    this.modifiers = config.modifiers || [];
    this.templateModifiers = config.templateModifiers || [];
    this.layer = config.layer !== undefined ? config.layer : 0;
    this.emitautomatically = config.emitautomatically !== false;
    this.emissionoffset = config.emissionoffset || {x: 0, y: 0, z: 0};
    this.particlelifetime = config.particlelifetime !== undefined ? config.particlelifetime : 1;
    this.movementfactor = config.movementfactor || 0;
    this.attachposition = !!config.attachposition;
    this.firstinfront = config.firstinfront !== false;
    this.checkbelowterrain = !!config.checkbelowterrain;
    this.forceaboveterrain = !!config.forceaboveterrain;
    this.emitatterrainheight = !!config.emitatterrainheight;
    this.autorotation = !!config.autorotation;
    this.clippingbox = config.clippingbox || null;
    this.wraptoclippingbox = !!config.wraptoclippingbox;
    this.cliptoscreen = !!config.cliptoscreen;
    this.noclipping = !!config.noclipping;
    this.lastEmitTime = 0;
    this.currentDelay = random(this.delaymin, this.delaymax);
    this.emissionRemainder = 0;
    this.activeParticles = [];
    this.x = config.x ?? 24;
    this.y = config.y ?? 24;
    this.dropemitter = config.dropemitter || null;
    this.dropwateremitter = config.dropwateremitter || null;
    this.dropemitters = [];
    this.canvasWidth = config.canvasWidth || 800;
    this.canvasHeight = config.canvasHeight || 600;
    this.templateTime = 0;
    this.updateEmitter = typeof config.updateEmitter === "function" ? config.updateEmitter : null;
  }
  processTemplateModifiers(deltaTime) {
    if (!this.templateModifiers.length) return;
    this.templateTime += deltaTime;
    for (const mod of this.templateModifiers) {
      if (mod.type === "once") {
        if (!mod.applied && ((mod.minTime === 0 && mod.maxTime === 0) || (this.templateTime >= mod.minTime && this.templateTime <= mod.maxTime))) {
          for (const template of this.particles) if (template && template.image) applyTemplateModifier(template, mod, this.templateTime, deltaTime);
          mod.applied = true;
        }
      } else if (mod.type === "range") {
        if (this.templateTime >= mod.minTime && this.templateTime <= mod.maxTime) for (const template of this.particles) if (template && template.image) applyTemplateModifier(template, mod, this.templateTime, deltaTime);
      } else if (mod.type === "impulse") {
        if (mod.nextTime === undefined) mod.nextTime = mod.minTime;
        if (this.templateTime >= mod.nextTime) {
          for (const template of this.particles) if (template && template.image) applyTemplateModifier(template, mod, this.templateTime, deltaTime);
          mod.nextTime = this.templateTime + Math.max(0, random(mod.minTime, mod.maxTime));
        }
      }
    }
  }
  applyClipping(p) {
    if (this.noclipping) return true;
    const box = this.clippingbox || (this.cliptoscreen ? {x: -this.x, y: -this.y, z: -1000000, right: this.canvasWidth / WORLD_TILE_SIZE - this.x, bottom: this.canvasHeight / WORLD_TILE_SIZE - this.y, top: 1000000} : null);
    if (!box) return true;
    if (p.z < box.z || p.z >= box.top) return false;
    const padX = Math.max(0.5, Math.abs(p.zoom * p.stretchx) * 0.5);
    const padY = Math.max(0.5, Math.abs(p.zoom * p.stretchy) * 0.5);
    if (p.x + padX >= box.x && p.x - padX < box.right && p.y + padY >= box.y && p.y - padY < box.bottom) return true;
    if (!this.wraptoclippingbox) return false;
    const width = box.right - box.x;
    const height = box.bottom - box.y;
    if (width <= 0 || height <= 0) return false;
    while (p.x < box.x) p.x += width;
    while (p.x >= box.right) p.x -= width;
    while (p.y < box.y) p.y += height;
    while (p.y >= box.bottom) p.y -= height;
    return true;
  }
  spawnDropEmitter(config, p) {
    const dropEmitter = new Emitter({
      ...config,
      x: p.x,
      y: p.y,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      emitautomatically: config.emitautomatically === true
    });
    dropEmitter.emit();
    this.dropemitters.push(dropEmitter);
  }
  emit(spreadTime = 0, emitCountOverride = null) {
    const requestedCount = Math.max(0, emitCountOverride ?? this.nrofparticles);
    if (requestedCount < 1 || this.maxparticles < 1) return;
    if (emitCountOverride !== null) {
      const overflow = this.activeParticles.length + requestedCount - this.maxparticles;
      if (overflow > 0) this.activeParticles.splice(-overflow, overflow);
    } else if (this.activeParticles.length >= this.maxparticles) return;
    const emitCount = Math.min(requestedCount, this.maxparticles - this.activeParticles.length);
    const templates = [];
    const templateLimit = Math.max(1, Math.min(this.particletypes, this.particles.length));
    for (let i = 0; i < templateLimit; i++) {
      if (this.particles[i] && this.particles[i].image) templates.push(this.particles[i]);
    }
    for (let i = 0; i < emitCount; i++) {
      const templateIndex = templates.length > 1 ? Math.floor(Math.random() * templates.length) : 0;
      const template = templates[templateIndex] || this.particles[0] || {};
      if (!template.image) {
        debugLog('Particle template', templateIndex, 'has no image, available templates:', this.particles.map((p, idx) => ({idx, image: p.image})));
        continue;
      }
      const p = new Particle(template);
      if (this.movementfactor === 0) {
        p.x = this.x + this.emissionoffset.x * this.particlelifetime;
        p.y = this.y + this.emissionoffset.y * this.particlelifetime;
        p.z = this.emissionoffset.z * this.particlelifetime;
      } else {
        const angle = Math.atan2(this.emissionoffset.y, this.emissionoffset.x) + this.movementfactor;
        const speed = Math.sqrt(this.emissionoffset.x * this.emissionoffset.x + this.emissionoffset.y * this.emissionoffset.y) * this.particlelifetime;
        p.x = this.x + Math.cos(angle) * speed;
        p.y = this.y + Math.sin(angle) * speed;
        p.z = this.emissionoffset.z * this.particlelifetime;
      }
      if (this.emitatterrainheight) p.z = 0;
      p.x += p.offset.x;
      p.y += p.offset.y;
      p.z += p.offset.z;
      if (template.movex === undefined && template.movey === undefined && template.movez === undefined) {
        p.updateVelocity();
      }
      if (this.dropemitter) {
        p.dropemitter = this.dropemitter;
      }
      if (this.dropwateremitter) {
        p.dropwateremitter = this.dropwateremitter;
      }
      for (const mod of this.modifiers) {
        if (mod.isGlobal) {
          // Global modifiers are applied from emitter, not copied to particle
          // But we still need to track them per-particle for "once" type
          if (mod.type === "once") {
            p.modifiers.push({...mod, applied: false});
          }
          // Other global modifiers are handled in update() from emitter.modifiers
        } else {
          // Local modifiers are copied to particle
          if (mod.type === "once") {
            p.modifiers.push({...mod, applied: false});
          } else {
            p.modifiers.push({...mod});
          }
        }
      }
      if (this.activeParticles.length === 0) {
        debugLog(`Emitter has ${this.modifiers.length} modifiers: ${this.modifiers.filter(m => m.isGlobal).length} global, ${this.modifiers.filter(m => !m.isGlobal).length} local`);
      }
      for (const mod of p.modifiers) {
        if (mod.type === "once" && mod.minTime === 0 && mod.maxTime === 0) {
          const oldValue = p.getAttribute(mod.attribute);
          p.applyModifier(mod);
          mod.applied = true;
          const newValue = p.getAttribute(mod.attribute);
          if (Math.abs(oldValue - newValue) > 0.01) {
            debugLog(`Once modifier (0,0) changed ${mod.attribute}: ${oldValue} -> ${newValue}, mod:`, mod);
            if (mod.attribute === "angle" || mod.attribute === "speed") {
              if (p.movex === undefined && p.movey === undefined) {
                p.updateVelocity();
                debugLog(`Updated velocity after ${mod.attribute} change: vx=${p.vx}, vy=${p.vy}`);
              }
            }
          }
        } else if (mod.type === "impulse" && mod.minTime === 0 && mod.maxTime === 0) {
          p.applyZeroImpulse(mod);
        }
      }
      if (spreadTime > 0 && emitCount > 1) {
        const preAge = Math.min(p.lifetime - 0.001, spreadTime * ((i + Math.random()) / emitCount));
        if (preAge > 0) p.update(preAge, this.particlelifetime);
      }
      this.activeParticles.unshift(p);
      if (this.activeParticles.length === 1) {
        debugLog(`Emitted first particle: image=${p.image}, x=${p.x}, y=${p.y}, alpha=${p.a}, lifetime=${p.lifetime}, speed=${p.speed}, angle=${p.angle}, vx=${p.vx}, vy=${p.vy}`);
        debugLog(`Particle modifiers (${p.modifiers.length}):`, p.modifiers.map(m => `${m.type}:${m.attribute}:${m.operation}:${m.isGlobal ? 'global' : 'local'}`));
        debugLog(`Emitter global modifiers (${this.modifiers.filter(m => m.isGlobal).length}):`, this.modifiers.filter(m => m.isGlobal).map(m => `${m.type}:${m.attribute}:${m.operation}:minTime=${m.minTime},maxTime=${m.maxTime}`));
        debugLog(`Emitter local modifiers (${this.modifiers.filter(m => !m.isGlobal).length}):`, this.modifiers.filter(m => !m.isGlobal).map(m => `${m.type}:${m.attribute}:${m.operation}:minTime=${m.minTime},maxTime=${m.maxTime}`));
      }
    }
  }
  update(deltaTime, currentTime) {
    if (this.updateEmitter) this.updateEmitter(this, currentTime);
    this.processTemplateModifiers(deltaTime);
    for (let i = this.dropemitters.length - 1; i >= 0; i--) {
      this.dropemitters[i].update(deltaTime, currentTime);
      if (this.dropemitters[i].activeParticles.length === 0 && !this.dropemitters[i].emitautomatically) {
        this.dropemitters.splice(i, 1);
      }
    }
    if (this.emitautomatically) {
      if (this.lastEmitTime === 0) {
        this.lastEmitTime = currentTime;
      } else if (this.currentDelay <= 0) {
        if (currentTime - this.lastEmitTime >= GRAAL_TICK_DELTA) {
          this.emit(0);
          this.lastEmitTime = currentTime;
        }
      } else if (this.currentDelay <= 0.05) {
        this.emissionRemainder += this.baseNrofParticles * deltaTime / Math.max(this.currentDelay, 0.001);
        const particlesPerFrame = Math.floor(this.emissionRemainder);
        if (particlesPerFrame > 0) {
          this.emissionRemainder -= particlesPerFrame;
          this.emit(deltaTime, particlesPerFrame);
        }
        this.lastEmitTime = currentTime;
      } else if (currentTime - this.lastEmitTime >= this.currentDelay) {
        this.emit(this.currentDelay <= 0.1 ? this.currentDelay : 0);
        this.lastEmitTime = currentTime;
        this.currentDelay = random(this.delaymin, this.delaymax);
      }
    }
    for (const mod of this.modifiers) {
      if (mod.isGlobal && mod.type === "impulse") {
        if (mod.nextGlobalTime === undefined) mod.nextGlobalTime = 0;
        mod.globalTriggered = currentTime >= mod.nextGlobalTime;
      }
    }
      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      if (p.age < 0.1 && p.a === 0) {
        debugLog(`Particle alpha is 0 at age ${p.age}, modifiers:`, p.modifiers.map(m => `${m.type}:${m.attribute}:${m.operation}`));
      }
      
      const nextZ = p.z + p.vz * deltaTime;
      const hitTerrain = this.checkbelowterrain && p.z > 0 && nextZ <= 0;
      if ((p.dropemitter || p.dropwateremitter) && hitTerrain && p.age < p.lifetime) {
        p.z = 0;
        this.spawnDropEmitter(p.dropwateremitter || p.dropemitter, p);
        this.activeParticles.splice(i, 1);
        i--;
        continue;
      }
      
      const particleAge = p.age + deltaTime;
      if (particleAge >= p.lifetime) {
        this.activeParticles.splice(i, 1);
        i--;
        continue;
      }
      
      for (const mod of p.modifiers) {
        if (!mod.isGlobal) {
          if (mod.type === "once" && !mod.applied && particleAge >= mod.minTime && particleAge <= mod.maxTime) {
            if (mod.attribute === "alpha" && particleAge < 0.1) {
              debugLog(`Applying local once modifier to alpha: age=${particleAge}, minTime=${mod.minTime}, maxTime=${mod.maxTime}, minVal=${mod.minVal}, maxVal=${mod.maxVal}, op=${mod.operation}`);
            }
            p.applyModifier(mod);
            mod.applied = true;
          } else if (mod.type === "range" && particleAge >= mod.minTime && particleAge <= mod.maxTime) {
            p.applyModifier(mod, particleAge, deltaTime);
          } else if (mod.type === "impulse") {
            if (particleAge >= mod.minTime) {
              let interval = mod.maxTime - mod.originalMinTime;
              if (interval <= 0 && mod.minTime === mod.maxTime) {
                interval = mod.maxTime;
              }
              if (interval > 0) {
                const timeSinceStart = particleAge - mod.minTime;
                const intervalsPassed = Math.floor(timeSinceStart / interval);
                if (!p.impulseIntervals) p.impulseIntervals = new Map();
                const modKey = `${mod.attribute}_${mod.minTime}_${mod.maxTime}`;
                const lastAppliedInterval = p.impulseIntervals.get(modKey) || -1;
                if (intervalsPassed > lastAppliedInterval) {
                  p.applyModifier(mod);
                  p.impulseIntervals.set(modKey, intervalsPassed);
                }
              } else {
                if (mod.minTime === 0 && mod.maxTime === 0) {
                  p.applyZeroImpulse(mod);
                } else if (particleAge >= mod.minTime && particleAge <= mod.maxTime && !mod.applied) {
                  p.applyModifier(mod);
                  mod.applied = true;
                }
              }
            }
          }
        }
      }
      
      for (const mod of this.modifiers) {
        if (mod.isGlobal) {
          if (mod.type === "impulse") {
            if (mod.globalTriggered) p.applyModifier(mod);
          } else if (mod.type === "range") {
            if (p.age >= mod.minTime && p.age <= mod.maxTime) {
              p.applyModifier(mod, p.age, deltaTime);
            }
          } else if (mod.type === "once") {
            if (!mod.applied && p.age >= mod.minTime && p.age <= mod.maxTime) {
              p.applyModifier(mod);
              mod.appliedThisTick = true;
            }
          }
        }
      }
      
      if (!p.update(deltaTime, this.particlelifetime)) {
        this.activeParticles.splice(i, 1);
        i--;
        continue;
      }
      if (this.forceaboveterrain && p.z < 0) p.z = 0;
      if (this.autorotation) p.rotation = p.angle;
      if (!this.applyClipping(p)) {
        this.activeParticles.splice(i, 1);
        i--;
        continue;
      }
    }
    for (const mod of this.modifiers) {
      if (mod.isGlobal && mod.type === "impulse" && mod.globalTriggered) {
        mod.nextGlobalTime = currentTime + Math.max(0, random(mod.minTime, mod.maxTime));
        mod.globalTriggered = false;
      }
      if (mod.isGlobal && mod.type === "once" && mod.appliedThisTick) {
        mod.applied = true;
        mod.appliedThisTick = false;
      }
    }
  }
  draw(ctx, imageCache) {
    if (this.activeParticles.length > 0) {
      let drawnCount = 0;
      const fastColor = this.particles.filter(p => p && p.image).length === 1;
      const particles = this.firstinfront ? [...this.activeParticles].reverse() : this.activeParticles;
      for (const p of particles) {
        const img = imageCache[p.image];
        if (!img) {
          if (this.activeParticles.length <= 5) {
            debugLog('Missing image for particle:', p.image, 'Available images:', Object.keys(imageCache));
          }
          continue;
        }
        if (p.a > 0) {
          p.draw(ctx, img, fastColor);
          drawnCount++;
        }
      }
      if (this.activeParticles.length > 0 && this.activeParticles.length <= 5) {
        debugLog(`Drawing ${drawnCount}/${this.activeParticles.length} particles (alpha>0)`);
      }
    }
    for (const dropEmitter of this.dropemitters) {
      dropEmitter.draw(ctx, imageCache);
    }
  }
}

function extractNumericValue(str) {
  if (str && str.includes("degtorad")) debugLog(`[extractNumericValue] Input with degtorad: "${str}"`);
  str = str.trim();
  const randomStringValue = extractRandomStringValue(str);
  if (randomStringValue !== undefined) return extractNumericValue(randomStringValue);
  if (str.includes("int(")) {
    const match = str.match(/int\s*\(\s*(.+)\s*\)/);
    if (match) return Math.floor(extractNumericValue(match[1]));
  }
  if (str.includes("random(")) {
    const match = str.match(/random\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (match) return random(parseFloat(match[1]), parseFloat(match[2]));
  }
  if (str.includes("degtorad(")) {
    const match = str.match(/degtorad\s*\(\s*([^)]+)\s*\)/);
    if (match) return degtorad(parseFloat(match[1]));
  }
  if (/[+\-*/()]|\bpi\b|\bdegtorad\b/i.test(str)) {
    try {
      const expr = str.replace(/\bpi\b/gi, "Math.PI").replace(/degtorad\s*\(/gi, "degtorad(").replace(/int\s*\(/gi, "Math.floor(");
      const value = Function("degtorad", `return (${expr});`)(degtorad);
      if (Number.isFinite(value)) return value;
    } catch {}
  }
  if (str === "pi") return pi;
  if (str === "pi*2" || str === "pi * 2") return pi * 2;
  if (str.includes("*")) {
    const parts = str.split("*").map(s => parseFloat(s.trim()));
    return parts.reduce((a, b) => a * b, 1);
  }
  if (str.includes("+")) {
    const parts = str.split("+").map(s => parseFloat(s.trim()));
    return parts.reduce((a, b) => a + b, 0);
  }
  if (str.includes("-") && str[0] !== "-") {
    const parts = str.split("-").map(s => parseFloat(s.trim()));
    return parts[0] - parts.slice(1).reduce((a, b) => a + b, 0);
  }
  return parseFloat(str) || 0;
}

function extractRandomStringValue(str) {
  const match = str.match(/randomstring\s*\(\s*\{([^}]*)\}\s*\)/i);
  if (!match) return undefined;
  const values = match[1].split(",").map(v => v.trim()).filter(Boolean);
  if (!values.length) return undefined;
  return values[Math.min(values.length - 1, Math.floor(Math.random() * values.length))];
}

function extractStringValue(str) {
  const randomStringValue = extractRandomStringValue(str);
  if (randomStringValue !== undefined) return extractStringValue(randomStringValue);
  const match = str.match(/"([^"]+)"/);
  return match ? match[1] : str.trim().replace(/^["']|["']$/g, "");
}

function extractArrayValue(str) {
  const match = str.match(/\{\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^}]+)\s*\}/);
  if (match) {
    return {
      x: extractNumericValue(match[1]),
      y: extractNumericValue(match[2]),
      z: extractNumericValue(match[3])
    };
  }
  return {x: 0, y: 0, z: 0};
}

function extractBoxValue(str) {
  const values = (str.match(/\{([^}]+)\}/)?.[1] || str).split(",").map(v => extractNumericValue(v));
  return {x: values[0] || 0, y: values[1] || 0, z: values[2] || 0, right: values[3] || 0, bottom: values[4] || 0, top: values[5] || 0};
}

function extractBoolValue(value) {
  const boolVal = value.toLowerCase().trim().replace(/[;]+$/, "");
  return boolVal === "true" || boolVal === "1";
}

function extractParticlePropertyValue(prop, value) {
  if (prop === "image") return extractStringValue(value);
  if (prop === "offset" || prop === "attachoffset" || prop === "position") return extractArrayValue(value);
  return extractNumericValue(value);
}

function assignEmitterProperty(target, prop, value) {
  if (prop === "delaymin") target.delaymin = extractNumericValue(value);
  else if (prop === "delaymax") target.delaymax = extractNumericValue(value);
  else if (prop === "nrofparticles") target.nrofparticles = Math.floor(extractNumericValue(value));
  else if (prop === "maxparticles") target.maxparticles = Math.floor(extractNumericValue(value));
  else if (prop === "particletypes") target.particletypes = Math.floor(extractNumericValue(value));
  else if (prop === "emitautomatically") target.emitautomatically = extractBoolValue(value);
  else if (prop === "emissionoffset") target.emissionoffset = extractArrayValue(value);
  else if (prop === "clippingbox") target.clippingbox = extractBoxValue(value);
  else if (prop === "particlelifetime") target.particlelifetime = extractNumericValue(value);
  else if (prop === "movementfactor") target.movementfactor = extractNumericValue(value);
  else if (prop === "layer") target.layer = extractNumericValue(value);
  else if (prop === "attachposition") target.attachposition = extractBoolValue(value);
  else if (prop === "firstinfront") target.firstinfront = extractBoolValue(value);
  else if (prop === "checkbelowterrain") target.checkbelowterrain = extractBoolValue(value);
  else if (prop === "forceaboveterrain") target.forceaboveterrain = extractBoolValue(value);
  else if (prop === "emitatterrainheight") target.emitatterrainheight = extractBoolValue(value);
  else if (prop === "autorotation") target.autorotation = extractBoolValue(value);
  else if (prop === "continueafterdestroy") target.continueafterdestroy = extractBoolValue(value);
  else if (prop === "wraptoclippingbox") target.wraptoclippingbox = extractBoolValue(value);
  else if (prop === "cliptoscreen") target.cliptoscreen = extractBoolValue(value);
  else if (prop === "noclipping") target.noclipping = extractBoolValue(value);
  else if (prop === "showontop") target.showontop = extractBoolValue(value);
  else if (prop === "showonground") target.showonground = extractBoolValue(value);
  else if (prop === "switchyandzaxis") target.switchyandzaxis = extractBoolValue(value);
  else return false;
  return true;
}

function createModifierFromMatch(match, isGlobal, options = {}) {
  let maxValStr = match[7];
  if (maxValStr.includes('(') && !maxValStr.endsWith(')')) maxValStr += ')';
  const opts = normalizeParticleOptions(options);
  const env = advancedEnv(null, 0, 0, {x: opts.x, y: opts.y, thiso: opts.thiso, ...opts.env});
  return {
    type: match[1].toLowerCase(),
    minTime: evaluateGS2Expression(match[2], env),
    maxTime: evaluateGS2Expression(match[3], env),
    attribute: match[4].toLowerCase(),
    operation: match[5].toLowerCase(),
    minVal: evaluateGS2Expression(match[6], env),
    maxVal: evaluateGS2Expression(maxValStr, env),
    applied: false,
    originalMinTime: evaluateGS2Expression(match[2], env),
    isGlobal: !!isGlobal
  };
}

function getTemplateAttribute(template, attr) {
  if (attr === "alpha") return template.alpha !== undefined ? template.alpha : 1;
  if (attr === "zoom") return template.zoom !== undefined ? template.zoom : 1;
  if (attr === "red") return template.red !== undefined ? template.red : 1;
  if (attr === "green") return template.green !== undefined ? template.green : 1;
  if (attr === "blue") return template.blue !== undefined ? template.blue : 1;
  if (attr === "stretchx") return template.stretchx !== undefined ? template.stretchx : 1;
  if (attr === "stretchy") return template.stretchy !== undefined ? template.stretchy : 1;
  return template[attr] || 0;
}

function setTemplateAttribute(template, attr, value) {
  if (attr === "alpha" || attr === "zoom" || attr === "red" || attr === "green" || attr === "blue" || attr === "stretchx") template[attr] = Math.max(0, value);
  else template[attr] = value;
}

function applyTemplateModifier(template, mod, age, deltaTime) {
  let value;
  if (mod.type === "range") {
    if (age < mod.minTime || age > mod.maxTime) return;
    const span = mod.maxTime - mod.minTime;
    const t = span === 0 ? 1 : Math.max(0, Math.min(1, (age - mod.minTime) / span));
    const interpolatedVal = mod.minVal + (mod.maxVal - mod.minVal) * t;
    if (mod.operation === "add") value = getTemplateAttribute(template, mod.attribute) + interpolatedVal * (deltaTime || 0);
    else if (mod.operation === "multiply") value = getTemplateAttribute(template, mod.attribute) * interpolatedVal;
    else value = interpolatedVal;
  } else {
    const modVal = random(mod.minVal, mod.maxVal);
    if (mod.operation === "add") value = getTemplateAttribute(template, mod.attribute) + modVal;
    else if (mod.operation === "multiply") value = getTemplateAttribute(template, mod.attribute) * modVal;
    else value = modVal;
  }
  setTemplateAttribute(template, mod.attribute, value);
}

function findBlockEnd(code, openIndex) {
  let depth = 0;
  let quote = "";
  for (let i = openIndex; i < code.length; i++) {
    const c = code[i];
    if (quote) {
      if (c === quote && code[i - 1] !== "\\") quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractStructuredBlocks(code, pattern) {
  const blocks = [];
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(code))) {
    const open = code.indexOf("{", pattern.lastIndex - match[0].length);
    if (open < 0) continue;
    const end = findBlockEnd(code, open);
    if (end < 0) continue;
    blocks.push({match, body: code.slice(open + 1, end)});
    pattern.lastIndex = end + 1;
  }
  return blocks;
}

function advancedEnv(loopVar, loopValue, time = 0, extra = {}) {
  const modifier = time * (Math.PI / 3.2);
  const lights = 10;
  const thiso = {x: extra.x ?? 24, y: extra.y ?? 24, modifier, ...(extra.thiso || {})};
  const env = {temp: {}, thiso, player: {gmap: {name: ""}}, lights, radius: 5 + Math.cos(modifier), inc: Math.PI * 2 / lights, x: 0, y: 0, ...extra, thiso};
  if (loopVar) env.temp[loopVar] = loopValue;
  return env;
}

function evaluateGS2Expression(expr, env) {
  expr = String(expr).trim().replace(/;$/, "").replace(/\^/g, "**");
  expr = expr.replace(/\bpi\b/g, "Math.PI").replace(/\bcos\s*\(/gi, "Math.cos(").replace(/\bsin\s*\(/gi, "Math.sin(").replace(/\bmax\s*\(/gi, "Math.max(").replace(/\bmin\s*\(/gi, "Math.min(");
  expr = expr.replace(/getangle\s*\(/gi, "getangle(").replace(/degtorad\s*\(/gi, "degtorad(");
  expr = expr.replace(/thiso\.(x|y|modifier)/gi, (_, p) => `env.thiso.${p}`);
  expr = expr.replace(/player\.gmap\.name/gi, "env.player.gmap.name");
  expr = expr.replace(/temp\.(\w+)/gi, (_, p) => `env.temp.${p}`);
  expr = expr.replace(/\b(lights|radius|inc|x|y)\b/g, (_, p) => `env.${p}`);
  const getangle = (x, y) => Math.atan2(-y, x);
  try { return Function("env", "getangle", "degtorad", `return (${expr});`)(env, getangle, degtorad); } catch { return extractNumericValue(String(expr)); }
}

function advancedParticleValue(prop, value, env) {
  if (prop === "image") return extractStringValue(value);
  if (prop === "offset" || prop === "attachoffset" || prop === "position") return extractArrayValue(value);
  return evaluateGS2Expression(value, env);
}

function parseStaticImages(code, options = {}) {
  const images = new Map();
  const opts = normalizeParticleOptions(options);
  const env = advancedEnv(null, 0, 0, {x: opts.x, y: opts.y, thiso: opts.thiso, ...opts.env});
  for (let rawLine of code.split("\n")) {
    const commentIndex = rawLine.indexOf("//");
    if (commentIndex !== -1) rawLine = rawLine.slice(0, commentIndex);
    const line = rawLine.trim();
    if (!line) continue;
    const show = line.match(/^showimg\s*\(\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*(.+?)\s*\)\s*;?$/i);
    if (show) {
      const id = parseInt(show[1], 10);
      images.set(id, {id, image: show[2], x: evaluateGS2Expression(show[3], env), y: evaluateGS2Expression(show[4], env), layer: 0, zoom: 1, r: 1, g: 1, b: 1, a: 1, mode: 0, hidden: false});
      continue;
    }
    const hide = line.match(/^hideimg\s*\(\s*(\d+)\s*\)\s*;?$/i);
    if (hide) {
      const item = images.get(parseInt(hide[1], 10));
      if (item) item.hidden = true;
      continue;
    }
    const zoom = line.match(/^changeimgzoom\s*\(\s*(\d+)\s*,\s*(.+?)\s*\)\s*;?$/i);
    if (zoom && images.has(parseInt(zoom[1], 10))) {
      images.get(parseInt(zoom[1], 10)).zoom = evaluateGS2Expression(zoom[2], env);
      continue;
    }
    const vis = line.match(/^changeimgvis\s*\(\s*(\d+)\s*,\s*(.+?)\s*\)\s*;?$/i);
    if (vis && images.has(parseInt(vis[1], 10))) {
      images.get(parseInt(vis[1], 10)).layer = evaluateGS2Expression(vis[2], env);
      continue;
    }
    const colors = line.match(/^changeimgcolors\s*\(\s*(\d+)\s*,\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)\s*;?$/i);
    if (colors && images.has(parseInt(colors[1], 10))) {
      const item = images.get(parseInt(colors[1], 10));
      item.r = evaluateGS2Expression(colors[2], env);
      item.g = evaluateGS2Expression(colors[3], env);
      item.b = evaluateGS2Expression(colors[4], env);
      item.a = evaluateGS2Expression(colors[5], env);
    }
  }
  return [...images.values()].filter(item => !item.hidden).sort((a, b) => a.layer - b.layer || a.id - b.id);
}

function buildAdvancedEmitter(body, env, loopVar, loopValue, xExpr, yExpr, options = {}) {
  const config = {delaymin: 1, delaymax: 1, nrofparticles: 0, maxparticles: 100000, particletypes: 1, emitautomatically: true, emissionoffset: {x: 0, y: 0, z: 0}, particles: [{}], modifiers: [], templateModifiers: []};
  let angleExpr = null;
  for (let rawLine of body.split("\n")) {
    const commentIndex = rawLine.indexOf("//");
    if (commentIndex !== -1) rawLine = rawLine.slice(0, commentIndex);
    const line = rawLine.trim();
    if (!line) continue;
    const xMatch = line.match(/^x\s*=\s*(.+?);?$/i);
    const yMatch = line.match(/^y\s*=\s*(.+?);?$/i);
    if (xMatch) {
      xExpr = xMatch[1];
      config.x = evaluateGS2Expression(xExpr, env);
      env.x = config.x;
      continue;
    }
    if (yMatch) {
      yExpr = yMatch[1];
      config.y = evaluateGS2Expression(yExpr, env);
      env.y = config.y;
      continue;
    }
    const particleMatch = line.match(/^emitter\.particle\.(\w+)\s*=\s*(.+?);?$/i);
    if (particleMatch) {
      const prop = particleMatch[1].toLowerCase();
      const value = particleMatch[2].trim();
      if (prop === "angle") angleExpr = value;
      config.particles[0][prop] = advancedParticleValue(prop, value, env);
      continue;
    }
    const emitterMatch = line.match(/^emitter\.(\w+)\s*=\s*(.+?);?$/i);
    if (emitterMatch && assignEmitterProperty(config, emitterMatch[1].toLowerCase(), emitterMatch[2].trim())) continue;
    const modMatch = line.match(/^emitter\.addlocalmodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
    if (modMatch) config.modifiers.push(createModifierFromMatch(modMatch, false, options));
  }
  if (!config.particles[0].image) return null;
  if (loopVar && (xExpr || yExpr || angleExpr)) {
    config.updateEmitter = (emitter, time) => {
      const nextEnv = advancedEnv(loopVar, loopValue, time);
      if (xExpr) {
        emitter.x = evaluateGS2Expression(xExpr, nextEnv);
        nextEnv.x = emitter.x;
      }
      if (yExpr) {
        emitter.y = evaluateGS2Expression(yExpr, nextEnv);
        nextEnv.y = emitter.y;
      }
      if (angleExpr && emitter.particles[0]) emitter.particles[0].angle = evaluateGS2Expression(angleExpr, nextEnv);
    };
  }
  return config;
}

function resolveAdvancedConditionals(code) {
  let previous;
  do {
    previous = code;
    code = code.replace(/if\s*\(\s*this\.attr\[2\]\s*==\s*"Graal5516715"\s*\)\s*\{([^{}]*)\}\s*else\s*\{([^{}]*)\}/gi, "$1");
  } while (code !== previous);
  return code;
}

function parseAdvancedGS2ParticleCode(code, options = {}) {
  if (!/findimg\s*\(|emitter\.particle\./i.test(code)) return null;
  code = resolveAdvancedConditionals(code);
  const opts = normalizeParticleOptions(options);
  const baseEnv = {x: opts.x, y: opts.y, thiso: opts.thiso, ...opts.env};
  const emitters = [];
  const loopBlocks = extractStructuredBlocks(code, /for\s*\(\s*temp\.(\w+)\s*=\s*([^;]+)\s*;\s*temp\.\1\s*<\s*([^;]+)\s*;\s*temp\.\1\+\+\s*\)/gi);
  for (const loop of loopBlocks) {
    const loopVar = loop.match[1];
    const start = Math.floor(evaluateGS2Expression(loop.match[2], advancedEnv(null, 0, 0, baseEnv)));
    const end = Math.floor(evaluateGS2Expression(loop.match[3], advancedEnv(null, 0, 0, baseEnv)));
    const withBlocks = extractStructuredBlocks(loop.body, /with\s*\(\s*findimg\s*\(([^)]*)\)\s*\)/gi);
    for (let i = start; i < end; i++) {
      for (const block of withBlocks) {
        const env = advancedEnv(loopVar, i, 0, baseEnv);
        const emitter = buildAdvancedEmitter(block.body, env, loopVar, i, undefined, undefined, options);
        if (emitter) emitters.push(emitter);
      }
    }
  }
  const topCode = code.replace(/for\s*\(\s*temp\.(\w+)\s*=\s*([^;]+)\s*;\s*temp\.\1\s*<\s*([^;]+)\s*;\s*temp\.\1\+\+\s*\)\s*\{[\s\S]*?\n\s*\}/gi, "");
  for (const block of extractStructuredBlocks(topCode, /with\s*\(\s*findimg\s*\(([^)]*)\)\s*\)/gi)) {
    const emitter = buildAdvancedEmitter(block.body, advancedEnv(null, 0, 0, baseEnv), undefined, undefined, undefined, undefined, options);
    if (emitter) emitters.push(emitter);
  }
  return emitters.length ? {emitters, particles: [], modifiers: [], delaymin: 0, delaymax: 0, nrofparticles: 0, particletypes: 0} : null;
}

function parseGS2ParticleCode(code, options = {}) {
  code = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const staticImages = parseStaticImages(code, options);
  const advancedConfig = parseAdvancedGS2ParticleCode(code, options);
  if (advancedConfig) {
    advancedConfig.staticImages = staticImages;
    return advancedConfig;
  }
  const config = {
    delaymin: 1,
    delaymax: 1,
    nrofparticles: 0,
    maxparticles: 100000,
    particletypes: 1,
    emitautomatically: true,
    emissionoffset: {x: 0, y: 0, z: 0},
    particles: [],
    modifiers: [],
    templateModifiers: [],
    staticImages
  };
  let processedCode = code;
  processedCode = processedCode.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = processedCode.split("\n");
  const context = [];
  let inEmitter = false;
  let currentParticleIndex = 0;
  let inDropEmitter = false;
  let dropEmitterConfig = null;
  let dropEmitterContext = [];
  let dropEmitterParticleIndex = 0;
  for (let line of lines) {
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }
    line = line.trim();
    if (!line) continue;
    const dropEmitterMatch = line.match(/with\s*\(\s*(dropemitter|dropwateremitter)\s*\)/i);
    if (dropEmitterMatch) {
      inDropEmitter = true;
      context.push(dropEmitterMatch[1].toLowerCase());
      dropEmitterConfig = {
        delaymin: 1,
        delaymax: 1,
        nrofparticles: 0,
        maxparticles: 100000,
        particletypes: 1,
        emitautomatically: false,
        emissionoffset: {x: 0, y: 0, z: 0},
        particles: [],
        modifiers: [],
        templateModifiers: []
      };
      dropEmitterContext = [];
      dropEmitterParticleIndex = 0;
      debugLog('Entering dropemitter block, will parse nested emitter');
      continue;
    }
    const emitterParticlesMatch = line.match(/with\s*\(\s*emitter\.particles\[(\d+)\]/i);
    if (emitterParticlesMatch) {
      currentParticleIndex = parseInt(emitterParticlesMatch[1]);
      context.push("particle");
      debugLog(`Entering with (emitter.particles[${currentParticleIndex}])`);
      continue;
    }
    const particlesMatch = line.match(/with\s*\(\s*particles\[(\d+)\]/i);
    if (particlesMatch) {
      currentParticleIndex = parseInt(particlesMatch[1]);
      context.push("particle");
      continue;
    }
    const particleMatch = line.match(/with\s*\(\s*particle\s*\)/i);
    if (particleMatch) {
      debugLog(`Found 'with (particle)' line, inDropEmitter=${inDropEmitter}, dropEmitterConfig=${!!dropEmitterConfig}`);
      // Only parse particle if we're not in a dropemitter
      if (!inDropEmitter) {
        context.push("particle");
        currentParticleIndex = 0;
        continue;
      }
      // If in dropemitter, let the dropemitter section handle it
      debugLog(`Falling through to dropemitter section for 'with (particle)'`);
    }
    const withMatch = line.match(/with\s*\(\s*(findimg|emitter|emitter\.particle)/i);
    if (withMatch) {
      if (withMatch[1] === "emitter") {
        inEmitter = true;
        context.push("emitter");
      } else if (withMatch[1] === "emitter.particle") {
        context.push("particle");
        currentParticleIndex = 0;
      } else {
        context.push("findimg");
        inEmitter = true;
      }
      continue;
    }
    if (line === "}") {
      debugLog(`Closing brace: context=${JSON.stringify(context)}, dropEmitterContext=${JSON.stringify(dropEmitterContext)}, inDropEmitter=${inDropEmitter}`);
      // If in dropemitter and dropEmitterContext has items, handle those first
      if (inDropEmitter && dropEmitterContext.length > 0) {
        const popped = dropEmitterContext.pop();
        debugLog(`[DROPEMITTER] Popped '${popped}' from dropEmitterContext, remaining:`, JSON.stringify(dropEmitterContext));
        if (dropEmitterContext.length === 0) dropEmitterParticleIndex = 0;
        continue;
      }
      if (context.length > 0) {
        const popped = context.pop();
        debugLog(`Popped '${popped}' from context`);
        if (popped === "emitter") inEmitter = false;
        if (popped === "particle") currentParticleIndex = 0;
        if (popped === "findimg" && context.length === 0) inEmitter = false;
        if (popped === "dropemitter" || popped === "dropwateremitter") {
          inDropEmitter = false;
          if (dropEmitterConfig) {
            config[popped] = dropEmitterConfig;
            debugLog('Stored dropemitter config with', dropEmitterConfig.particles.length, 'particles, modifiers:', dropEmitterConfig.modifiers.length);
          }
          dropEmitterConfig = null;
          dropEmitterContext = [];
          dropEmitterParticleIndex = 0;
          debugLog('Exited dropemitter block');
          continue;
        }
        if (popped === "emitter") {
          debugLog('Exited emitter block');
        }
      }
      continue;
    }
    if (context[context.length - 1] === "emitter") {
      const emitterPropMatch = line.match(/(\w+)\s*=\s*(.+?)(?:;|$)/);
      if (emitterPropMatch) {
        const prop = emitterPropMatch[1].toLowerCase();
        const value = emitterPropMatch[2].trim();
        if (assignEmitterProperty(config, prop, value)) continue;
      }
    }
    if (context[context.length - 1] === "findimg") {
      const findImgPropMatch = line.match(/(\w+)\s*=\s*(.+?)(?:;|$)/);
      if (findImgPropMatch) {
        const prop = findImgPropMatch[1].toLowerCase();
        const value = findImgPropMatch[2].trim();
        if (assignEmitterProperty(config, prop, value)) continue;
      }
    }
    if (!inEmitter && !line.includes("emitter.")) continue;
    const particleSingleMatch = line.match(/emitter\.particle\.(\w+)\s*=\s*(.+);?$/i);
    if (particleSingleMatch) {
      const prop = particleSingleMatch[1].toLowerCase();
      const valueStr = particleSingleMatch[2].trim();
      const value = extractParticlePropertyValue(prop, valueStr);
      if (!config.particles[0]) config.particles[0] = {};
      config.particles[0][prop] = value;
      continue;
    }
    const emitterPropMatch = line.match(/emitter\.(\w+)\s*=\s*(.+?)(?:;|$)/i);
    if (emitterPropMatch) {
      const prop = emitterPropMatch[1].toLowerCase();
      const value = emitterPropMatch[2].trim();
      if (assignEmitterProperty(config, prop, value)) continue;
    }
    const particlePropMatch = line.match(/emitter\.particles?\[?(\d+)?\]?\.(\w+)\s*=\s*(.+);?$/i);
    if (particlePropMatch) {
      let index = 0;
      if (particlePropMatch[1] !== undefined) {
        index = parseInt(particlePropMatch[1]);
      } else if (currentParticleIndex > 0) {
        index = currentParticleIndex;
      }
      const prop = particlePropMatch[2].toLowerCase();
      const valueStr = particlePropMatch[3].trim();
      const value = extractParticlePropertyValue(prop, valueStr);
      if (!config.particles[index]) config.particles[index] = {};
      config.particles[index][prop] = value;
      continue;
    }
    if (context[context.length - 1] === "particle") {
      const propMatch = line.match(/(\w+)\s*=\s*(.+?)(?:;|$)/);
      if (propMatch) {
        const prop = propMatch[1].toLowerCase();
        const valueStr = propMatch[2].trim();
        const value = extractParticlePropertyValue(prop, valueStr);
        if (!config.particles[currentParticleIndex]) config.particles[currentParticleIndex] = {};
        config.particles[currentParticleIndex][prop] = value;
        if (prop === "image") debugLog(`Parsed image for particles[${currentParticleIndex}]:`, value);
        continue;
      }
    }
    if (inDropEmitter) {
      debugLog(`[DROPEMITTER SECTION] Processing line:`, line.substring(0, 80), `dropEmitterConfig=${!!dropEmitterConfig}`);
      if (dropEmitterConfig) {
        if (line.toLowerCase().includes('addlocalmodifier') || line.toLowerCase().includes('addglobalmodifier')) {
          debugLog(`[DROPEMITTER] Checking modifier line:`, line.substring(0, 100));
        }
        const dropParticleMatch = line.match(/with\s*\(\s*particle\s*\)/i);
        if (dropParticleMatch) {
          debugLog(`[DROPEMITTER] Found 'with (particle)', pushing to dropEmitterContext`);
          dropEmitterContext.push("particle");
          dropEmitterParticleIndex = 0;
          continue;
        }
        if (dropEmitterContext[dropEmitterContext.length - 1] === "particle") {
          const propMatch = line.match(/(\w+)\s*=\s*(.+?)(?:;|$)/);
          if (propMatch) {
            const prop = propMatch[1].toLowerCase();
            const valueStr = propMatch[2].trim();
            const value = extractParticlePropertyValue(prop, valueStr);
            if (!dropEmitterConfig.particles[0]) dropEmitterConfig.particles[0] = {};
            dropEmitterConfig.particles[0][prop] = value;
            continue;
          }
        }
        const dropTemplateModifierMatch = line.match(/(?:emitter\.)?addtemplatemodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
        if (dropTemplateModifierMatch) {
          dropEmitterConfig.templateModifiers.push(createModifierFromMatch(dropTemplateModifierMatch, false, options));
          continue;
        }
        const dropModifierMatch = line.match(/(?:emitter\.)?addlocalmodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
        if (dropModifierMatch) {
          const mod = createModifierFromMatch(dropModifierMatch, false, options);
          dropEmitterConfig.modifiers.push(mod);
          debugLog(`[DROPEMITTER] Parsed dropemitter local modifier: ${mod.type}:${mod.attribute}:${mod.operation}`);
          continue;
        }
        const dropGlobalModifierMatch = line.match(/addglobalmodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
        if (dropGlobalModifierMatch) {
          const mod = createModifierFromMatch(dropGlobalModifierMatch, true, options);
          dropEmitterConfig.modifiers.push(mod);
          debugLog(`[DROPEMITTER] Parsed dropemitter global modifier: ${mod.type}:${mod.attribute}:${mod.operation}`);
          continue;
        }
        const dropEmitterPropMatch = line.match(/(\w+)\s*=\s*(.+?)(?:;|$)/);
        if (dropEmitterPropMatch) {
          const prop = dropEmitterPropMatch[1].toLowerCase();
          const value = dropEmitterPropMatch[2].trim();
          if (assignEmitterProperty(dropEmitterConfig, prop, value)) continue;
        }
        const dropParticlePropMatch = line.match(/particle\.(\w+)\s*=\s*(.+?)(?:;|$)/);
        if (dropParticlePropMatch) {
          const prop = dropParticlePropMatch[1].toLowerCase();
          const valueStr = dropParticlePropMatch[2].trim();
          const value = extractParticlePropertyValue(prop, valueStr);
          if (!dropEmitterConfig.particles[0]) dropEmitterConfig.particles[0] = {};
          dropEmitterConfig.particles[0][prop] = value;
          continue;
        }
      }
        if (line === "}") {
          if (dropEmitterContext.length > 0) {
            const popped = dropEmitterContext.pop();
            debugLog(`[DROPEMITTER] Popped '${popped}' from dropEmitterContext, remaining:`, JSON.stringify(dropEmitterContext));
            if (dropEmitterContext.length === 0) dropEmitterParticleIndex = 0;
            continue;
          }
        }
      continue;
    }
    if (line.toLowerCase().includes('addlocalmodifier') || line.toLowerCase().includes('addglobalmodifier')) {
      debugLog(`[MAIN] Checking modifier line (inEmitter=${inEmitter}, context=${JSON.stringify(context)}, inDropEmitter=${inDropEmitter}):`, line.substring(0, 100));
    }
    const templateModifierMatch = line.match(/(?:emitter\.)?addtemplatemodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
    if (templateModifierMatch) {
      config.templateModifiers.push(createModifierFromMatch(templateModifierMatch, false, options));
      continue;
    }
    const modifierMatch = line.match(/(?:emitter\.)?addlocalmodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
    if (modifierMatch) {
      const mod = createModifierFromMatch(modifierMatch, false, options);
      config.modifiers.push(mod);
      debugLog(`[MAIN] Parsed local modifier: ${mod.type}:${mod.attribute}:${mod.operation}, minTime=${mod.minTime}, maxTime=${mod.maxTime}, minVal=${mod.minVal}, maxVal=${mod.maxVal}`);
      continue;
    }
    const globalModifierMatch = line.match(/addglobalmodifier\s*\(\s*"([^"]+)"\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*((?:[^),]|\([^)]*\))+)\s*\)/i);
    if (globalModifierMatch) {
      const mod = createModifierFromMatch(globalModifierMatch, true, options);
      config.modifiers.push(mod);
      debugLog(`Parsed global modifier: ${mod.type}:${mod.attribute}:${mod.operation}, minTime=${mod.minTime}, maxTime=${mod.maxTime}, minVal=${mod.minVal}, maxVal=${mod.maxVal}`);
      continue;
    }
  }
  if (config.particles.length === 0 && config.particletypes > 0) {
    config.particles[0] = {lifetime: 1, speed: 1, alpha: 1, zoom: 1};
  }
  debugLog(`Parsed config: ${config.modifiers.length} modifiers total (${config.modifiers.filter(m => m.isGlobal).length} global, ${config.modifiers.filter(m => !m.isGlobal).length} local)`);
  return config;
}

class ParticleSystem {
  constructor(canvas, ctx, options = {}) {
    const opts = normalizeParticleOptions(options);
    this.canvas = canvas;
    this.ctx = ctx;
    this.options = opts;
    this.assetBaseUrl = opts.assetBaseUrl;
    this.defaultX = opts.x;
    this.defaultY = opts.y;
    this.emitters = [];
    this.staticImages = [];
    this.imageCache = {};
    this.lastTime = performance.now();
    this.simTime = 0;
  }
  async loadImage(filename) {
    if (this.imageCache[filename]) return this.imageCache[filename];
    if (/\.gif(?:$|\?)/i.test(filename)) {
      try {
        const response = await fetch(particleAssetUrl(this.assetBaseUrl, filename));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const gif = decodeGif(await response.arrayBuffer());
        if (!gif.frames?.length) throw new Error("GIF has no frames");
        gif.__particleFilename = filename;
        this.imageCache[filename] = gif;
        debugLog(`Loaded gif: ${filename}`, gif.width, gif.height, gif.frames.length);
        return gif;
      } catch (error) {
        console.warn(`Failed to decode gif: ${filename}`, error);
      }
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        img.__particleFilename = filename;
        this.imageCache[filename] = img;
        debugLog(`Loaded image: ${filename}`, img.width, img.height);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${filename}`);
        resolve(null);
      };
      img.src = particleAssetUrl(this.assetBaseUrl, filename);
    });
  }
  async createEmitter(config) {
    if (Array.isArray(config.staticImages)) {
      for (const item of config.staticImages) {
        if (!this.staticImages.some(existing => existing.id === item.id)) this.staticImages.push(item);
        if (item.image) await this.loadImage(item.image);
      }
    }
    if (Array.isArray(config.emitters)) {
      for (const emitterConfig of config.emitters) await this.createEmitter(emitterConfig);
      return;
    }
    debugLog('Creating emitter with config:', config);
    for (let i = 0; i < config.particletypes; i++) {
      if (config.particles[i] && config.particles[i].image) {
        await this.loadImage(config.particles[i].image);
      }
    }
    if (config.dropemitter) {
      for (let i = 0; i < (config.dropemitter.particletypes || 1); i++) {
        if (config.dropemitter.particles[i] && config.dropemitter.particles[i].image) {
          await this.loadImage(config.dropemitter.particles[i].image);
        }
      }
    }
    if (config.dropwateremitter) {
      for (let i = 0; i < (config.dropwateremitter.particletypes || 1); i++) {
        if (config.dropwateremitter.particles[i] && config.dropwateremitter.particles[i].image) {
          await this.loadImage(config.dropwateremitter.particles[i].image);
        }
      }
    }
    config.x = config.x !== undefined ? config.x : this.defaultX;
    config.y = config.y !== undefined ? config.y : this.defaultY;
    config.canvasWidth = this.canvas.width;
    config.canvasHeight = this.canvas.height;
    const emitter = new Emitter(config);
    debugLog('Emitter created, initial particles:', emitter.activeParticles.length);
    this.emitters.push(emitter);
  }
  clear() {
    this.emitters = [];
    this.staticImages = [];
  }
  resetClock() {
    this.lastTime = performance.now();
  }
  update() {
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (!Number.isFinite(deltaTime) || deltaTime < 0) deltaTime = 0;
    else if (deltaTime > RESUME_DELTA_LIMIT) return;
    else if (deltaTime > MAX_FRAME_DELTA) deltaTime = MAX_FRAME_DELTA;
    this.simTime += deltaTime;
    for (const emitter of this.emitters) {
      emitter.update(deltaTime, this.simTime);
    }
  }
  draw(ctx) {
    const drawItems = [
      ...this.staticImages.map(item => ({layer: item.layer || 0, order: item.id || 0, draw: () => drawStaticImage(ctx, item, this.imageCache[item.image])})),
      ...this.emitters.map((emitter, index) => ({layer: emitter.layer || 0, order: 100000 + index, draw: () => emitter.draw(ctx, this.imageCache)}))
    ].sort((a, b) => a.layer - b.layer || a.order - b.order);
    for (const item of drawItems) item.draw();
  }
}

const GraalParticleEmu = {
  ParticleSystem,
  Emitter,
  Particle,
  parseGS2ParticleCode,
  parseAdvancedGS2ParticleCode,
  parseStaticImages,
  decodeGif,
  degtorad,
  normalizeParticleOptions
};

if (typeof window !== "undefined") window.GraalParticleEmu = GraalParticleEmu;
if (typeof module !== "undefined" && module.exports) module.exports = GraalParticleEmu;
