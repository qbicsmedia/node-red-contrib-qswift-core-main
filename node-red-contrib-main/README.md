# node-red-contrib

Monorepo for various node packages for the Kunnusta workflow engine.

# Quick setup notes
- Check out this repository
- Change into `node-red-contrib` folder
- Install necessary npm packages with `npm i`
- Build nodes with `npm run build`

# Packages
Nodes/Plugins of a package are linked to their `dist` folder therefore they have to be built first.

Either run `npm run build` at root level for all packages or inside a package itself.
- Typescript files in the `src` folder will be transpiled with esbuild and output into the `dist` folder.
- All other (non-typescript) files will be copied over to the `dist` folder.

A working package should only need the `package.json` and its `dist` folder.
