#!/bin/bash

# Define the package names in an array
packages=(
  "@kunnusta/node-red-contrib-aws"
  "@kunnusta/node-red-contrib-mimir"
  "@kunnusta/node-red-contrib-utility"
)

# Navigate to the .node-red directory and uninstall each package
cd ~/.node-red || exit
for package in "${packages[@]}"; do
  npm uninstall "$package"
done
