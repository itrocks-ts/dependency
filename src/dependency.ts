import { appDir }        from '@itrocks/app-dir'
import { DepGraph }      from 'dependency-graph'
import { listInstalled } from 'list-installed'

export async function dependencies(path = appDir)
{
	const dependencies = new Map<string, string[]>
	const graph        = new DepGraph<string>()
	for (const [packageName, packageJson] of (await listInstalled(path)).entries()) {
		dependencies.set(packageName, Object.keys(packageJson.dependencies ?? {}))
	}
	for (const packageName of dependencies.keys()) {
		graph.addNode(packageName)
	}
	for (const [packageName, packageDependencies] of dependencies.entries()) {
		if (packageName.startsWith('@itrocks')) console.log('deps of', packageName + ':')
		for (const dependency of packageDependencies) {
			if (dependencies.has(dependency)) {
				if (packageName.startsWith('@itrocks')) console.log('>', dependency)
				graph.addDependency(packageName, dependency)
			}
		}
	}
	return graph.overallOrder()
}
