[![npm version](https://img.shields.io/npm/v/@itrocks/dependency?logo=npm)](https://www.npmjs.org/package/@itrocks/dependency)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/dependency)](https://www.npmjs.org/package/@itrocks/dependency)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/dependency?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/dependency)
[![issues](https://img.shields.io/github/issues/itrocks-ts/dependency)](https://github.com/itrocks-ts/dependency/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# dependency

Builds a dependency-sorted list of Nodes.js modules.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/dependency
```

This package is meant to be used in a Node.js environment. It scans the
installed modules starting from a given directory and returns their names
ordered so that every package appears **after** all its dependencies.

## Usage

`@itrocks/dependency` exposes a single async helper: `dependencies`.

It inspects the installed packages (those visible from the given
directory) and builds a list of package names sorted in dependency order.
If a cyclic dependency is detected, the function rejects with an error
describing the cycle.

By default, it starts from the application directory detected by
`@itrocks/app-dir`, so in many cases you can simply call it without
arguments.

### Minimal example

```ts
import { dependencies } from '@itrocks/dependency'

async function main ()
{
	const ordered = await dependencies()

	console.log('Packages in dependency order:')
	for (const name of ordered) {
		console.log(' -', name)
	}
}

main().catch((error) => {
	console.error('Unable to compute dependencies:', error)
	process.exitCode = 1
})
```

### Complete example – running tasks in dependency order

The typical use‑case is to perform some work (build, migration,
initialisation, checks, …) module by module, while ensuring that each
module is processed **after** all the modules it depends on.

```ts
import { dependencies } from '@itrocks/dependency'
import { spawn }        from 'node:child_process'
import { promisify }    from 'node:util'

const spawnAsync = promisify(spawn)

async function runBuildsInOrder ()
{
	// Compute the list of installed packages in dependency order
	const ordered = await dependencies() // starts from your app directory

	for (const pkg of ordered) {
		// Here we arbitrarily decide to run an npm script on each package.
		// You could instead require a file, run database migrations, etc.
		console.log('Building', pkg)
		await spawnAsync('npm', ['run', 'build', '--workspace', pkg], {
			stdio: 'inherit',
		})
	}
}

runBuildsInOrder().catch((error) => {
	console.error('Build aborted because of dependency issue:', error)
	process.exitCode = 1
})
```

In the example above, `@itrocks/dependency` is responsible only for the
ordering. What you actually do with each package (`npm run build`,
custom scripts, migrations, checks, …) is entirely up to your
application.

## API

### `dependencies(path?: string): Promise<string[]>`

Builds and returns a list of installed packages ordered so that each
package appears after all of its dependencies.

The function looks at the packages that are installed under the provided
`path` (or the application directory if omitted) and analyses their
`dependencies` declared in `package.json`.

#### Parameters

- `path` *(optional)* – base directory from which installed packages are
  discovered. It should normally be the root of your application or
  workspace (where `node_modules` can be resolved). If not provided, the
  default application directory from `@itrocks/app-dir` is used.

#### Return value

Returns a `Promise` that resolves to an array of package names
(`string[]`).

The order guarantees that, whenever package **A** depends on package
**B**, **B** appears **before** **A** in the resulting array.

#### Errors

The `Promise` is rejected in particular when:

- a **cyclic dependency** is detected between some of the installed
  packages. The error message lists the packages involved in the cycle;
- an underlying error occurs while listing installed packages
  (filesystem access problems, invalid `package.json`, etc.).

You should treat any rejection as a signal that the dependency graph of
the current installation is not valid for ordered processing.

## Typical use cases

- Running **build scripts** for a set of internal packages in a
  dependency‑safe order.
- Applying **database migrations** or **initialisation scripts** for
  feature modules whose code is distributed across several packages.
- Generating **documentation** or **reports** that need to aggregate
  information from each package only after its dependencies have been
  analysed.
- Checking for **dependency graph issues** in a project (for example as
  part of a CI step that fails when cycles are introduced).
- Implementing custom **orchestration tools** for monorepos or modular
  backends without writing your own dependency‑resolution logic.
