#!/usr/bin/env node
import { find } from '../lib/version.js'
import { get } from '../lib/package.js'
import { merge } from '../lib/project.js'

const project: string = process.cwd()

async function start(filtList: string[] = []) {
     filtList = ['vue', 'vue-i18n', '@vue/runtime-core', 'vite', ...filtList]
     const version = await find('@dcloudio/vite-plugin-uni')
     const deps = await get(filtList, version)
     await merge(project, deps, 'pnpm')
}

start()