#!/bin/bash

# Prompting user for module name
read -p "Enter Module Name: " name

mpath="$(dirname "$0")/../src/$name"

# Attempting to create the module directory
mkdir "$mpath"

if [ $? -ne 0 ]; then
    echo "Module can't be created since another module with the same name already exists"
    exit $?
fi

# Creating index.ts file
cat <<EOT > "$mpath/index.ts"
import { Router } from "express";

const router = Router();

// Defining the core path from which this module should be accessed

export default router;
EOT

# Creating routes.ts file
cat <<EOT > "$mpath/routes.ts"
import { Router } from "express";

const router: Router = Router();

// Registering all the module routes here


export default router;
EOT

# Creating an empty controller.ts file
touch "$mpath/controller.ts"

echo "Module created at $mpath"
echo
echo "Happy Coding :)"
