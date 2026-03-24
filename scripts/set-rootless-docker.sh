#!/bin/bash
set -e

# Rootless Docker Installation Script
# Custom directory: /home/$USER/goinfre/docker

CUSTOM_DOCKER_DIR="/home/$USER/goinfre/docker"

echo "=== Rootless Docker Installation Script ==="
echo "Custom directory: $CUSTOM_DOCKER_DIR"
echo ""

# Function to check if command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# 1. Check if dependencies are available (without sudo)
echo "Step 1: Checking dependencies..."

MISSING_DEPS=""

if ! command -v newuidmap &> /dev/null; then
    echo "Warning: newuidmap not found. uidmap package may be missing."
    MISSING_DEPS="$MISSING_DEPS uidmap"
fi

if ! command -v iptables &> /dev/null; then
    echo "Warning: iptables not found. iptables package may be missing."
    MISSING_DEPS="$MISSING_DEPS iptables"
fi

if [ -n "$MISSING_DEPS" ]; then
    echo "Missing dependencies:$MISSING_DEPS"
    echo "Please install these packages using your package manager if possible."
    echo "Continuing with installation, but Docker may not work correctly."
fi

# Check for kernel.unprivileged_userns_clone setting
if [ -f /proc/sys/kernel/unprivileged_userns_clone ]; then
    if [ "$(cat /proc/sys/kernel/unprivileged_userns_clone)" != "1" ]; then
        echo "Warning: kernel.unprivileged_userns_clone is not set to 1."
        echo "Rootless Docker may not work. You may need to:"
        echo "  echo 'kernel.unprivileged_userns_clone=1' | sudo tee /etc/sysctl.d/50-rootless.conf"
        echo "  sudo sysctl --system"
    fi
fi

# 2. Install rootless Docker
echo ""
echo "Step 2: Installing rootless Docker..."

# Check if Docker is already installed
if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
    echo "Docker is already installed. Skipping installation."
else
    curl -fsSL https://get.docker.com/rootless | sh
    check_error "Failed to install rootless Docker"
fi

# 3. Set up environment variables
echo ""
echo "Step 3: Configuring environment variables..."

SHELL_CONFIG=""
if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Remove existing Docker environment variables if present
    sed -i '/# Docker rootless configuration/d' "$SHELL_CONFIG"
    sed -i '/export PATH=\/home\/$USER\/bin:\$PATH/d' "$SHELL_CONFIG"
    sed -i '/export DOCKER_HOST=unix:\/\/\/run\/user\/\$UID\/docker.sock/d' "$SHELL_CONFIG"
    sed -i '/export DOCKER_CONTAINERS_PATH=/d' "$SHELL_CONFIG"

    # Add new configuration
    cat >> "$SHELL_CONFIG" << EOF

# Docker rootless configuration
export PATH=/home/\$USER/bin:\$PATH
export DOCKER_HOST=unix:///run/user/\$UID/docker.sock
export DOCKER_CONTAINERS_PATH=/home/\$USER/goinfre/docker/containers
EOF
    echo "Environment variables added to $SHELL_CONFIG"
else
    echo "Warning: Could not find .bashrc or .zshrc. Please add manually:"
    echo "export PATH=/home/\$USER/bin:\$PATH"
    echo "export DOCKER_HOST=unix:///run/user/\$UID/docker.sock"
    echo "export DOCKER_CONTAINERS_PATH=/home/\$USER/goinfre/docker/containers"
fi

# 4. Create custom Docker directory and containers subdirectory
echo ""
echo "Step 4: Creating custom Docker directories..."

mkdir -p "$CUSTOM_DOCKER_DIR"
check_error "Failed to create directory: $CUSTOM_DOCKER_DIR"

mkdir -p "$CUSTOM_DOCKER_DIR/containers"
check_error "Failed to create containers directory: $CUSTOM_DOCKER_DIR/containers"

