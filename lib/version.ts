import { getHbuilderxRelease, getPlugin } from './api.js'

const versionReg = /\d+\.\d+\.\d+(-alpha)?-(\d+)/

function approximateCode(a: string, b: string, strict?: boolean) {
  if (strict) {
    return Number(a) === Number(b)
  }
  // < 9
  return Math.min(Number(a), 9) === Math.min(Number(b), 9)
}

function approximateDate(a: string, b: string) {
  function toTime(str: string) {
    return new Date(`${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6)}`).getTime()
  }
  // <= 2d
  const diff = (toTime(a) - toTime(b)) / 86400000
  return Math.abs(diff) <= 2 ? (2 - Math.abs(diff) + (diff > 0 ? 0.1 : 0)) * 10000 : 0
}

async function getHbuilderxVersion() {
  const hbuilderxRes = await getHbuilderxRelease()
  const { version } = (await hbuilderxRes.json()) as { version: string }
  return version
}

async function getPluginVersion(name: string) {
  const pluginRes = await getPlugin(name)
  const { versions } = (await pluginRes.json()) as { versions: string }
  return Object.keys(versions)
}

export async function find(plugin: string) {
  let target = 'latest'
  const isVue3 = true

  let nextVersion
  target = await getHbuilderxVersion()

  const result = target.match(/^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?(-alpha)?$/)
  if (!result) {
    throw new Error('Invalid version: ' + target)
  }

  let [_, tv1, tv2, tv3, tv4, tAlpha] = result
  // fix HBuilderX odd version
  if (tv3?.length === 10) {
    tv4 = tv3.substring(0, 8)
    tv3 = tv2?.length === 1 ? '0' : tv2?.[1]
    tv2 = tv2?.[0]
  }
  // Vue2 && <3.6
  if (!tv4 && Number(tv3) >= 9 && !isVue3 && (Number(tv1) < 3 || (tv1 === '3' && Number(tv2) < 6))) {
    throw new Error('Need full version: ' + target.replace(/^(\d+\.\d+\.\d+)/, '$1.????????'))
  }

  const pluginVersion = await getPluginVersion(plugin)

  let nextVersionFix = 0
  function compare(version: string, oAlpha: string, ov1: string, ov2: string, ov3: string, ov4: string, ov5: string, strict?: boolean) {
    const dataDiff = approximateDate(tv4 || ov4, ov4)
    const fix = dataDiff + Number(ov5)
    if (approximateCode(tv1!, ov1) && approximateCode(tv2!, ov2, strict) && approximateCode(tv3!, ov3, strict) && dataDiff && fix > nextVersionFix) {
      if (isVue3 || tAlpha === oAlpha) {
        nextVersion = version
        nextVersionFix = fix
      }
    }
  }

  for (let i = 0; i < pluginVersion.length; i++) {
    const version = pluginVersion[i]
    const result = version?.match(versionReg)
    if (result) {
      const [_, oAlpha, oString] = result
      switch (oString?.length) {
        case 16: {
          const matchResult = oString.match(/(\d)(\d{2})(\d{2})(\d{8})(\d{3})/)
          if (matchResult) {
            const [_, ov1, ov2, ov3, ov4, ov5] = matchResult
            compare(version!, oAlpha!, ov1!, ov2!, ov3!, ov4!, ov5!, true)
          }
          break
        }
        case 14: {
          const matchResult = oString.match(/(\d)(\d)(\d)(\d{8})(\d{3})/)
          if (matchResult) {
            const [_, ov1, ov2, ov3, ov4, ov5] = matchResult
            compare(version!, oAlpha!, ov1!, ov2!, ov3!, ov4!, ov5!)
          }
          break
        }
        default:
          break
      }
    }
  }
  if (!nextVersion) {
    throw new Error('Not find version: ' + target)
  }

  return nextVersion
}