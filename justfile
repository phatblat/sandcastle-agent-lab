# List available project recipes.
default:
  @just --list

# Install pinned dependencies without package lifecycle scripts.
install:
  npm ci --ignore-scripts

# Validate Sandcastle provider command construction.
smoke:
  npm run smoke

# Run the project test entrypoint.
test:
  npm test

# Run local quality gates.
check: test