echo "Created directories:"
echo "  - $CUSTOM_DOCKER_DIR"
echo "  - $CUSTOM_DOCKER_DIR/containers"

# 5. Configure Docker daemon with custom data directory
echo ""
echo "Step 5: Configuring Docker daemon with custom data directory..."

DOCKER_CONFIG_DIR="$HOME/.config/docker"
mkdir -p "$DOCKER_CONFIG_DIR"

# Create daemon.json with custom data-root
cat > "$DOCKER_CONFIG_DIR/daemon.json" << EOF
{
  "data-root": "$CUSTOM_DOCKER_DIR"
}
EOF
check_error "Failed to create daemon.json"

echo "Docker daemon configured with data-root: $CUSTOM_DOCKER_DIR"

# 6. Start Docker service
echo ""
echo "Step 6: Starting Docker service..."

# Stop any existing Docker service
systemctl --user stop docker.service docker.socket 2>/dev/null || true

# Reload systemd user daemon
systemctl --user daemon-reload

# Start Docker service
systemctl --user start docker.service
check_error "Failed to start Docker service"

# Enable Docker to start on login
systemctl --user enable docker.service 2>/dev/null || true

# 7. Verify installation
echo ""
echo "Step 7: Verifying installation..."

# Wait for Docker to be ready
sleep 3

# Set environment for current session
export PATH=/home/$USER/bin:$PATH
export DOCKER_HOST=unix:///run/user/$UID/docker.sock
export DOCKER_CONTAINERS_PATH=/home/$USER/goinfre/docker/containers

# Test Docker
if docker info &> /dev/null 2>&1; then
    echo "✓ Docker is running"

    # Check data directory
    DOCKER_ROOT=$(docker info 2>/dev/null | grep "Docker Root Dir" | awk '{print $4}')
    echo "✓ Docker data directory: $DOCKER_ROOT"

    if [ "$DOCKER_ROOT" = "$CUSTOM_DOCKER_DIR" ]; then
        echo "✓ Custom directory is correctly configured"
    else
        echo "⚠ Warning: Docker root dir is $DOCKER_ROOT, expected $CUSTOM_DOCKER_DIR"
    fi

    # Test with hello-world
    echo ""
    echo "Running hello-world test..."
    if docker run hello-world &> /dev/null 2>&1; then
        echo "✓ Docker is working correctly!"
    else
        echo "⚠ Docker is running but hello-world test failed. You may need to log out and back in."
    fi
else
    echo "⚠ Docker is not running. You may need to log out and back in."
    echo "After logging back in, run: docker info"
fi

# 8. Display final instructions
echo ""
echo "=== Installation Complete ==="
echo ""
echo "To complete the setup:"
echo "1. Log out and log back in (or run: exec $SHELL -l)"
echo "2. Verify Docker is working: docker info"
echo "3. Check data directory: docker info | grep 'Docker Root Dir'"
echo "4. Check containers path: echo \$DOCKER_CONTAINERS_PATH"
echo ""
echo "Custom directories:"
echo "  - Docker root: $CUSTOM_DOCKER_DIR"
echo "  - Containers: $CUSTOM_DOCKER_DIR/containers"
echo "  - Docker daemon config: $DOCKER_CONFIG_DIR/daemon.json"
echo ""
echo "Environment variables set:"
echo "  - PATH: /home/\$USER/bin:\$PATH"
echo "  - DOCKER_HOST: unix:///run/user/\$UID/docker.sock"
echo "  - DOCKER_CONTAINERS_PATH: $CUSTOM_DOCKER_DIR/containers"
echo ""
echo "Useful commands:"
echo "  - Start Docker: systemctl --user start docker"
echo "  - Stop Docker: systemctl --user stop docker"
echo "  - Check status: systemctl --user status docker"
echo "  - View logs: journalctl --user -u docker"


# transformar em executavel
# checar se é root?
# - talvez nao incluir script, só rodar nas nossas máquinas e setar rootless docker pra gente.
