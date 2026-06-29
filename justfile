# List available project recipes.
_default:
    @just --list

# Install pinned dependencies without package lifecycle scripts.
deps:
    npm ci --ignore-scripts

# Validate Sandcastle provider command construction.
smoke:
    npm run smoke

# Run the project test entrypoint.
test:
    npm test

# Run local quality gates.
check: test
