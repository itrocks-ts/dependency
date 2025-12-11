import { appDir }        from '@itrocks/app-dir'
import { listInstalled } from 'list-installed'

export async function dependencies(path = appDir)
{
	const dependencies = new Map<string, Set<string>>
	const already      = new Set<string>
	const result       = new Array<string>
	// list installed packages and their dependencies
	for (const [packageName, packageJson] of (await listInstalled(path)).entries()) {
		const packageDependencies = new Set<string>
		for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
			if (!already.has(dependency)) {
				packageDependencies.add(dependency)
			}
		}
		if (packageDependencies.size) {
			dependencies.set(packageName, packageDependencies)
		}
		else {
			already.add(packageName)
			result.push(packageName)
		}
	}
	// remove not-installed dependencies
	for (const [packageName, packageDependencies] of dependencies.entries()) {
		for (const dependency of packageDependencies) {
			if (!dependencies.has(dependency)) {
				packageDependencies.delete(dependency)
			}
		}
		if (!packageDependencies.size) {
			dependencies.delete(packageName)
			already.add(packageName)
			result.push(packageName)
		}
	}
	// sort packages by their dependencies
	let didSomething = true
	while (dependencies && didSomething) {
		didSomething = false
		for (const [packageName, packageDependencies] of dependencies.entries()) {
			for (const dependency of packageDependencies) {
				if (already.has(dependency)) {
					packageDependencies.delete(dependency)
				}
			}
			if (!packageDependencies.size) {
				dependencies.delete(packageName)
				already.add(packageName)
				result.push(packageName)
				didSomething = true
			}
		}
	}
	// cyclic dependency error
	if (dependencies.size) {
		throw 'Cyclic dependencies: ' + new Array(dependencies.keys()).join(', ')
	}
	// done
	return result
}
