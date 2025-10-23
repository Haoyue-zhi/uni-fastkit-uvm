import { spawn } from 'node:child_process'
function parseDeps(dependencies: any) {
    return Object.keys(dependencies).map(key => `${key}@${dependencies[key]}`)
}

export async function merge(
    projectPath: string,
    packageInfo: {
        dependencies: Record<string, any>
        devDependencies: Record<string, any>
    },
    manager: 'pnpm') {
    const args = ['add']
    async function spawnAsync(manager: any, args: any) {
        const child = spawn(manager, args, { stdio: 'inherit', cwd: projectPath })
        return new Promise((resolve, reject) => {
            child.on('error', reject)
            child.on('exit', resolve)
        })
    }
    await spawnAsync(manager, [...args, ...parseDeps(packageInfo.dependencies)])
    await spawnAsync(manager, [...args, ...parseDeps(packageInfo.devDependencies), '-D'])
}