#!/bin/bash

ENV_PATH="$(dirname "$0")/../.env"

# Creating .env if it does not exist
if [ ! -f "$ENV_PATH" ]; then
    echo ".env not found"
    echo "Creating .env file at $ENV_PATH..."
    {
        echo "PORT=6969"
        echo "DB_USER=root"
        echo "DB_PASSWORD=root"
        echo "DB_NAME=TLP"
        echo "DB_HOST=localhost"
    } > "$ENV_PATH"
    echo ".env file created successfully."
else
    echo "File $ENV_PATH already exists."
fi

# Creating required directory
bash "$(dirname "$0")/make-dirs.sh"

echo "Trying to create database..."
# Create database and tables
bash "$(dirname "$0")/make-db.sh"

if [ $? -ne 0 ]; then
    echo "Could not create database"
    exit 1
else
    echo "Database created successfully"
fi

cat "$(dirname "$0")/server-ready.txt"

exit 0
