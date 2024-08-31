#!/bin/bash

DIR_NAMES="$(dirname "$0")/../tmp $(dirname "$0")/../log $(dirname "$0")/../backup"

for dir in $DIR_NAMES; do

    if [ ! -d "$dir" ]; then
        echo "Creating dir $dir..."
        mkdir -p "$dir"
        if [ $? -ne 0 ]; then
            echo "Could not create dir $dir"
            exit $?
        fi
    else
        echo "$dir already exists."
    fi
done

exit 0
