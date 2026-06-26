#!/bin/bash
set -e

# Wait for any necessary services if needed
# Example: wait for database

# Run migrations if needed (uncomment if using database)
# php artisan migrate --force

# Start the Laravel development server
php artisan serve --host=0.0.0.0 --port=8000
