const { copyFile, mkdir } = require('fs/promises');
const { dirname, resolve } = require('path');
const { glob } = require('glob');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const SRC_FOLDER_NAME = 'src';
const DIST_FOLDER_NAME = 'dist';

async function main() {
	const globOptions = { ignore: 'node_modules/**' };

	await transpileTsToJs(globOptions);
	await copyRemainingFilesToDistFolder(globOptions);
}

main().catch(console.error);

async function transpileTsToJs(globOptions) {
	const tsFiles = await glob(`${SRC_FOLDER_NAME}/**/*.ts`, globOptions);
	const entryPoints = tsFiles.map((f) => resolve(f).replace(`${process.cwd()}/`, ''));
	const buildContextOptions = {
		entryPoints,
		format: 'cjs',
		bundle: false,
		outbase: SRC_FOLDER_NAME,
		outdir: `./${DIST_FOLDER_NAME}`,
		platform: 'node',
		plugins: [nodeExternalsPlugin()]
	};
	const build = await esbuild.context(buildContextOptions);

	build.rebuild();
	build.dispose();

	entryPoints.forEach((fileName) => {
		console.log(`[TRANSPILED] ${fileName}`);
	});
}

async function copyRemainingFilesToDistFolder(globOptions) {
	const remainingFiles = await glob(`${SRC_FOLDER_NAME}/**/*.!(ts)`, globOptions);

	for await(const fileName of remainingFiles) {
		const distFileName = fileName.replace(new RegExp(`^(${SRC_FOLDER_NAME})\/`), `${DIST_FOLDER_NAME}/`);

		await mkdir(dirname(distFileName), { recursive: true });
		await copyFile(fileName, distFileName);
		console.log(`[COPIED] ${fileName}`);
	}
}
