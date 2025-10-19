#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    print_error "Working directory is not clean. Please commit or stash your changes."
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Parse version number type (major, minor, patch)
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    print_error "Invalid version type. Use: major, minor, or patch"
    echo "Usage: $0 [major|minor|patch]"
    exit 1
fi

print_info "Bumping $VERSION_TYPE version..."

# Bump version using npm
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
print_info "New version: $NEW_VERSION"

# Confirm before proceeding
echo ""
read -p "$(echo -e ${YELLOW}Proceed with release v$NEW_VERSION? \(y/n\): ${NC})" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warn "Release cancelled. Reverting version change..."
    git restore package.json package-lock.json
    exit 0
fi

# Commit the version change
print_info "Committing version bump..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create signed and annotated tag
print_info "Creating signed tag v$NEW_VERSION..."
git tag -s "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push commits and tags
print_info "Pushing to remote..."
git push origin $(git branch --show-current)
git push origin "v$NEW_VERSION"

print_info "✅ Release v$NEW_VERSION completed successfully!"
print_info "Tag created: v$NEW_VERSION (signed)"
