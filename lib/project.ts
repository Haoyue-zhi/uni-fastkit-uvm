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
) {
    const args = ['add']
    async function spawnAsync(args: any) {
        const child = spawn('pnpm', args, { stdio: 'inherit', cwd: projectPath })
        return new Promise((resolve, reject) => {
            child.on('error', reject)
            child.on('close', resolve)
        })
    }
    await spawnAsync([...args, ...parseDeps(packageInfo.dependencies)])
    await spawnAsync([...args, ...parseDeps(packageInfo.devDependencies), '-D'])
}
