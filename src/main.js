import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { KNOTS, CATEGORIES } from './knotsData.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div id="titlePanel">
    <div class="title">Rope Knot Galaxy</div>
    <div class="subtitle">绳结知识星空 · ${KNOTS.length} 个绳结 · ${CATEGORIES.length} 个分类</div>
  </div>

  <div id="tooltip"></div>

  <div id="infoPanel" class="hidden">
    <button id="closePanel">×</button>
    <div id="panelContent"></div>
  </div>

  <div id="legend"></div>
`

const tooltip = document.querySelector('#tooltip')
const infoPanel = document.querySelector('#infoPanel')
const panelContent = document.querySelector('#panelContent')
const closePanel = document.querySelector('#closePanel')
const legend = document.querySelector('#legend')

closePanel.addEventListener('click', () => {
  infoPanel.classList.add('hidden')
})

legend.innerHTML = `
  <div class="legendTitle">分类图例</div>
  ${CATEGORIES.map(cat => `
    <div class="legendItem">
      <span class="legendDot" style="background:${cat.color}"></span>
      <span>${cat.name}</span>
      <em>${cat.count}</em>
    </div>
  `).join('')}
  <div class="legendNote">
    ★ 为核心分类节点，圆点为具体绳结节点
  </div>
`

/* =========================
   Three.js 基础
========================= */

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 0, 24)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.minDistance = 10
controls.maxDistance = 70
controls.enablePan = false

/* =========================
   星空背景
========================= */

const starGeometry = new THREE.BufferGeometry()
const starCount = 2800
const starPositions = []

for (let i = 0; i < starCount; i++) {
  starPositions.push((Math.random() - 0.5) * 280)
  starPositions.push((Math.random() - 0.5) * 280)
  starPositions.push((Math.random() - 0.5) * 280)
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
)

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.12,
  transparent: true,
  opacity: 0.82
})

const starField = new THREE.Points(starGeometry, starMaterial)
scene.add(starField)

/* =========================
   灯光
========================= */

scene.add(new THREE.AmbientLight(0x6688ff, 0.78))

const blueLight = new THREE.PointLight(0x3bb7ff, 3, 80)
blueLight.position.set(6, 8, 12)
scene.add(blueLight)

const purpleLight = new THREE.PointLight(0x8a5cff, 2.8, 80)
purpleLight.position.set(-7, -5, 10)
scene.add(purpleLight)

const topLight = new THREE.PointLight(0xffffff, 1.2, 60)
topLight.position.set(0, 16, 8)
scene.add(topLight)

const coreLight = new THREE.PointLight(0x4f7cff, 2.2, 18)
coreLight.position.set(0, 0, 0)
scene.add(coreLight)

/* =========================
   中心：双绳索环形核心
   一个主环 + 一个垂直辅助环
========================= */

const coreGroup = new THREE.Group()
scene.add(coreGroup)

class RopeRingCurve extends THREE.Curve {
  constructor(R = 1.9, r = 0.28, turns = 18, phase = 0) {
    super()
    this.R = R
    this.r = r
    this.turns = turns
    this.phase = phase
  }

  getPoint(t) {
    const u = Math.PI * 2 * t
    const v = this.turns * u + this.phase
    const radial = this.R + this.r * Math.cos(v)

    return new THREE.Vector3(
      radial * Math.cos(u),
      this.r * Math.sin(v),
      radial * Math.sin(u)
    )
  }
}

function createRopeRing({
  majorRadius = 1.9,
  waveRadius = 0.3,
  braidTurns = 9,
  strands = 10,
  tubeRadius = 0.045,
  blueColor = 0x08b8ff,
  purpleColor = 0x8d4dff,
  blueEmissive = 0x003a66,
  purpleEmissive = 0x2b0066,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  scale = 1
} = {}) {
  const ringGroup = new THREE.Group()

  for (let i = 0; i < strands; i++) {
    const curve = new RopeRingCurve(
      majorRadius,
      waveRadius,
      braidTurns,
      (Math.PI * 2 * i) / strands
    )

    const geometry = new THREE.TubeGeometry(
      curve,
      360,
      tubeRadius,
      10,
      true
    )

    const isBlue = i % 2 === 0

    const material = new THREE.MeshStandardMaterial({
      color: isBlue ? blueColor : purpleColor,
      emissive: isBlue ? blueEmissive : purpleEmissive,
      metalness: 0.18,
      roughness: 0.36
    })

    const mesh = new THREE.Mesh(geometry, material)
    ringGroup.add(mesh)
  }

  ringGroup.rotation.set(rotationX, rotationY, rotationZ)
  ringGroup.scale.setScalar(scale)

  return ringGroup
}

// 主绳索环：偏水平，较粗，作为核心主体
const ropeRingA = createRopeRing({
  majorRadius: 1.95,
  waveRadius: 0.30,
  braidTurns: 9,
  strands: 10,
  tubeRadius: 0.045,
  blueColor: 0x08b8ff,
  purpleColor: 0x8d4dff,
  rotationX: 0.45,
  rotationY: 0,
  rotationZ: -0.18,
  scale: 1
})

coreGroup.add(ropeRingA)

// 垂直绳索环：替代原来的淡蓝色假圆环，也是编织绳结构
const ropeRingB = createRopeRing({
  majorRadius: 2.12,
  waveRadius: 0.23,
  braidTurns: 10,
  strands: 10,
  tubeRadius: 0.034,
  blueColor: 0x55ccff,
  purpleColor: 0x7f6bff,
  blueEmissive: 0x003855,
  purpleEmissive: 0x201066,
  rotationX: Math.PI / 2,
  rotationY: 0.22,
  rotationZ: 0.12,
  scale: 1
})

coreGroup.add(ropeRingB)

// 第三个极细辅助绳环：增强三维核心感，不是实体光环
const ropeRingC = createRopeRing({
  majorRadius: 2.22,
  waveRadius: 0.18,
  braidTurns: 11,
  strands: 8,
  tubeRadius: 0.024,
  blueColor: 0x2bc7ff,
  purpleColor: 0x6d4cff,
  blueEmissive: 0x002c44,
  purpleEmissive: 0x1d0044,
  rotationX: Math.PI / 2.4,
  rotationY: Math.PI / 2.8,
  rotationZ: -0.18,
  scale: 1
})

coreGroup.add(ropeRingC)

/* =========================
   工具函数
========================= */

function makeLine(group, a, b, opacity = 0.16) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b])
  const material = new THREE.LineBasicMaterial({
    color: 0x355cff,
    transparent: true,
    opacity
  })
  const line = new THREE.Line(geometry, material)
  group.add(line)
  return line
}

function createCategoryStar(color) {
  const shape = new THREE.Shape()
  const outerRadius = 0.50
  const innerRadius = 0.23
  const spikes = 5

  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }

  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: false
  })
  geometry.center()

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.35,
    metalness: 0.15,
    roughness: 0.45
  })

  return new THREE.Mesh(geometry, material)
}

function createKnotDot(color, radius = 0.055) {
  const group = new THREE.Group()
  const colorObj = new THREE.Color(color)

  const dotGeometry = new THREE.SphereGeometry(radius, 14, 14)
  const dotMaterial = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0.96
  })

  const dot = new THREE.Mesh(dotGeometry, dotMaterial)
  group.add(dot)

  const glowGeometry = new THREE.SphereGeometry(radius * 2.2, 14, 14)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  const dotGlow = new THREE.Mesh(glowGeometry, glowMaterial)
  group.add(dotGlow)

  const hitGeometry = new THREE.SphereGeometry(radius * 4.2, 12, 12)
  const hitMaterial = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0,
    depthWrite: false
  })

  const hitArea = new THREE.Mesh(hitGeometry, hitMaterial)
  group.add(hitArea)

  return group
}

function fibonacciSpherePositions(count, radius) {
  const points = []
  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = ((i * offset) - 1) + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment

    const x = Math.cos(phi) * r
    const z = Math.sin(phi) * r

    points.push(new THREE.Vector3(
      x * radius,
      y * radius,
      z * radius
    ))
  }

  return points
}

function getLocalBasis(normal) {
  const up = Math.abs(normal.y) < 0.95
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0)

  const tangent = new THREE.Vector3().crossVectors(up, normal).normalize()
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize()

  return { tangent, bitangent }
}

/* =========================
   数据组织
========================= */

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const clickable = []
const categoryNodes = []
const knotNodes = []
let hovered = null

const knotsByCategory = new Map()

KNOTS.forEach(knot => {
  if (!knotsByCategory.has(knot.categoryId)) {
    knotsByCategory.set(knot.categoryId, [])
  }
  knotsByCategory.get(knot.categoryId).push(knot)
})

/* =========================
   银河分组
========================= */

const galaxyGroup = new THREE.Group()
scene.add(galaxyGroup)

/* =========================
   分类球状布局
========================= */

const categoryRadius = 10.5
const categoryCenter = new THREE.Vector3(0, 0, 0)
const categoryPositions = fibonacciSpherePositions(CATEGORIES.length, categoryRadius)

CATEGORIES.forEach((cat, ci) => {
  const hub = categoryPositions[ci].clone()
  const normal = hub.clone().normalize()
  const { tangent, bitangent } = getLocalBasis(normal)

  // 分类五角星
  const hubMesh = createCategoryStar(cat.color)
  hubMesh.position.copy(hub)
  hubMesh.userData = {
    type: 'category',
    data: cat,
    baseScale: 1
  }

  galaxyGroup.add(hubMesh)
  clickable.push(hubMesh)
  categoryNodes.push(hubMesh)

  // 中心到分类连线
  makeLine(galaxyGroup, categoryCenter, hub, 0.16)

  // 分类周围的绳结点：形成局部三维小星云
  const groupKnots = knotsByCategory.get(cat.id) || []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  groupKnots.forEach((knot, ki) => {
    const angle = ki * goldenAngle
    const radial = 0.55 + Math.sqrt(ki + 1) * 0.26
    const around1 = Math.cos(angle) * radial
    const around2 = Math.sin(angle) * radial * 0.92
    const depth = ((ki % 7) - 3) * 0.16

    const offset = tangent.clone().multiplyScalar(around1)
      .add(bitangent.clone().multiplyScalar(around2))
      .add(normal.clone().multiplyScalar(depth))

    const pos = hub.clone().add(offset)

    const dotRadius =
      groupKnots.length > 50
        ? 0.045
        : groupKnots.length > 25
          ? 0.052
          : 0.060

    const dotNode = createKnotDot(cat.color, dotRadius)
    dotNode.position.copy(pos)
    dotNode.userData = {
      type: 'knot',
      data: knot,
      baseScale: 1
    }

    galaxyGroup.add(dotNode)
    clickable.push(dotNode)
    knotNodes.push(dotNode)

    if (ki % 4 === 0) {
      makeLine(galaxyGroup, hub, pos, 0.06)
    }
  })
})

/* =========================
   信息面板
========================= */

function getImageSrc(imagePath) {
  if (!imagePath) return ''

  // 如果是网络图片，直接使用
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // 去掉路径开头的 /
  const cleanPath = imagePath.replace(/^\/+/, '')

  // 自动补上 Vite 的 base 路径
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

function showKnotPanel(knot) {
  const imageSrc = getImageSrc(knot.image)

  const img = imageSrc
    ? `
      <img
        class="knotImage"
        src="${imageSrc}"
        alt="${knot.name}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div class="imagePlaceholder" style="display:none;">
        图片未找到：${imageSrc}
      </div>
    `
    : `
      <div class="imagePlaceholder">
        暂无图片
      </div>
    `

  panelContent.innerHTML = `
    <h2>${knot.name}</h2>
    <div class="english">${knot.english || 'English name to be completed'}</div>
    ${knot.alias ? `<div class="alias">别名：${knot.alias}</div>` : ''}
    ${img}
    <div class="meta"><b>分类：</b>${knot.category}</div>
    <div class="meta"><b>用途：</b>${knot.usage}</div>
    <div class="meta"><b>结构特点：</b>${knot.feature}</div>
    <div class="path">图片路径：${imageSrc || '未设置'}</div>
  `

  infoPanel.classList.remove('hidden')
}

function showCategoryPanel(cat) {
  const list = KNOTS
    .filter(knot => knot.categoryId === cat.id)
    .slice(0, 36)
    .map(knot => `<span>${knot.name}</span>`)
    .join('')

  panelContent.innerHTML = `
    <h2>${cat.name}</h2>
    <div class="english">Category Hub</div>
    <div class="imagePlaceholder large">该分类共 ${cat.count} 个绳结</div>
    <div class="meta"><b>说明：</b>这是由你上传的绳结分类文件提取的一级分类。</div>
    <div class="tagList">${list}</div>
  `

  infoPanel.classList.remove('hidden')
}

/* =========================
   交互
========================= */

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function findClickableParent(object) {
  let current = object

  while (current) {
    if (current.userData && current.userData.type) return current
    current = current.parent
  }

  return null
}

function resetHoverObject() {
  if (!hovered) return

  const base = hovered.userData.baseScale || 1
  hovered.scale.set(base, base, base)

  hovered = null
  tooltip.style.display = 'none'
  document.body.style.cursor = 'default'
}

function onPointerMove(event) {
  updatePointer(event)

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(clickable, true)
  const hitObject = hits.length ? findClickableParent(hits[0].object) : null

  if (!hitObject) {
    resetHoverObject()
    return
  }

  if (hovered && hovered !== hitObject) {
    resetHoverObject()
  }

  hovered = hitObject

  const base = hovered.userData.baseScale || 1
  const scale = hovered.userData.type === 'category'
    ? base * 1.35
    : base * 1.9

  hovered.scale.set(scale, scale, scale)

  const data = hovered.userData.data

  tooltip.textContent =
    hovered.userData.type === 'category'
      ? `${data.name}：${data.count} 个绳结`
      : `${data.name} · ${data.category}`

  tooltip.style.left = `${event.clientX + 14}px`
  tooltip.style.top = `${event.clientY + 14}px`
  tooltip.style.display = 'block'
  document.body.style.cursor = 'pointer'
}

function onPointerClick(event) {
  updatePointer(event)

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(clickable, true)

  if (!hits.length) return

  const obj = findClickableParent(hits[0].object)
  if (!obj) return

  if (obj.userData.type === 'knot') {
    showKnotPanel(obj.userData.data)
  }

  if (obj.userData.type === 'category') {
    showCategoryPanel(obj.userData.data)
  }
}

window.addEventListener('pointermove', onPointerMove)
window.addEventListener('click', onPointerClick)

/* =========================
   动画
========================= */

function animate() {
  requestAnimationFrame(animate)

  // 中心三重绳索核心旋转
  coreGroup.rotation.y += 0.0045
  coreGroup.rotation.z = Math.sin(Date.now() * 0.0006) * 0.06

  ropeRingA.rotation.y += 0.002
  ropeRingB.rotation.z -= 0.0016
  ropeRingC.rotation.x += 0.0012

  starField.rotation.y += 0.00028

  // 整个分类球轻微旋转，更容易看出球状结构
  galaxyGroup.rotation.y += 0.0012
  galaxyGroup.rotation.x = Math.sin(Date.now() * 0.00025) * 0.08

  // 分类五角星始终面向相机
  categoryNodes.forEach((node, index) => {
    node.quaternion.copy(camera.quaternion)
    node.rotateZ(Date.now() * 0.00035 + index * 0.3)
  })

  // 小节点轻微呼吸
  knotNodes.forEach((node, index) => {
    const pulse = 1 + Math.sin(Date.now() * 0.002 + index) * 0.06
    if (node !== hovered) {
      node.scale.set(pulse, pulse, pulse)
    }
  })

  controls.update()
  renderer.render(scene, camera)
}

animate()

/* =========================
   自适应
========================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})