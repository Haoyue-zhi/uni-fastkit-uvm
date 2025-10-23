#!/usr/bin/env node
import { find } from './version.js'
import { get } from './package.js'
import { merge } from './project.js'

const project: string = process.cwd()

async function start(filtList: string[] = [
     'vue',
     'vue-i18n',
     '@vue/runtime-core',
     'vite'
]) {
     const version = await find('@dcloudio/vite-plugin-uni')
     const deps = await get(filtList, version)
     await merge(project, deps, 'pnpm')
}

start()

export { start as uvm }