import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import * as THREE from 'three';
import { STORY } from '../../data/story.data';
import { FlightService, View } from '../../services/flight.service';
import { SceneService, SpaceApi } from '../../services/scene.service';
import { TweenService } from '../../services/tween.service';
import { ViewportService } from '../../services/viewport.service';
import { GC, armPos } from '../../three/arm';
import { Glow, GlowUniforms, makePoints } from '../../three/glow-points';
import { NameStars } from '../../three/name-stars';
import { sceneBirth } from '../../three/scenes/birth';
import { buildGalaxy } from '../../three/scenes/galaxy';
import { sceneGravity } from '../../three/scenes/gravity';
import { sceneHome } from '../../three/scenes/home';
import { sceneOrbit } from '../../three/scenes/orbit';
import { sceneStar } from '../../three/scenes/star';
import { SceneCtx, Stop } from '../../three/types';

const STOP_DEFS: [number, number][] = [[0, 2.6], [.25, 3], [.5, 2.4], [.75, 2.1], [1, 1]];
const BUILDERS = [sceneBirth, sceneGravity, sceneStar, sceneOrbit, sceneHome];

@Component({
  selector: 'app-space-3d',
  template: '<canvas #cv aria-hidden="true"></canvas>',
  styles: 'canvas{position:fixed;inset:0;width:100%;height:100%;display:block;z-index:1;pointer-events:none}'
})
export class Space3d implements AfterViewInit, SpaceApi, SceneCtx {
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly vp = inject(ViewportService);
  private readonly tw = inject(TweenService);
  private readonly flight = inject(FlightService);
  private readonly story = inject(SceneService);

  readonly p3 = { alpha: 0 };
  readonly big: { alpha: number; P?: Glow; mk?: Glow } = { alpha: 0 };
  readonly stops: Stop[] = STOP_DEFS.map(([t, r]) => {
    const [x, y, z] = armPos(t); return { x, y, z, r, t0: null, group: null, update: () => {} };
  });

  private renderer: THREE.WebGLRenderer | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, .1, 3000);
  readonly sphere = new THREE.SphereGeometry(1, 72, 48);
  private readonly glow: GlowUniforms[] = [];
  private readonly name = new NameStars(this.scene);
  private dRest = 10;
  private drew3D = false;

  get time() { return this.tw.time; }
  points(n: number, parent: THREE.Object3D) { return makePoints(n, parent, this.glow); }
  pulseFlash(v: number) { this.flight.pulseFlash(v); }

  ngAfterViewInit() {
    if (this.init()) this.story.space = this;
  }

  private init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.cv().nativeElement, alpha: true, antialias: true });
    } catch {
      return false;   // sin WebGL: se usa el respaldo 2D
    }
    const renderer = this.renderer, scene = this.scene;
    renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
    const sun = new THREE.DirectionalLight(0xfff1e6, 1.6); sun.position.set(-3, 2, 4); scene.add(sun);
    const rim = new THREE.DirectionalLight(0x9a7cff, .6); rim.position.set(3, -1, -2); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x4a3a80, .22));
    this.resize();
    for (const sc of this.stops) {
      sc.group = new THREE.Group(); sc.group.position.set(sc.x, sc.y, sc.z); sc.group.visible = false; scene.add(sc.group);
    }
    // las texturas se generan mientras se ve la carta
    setTimeout(() => {
      BUILDERS.forEach((fn, i) => fn(this.stops[i], this));
      Object.assign(this.big, buildGalaxy(this, scene, this.stops));
    }, 200);
    return true;
  }

  resize() {
    const renderer = this.renderer, camera = this.camera;
    if (!renderer) return;
    const { W, H } = this.vp;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.setViewOffset(W, H, 0, H * .1, W, H); camera.updateProjectionMatrix();
    this.dRest = (H / 2) / (.27 * Math.min(W, H) * Math.tan(Math.PI / 8));
  }

  private viewOf(sc: Stop): View {
    const { W, H } = this.vp;
    const D = sc.planet ? this.dRest : sc.r * 1.25 / (Math.tan(Math.PI / 8) * Math.min(1, W / H));
    return { x: sc.x, y: sc.y, z: sc.z + D, lx: sc.x, ly: sc.y, lz: sc.z };
  }

  private finalView(): View {
    const { W, H } = this.vp;
    const D = 165 / (Math.tan(Math.PI / 8) * Math.min(1, W / H)), d = new THREE.Vector3(0, .78, .62).normalize();
    return { x: GC.x + d.x * D, y: d.y * D, z: GC.z + d.z * D, lx: GC.x, ly: 0, lz: GC.z };
  }

  async flyToStop(i: number, ms: number) {
    const sc = this.stops[i % this.stops.length];
    await this.flight.flyTo(this.viewOf(sc), ms);
    sc.t0 = this.time;
  }

  flyToFinal() { return this.flight.flyTo(this.finalView(), 5200, .3); }

  startName() {
    this.name.start(STORY.nombre, this.vp, this.flight.CAM.z);
    this.tw.tween(this.name, 'alpha', 1, 1800);
  }

  formName3D() { return this.name.form(this.time); }

  explodeName() {
    this.name.explode();
    this.tw.tween(this.name, 'alpha', 0, 2200);
  }

  render(dt: number) {
    const renderer = this.renderer, camera = this.camera, CAM = this.flight.CAM, time = this.time, H = this.vp.H;
    if (!renderer) return;
    const scale = () => renderer.getPixelRatio() * H / (2 * Math.tan(camera.fov * Math.PI / 360));
    this.name.update(dt, time, scale());
    camera.position.set(CAM.x, CAM.y, CAM.z); camera.lookAt(CAM.lx, CAM.ly, CAM.lz);
    const fov = 45 + 38 * this.flight.FLY.warp;
    if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const us = scale();
    for (const u of this.glow) { u.uScale.value = us; u.uTime.value = time; }
    const vis = this.p3.alpha > .01;
    for (const sc of this.stops) {
      if (!sc.group) continue;
      sc.group.visible = vis;
      if (vis) sc.update(dt, sc.t0 == null ? -1 : time - sc.t0);
    }
    const big = this.big;
    if (big.P && big.mk) {
      big.P.obj.visible = big.mk.obj.visible = big.alpha > .01;
      big.P.u.uAlpha.value = big.alpha; big.mk.u.uAlpha.value = big.alpha;
    }
    const any = vis || this.name.alpha > .01 || big.alpha > .01;
    if (any || this.drew3D) { renderer.render(this.scene, camera); this.drew3D = any; }
  }
}
