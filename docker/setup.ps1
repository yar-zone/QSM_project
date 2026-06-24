param(
    [switch]$Up,
    [switch]$Build,
    [switch]$Down,
    [switch]$Restart,
    [switch]$Artisan,
    [switch]$Migrate,
    [switch]$Seed,
    [switch]$Test
)

$composeFile = Join-Path (Split-Path $PSScriptRoot -Parent) "docker-compose.yml"

function Run-Artisan {
    param([string]$Cmd)
    docker compose -f $composeFile exec qsm-backend php artisan $Cmd
}

switch ($true) {
    $Down {
        docker compose -f $composeFile down
    }
    $Restart {
        docker compose -f $composeFile restart
    }
    $Migrate {
        Run-Artisan "migrate --force"
    }
    $Seed {
        Run-Artisan "db:seed --force"
    }
    $Test {
        Run-Artisan "test"
    }
    $Artisan {
        Run-Artisan $args[0]
    }
    $Build {
        docker compose -f $composeFile build --no-cache
    }
    default {
        docker compose -f $composeFile up -d --build
        Write-Host ""
        Write-Host " QSM is starting up..." -ForegroundColor Cyan
        Write-Host "   Frontend : http://localhost" -ForegroundColor Green
        Write-Host "   API      : http://localhost/api" -ForegroundColor Green
        Write-Host ""
        Write-Host " Run setup.ps1 -Migrate to run migrations" -ForegroundColor Yellow
        Write-Host " Run setup.ps1 -Seed to seed the database" -ForegroundColor Yellow
        Write-Host " Run setup.ps1 -Down to stop containers" -ForegroundColor Yellow
    }
}
