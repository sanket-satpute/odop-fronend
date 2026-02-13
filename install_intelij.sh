#!/bin/bash

set -e

echo "🚀 Removing old IntelliJ Snap packages..."
sudo snap remove intellij-idea-community || true
sudo snap remove intellij-idea-ultimate || true

echo "🚀 Creating apps directory..."
mkdir -p ~/apps
cd ~/apps

echo "🚀 Downloading JetBrains Toolbox..."
wget -O jetbrains-toolbox.tar.gz https://download.jetbrains.com/toolbox/jetbrains-toolbox-2.4.2.32922.tar.gz

echo "🚀 Extracting Toolbox..."
tar -xvzf jetbrains-toolbox.tar.gz
TOOLBOX_DIR=$(find . -maxdepth 1 -type d -name "jetbrains-toolbox-*")
cd "$TOOLBOX_DIR"

echo "🚀 Running Toolbox for the first time..."
./jetbrains-toolbox &

echo "✅ JetBrains Toolbox installed successfully!"
echo "👉 Use Toolbox to install IntelliJ IDEA Community or Ultimate."
echo "   It will also handle updates automatically."

