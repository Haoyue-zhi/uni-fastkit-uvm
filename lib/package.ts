import { getDependencies } from './api.js'

function parse(
  source: Record<string, any>,
  pluginVersion: string,
  version: string,
  filtList: string[]
): Record<string, any> {
  const result: Record<string, any> = {}
  if (!source) return result

  for (const key in source) {
    if (filtList.includes(key)) {
      continue
    }
    const value = source[key]
    result[key] = value === pluginVersion ? version : value
  }

  return result
}

async function getDependenciesList(version: string) {
  const response = await getDependencies(version)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return (await response.json()) as Record<string, any>
}

export async function get(
  filtList: string[],
  version: string,
  origin = version
): Promise<{
  dependencies: Record<string, any>
  devDependencies: Record<string, any>
}> {
  const pkg = {
    dependencies: {},
    devDependencies: {}
  }

  try {
    const data = await getDependenciesList(version)
    const pluginVersion: string = data.devDependencies?.['@dcloudio/vite-plugin-uni']

    if (!pluginVersion) {
      throw new Error(`Plugin version not found in ${version}`)
    }
    pkg.dependencies = parse(data.dependencies, pluginVersion, version, filtList)
    pkg.devDependencies = parse(data.devDependencies, pluginVersion, version, filtList)
  } catch (error) {
    // 记录错误但不中断流程
    console.warn(`Failed to fetch package.json for version ${version}:`, error)

    // 尝试降级版本
    const versionParts = version.split('')
    const lastDigit = Number(versionParts[versionParts.length - 1])

    if (!isNaN(lastDigit) && lastDigit > 1) {
      versionParts[versionParts.length - 1] = String(lastDigit - 1)
      return await get(filtList, versionParts.join(''), origin)
    }

    // 如果已经是原始版本或者无法降级，则抛出错误
    if (version === origin) {
      throw new Error(`Unable to resolve valid version starting from: ${origin}`)
    }

    // 回退到原始版本重试
    return await get(filtList, origin, origin)
  }

  return pkg
}