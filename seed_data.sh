#!/bin/bash

# Configuration
SQL_FILE="seed_data.sql"
POSTGRES_CONTAINER="crm-postgres"
DB_USER="crm_admin"
INIT_DB="identity_db"

echo "Starting generic business data seeding via direct SQL injection..."

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: $SQL_FILE not found in the current directory."
    exit 1
fi

echo "Copying SQL script to the Postgres container..."
docker cp $SQL_FILE $POSTGRES_CONTAINER:/tmp/$SQL_FILE

echo "Executing SQL script..."
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $INIT_DB -f /tmp/$SQL_FILE

if [ $? -eq 0 ]; then
    echo -e "\nDatabase seeding completed successfully!"
else
    echo -e "\nDatabase seeding failed. Check the error messages above."
fi
