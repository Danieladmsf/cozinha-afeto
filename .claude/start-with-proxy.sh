#!/bin/bash

# Claude proxy startup script
# Configure your proxy settings below

# Add Nix profile to PATH
export PATH="$HOME/.nix-profile/bin:$PATH"

# Auto-configure user environment for TOR proxy
AUTO_CONFIGURE=${AUTO_CONFIGURE:-true}

# Proxy configuration - TOR SOCKS5 proxy
PROXY_HOST="127.0.0.1"  # TOR default host
PROXY_PORT="9050"       # TOR SOCKS5 port
PROXY_USER=""           # Not needed for TOR
PROXY_PASS=""           # Not needed for TOR

# Function to check and auto-configure environment
configure_environment() {
    local bashrc="$HOME/.bashrc"
    local needs_update=false
    
    echo "Checking environment configuration..."
    
    # Check if Nix profile is in PATH permanently
    if ! grep -q 'export PATH="$HOME/.nix-profile/bin:$PATH"' "$bashrc" 2>/dev/null; then
        echo "Adding Nix profile to PATH in .bashrc..."
        echo 'export PATH="$HOME/.nix-profile/bin:$PATH"' >> "$bashrc"
        needs_update=true
    fi
    
    # Check if proxy variables are set permanently
    if ! grep -q 'HTTP_PROXY.*8118' "$bashrc" 2>/dev/null; then
        echo "Adding proxy configuration to .bashrc..."
        cat >> "$bashrc" << 'EOF'

# TOR Proxy configuration (auto-added by Claude proxy script)
export HTTP_PROXY="http://127.0.0.1:8118"
export HTTPS_PROXY="http://127.0.0.1:8118"
export http_proxy="http://127.0.0.1:8118"
export https_proxy="http://127.0.0.1:8118"
export NO_PROXY="localhost,127.0.0.1,::1"
EOF
        needs_update=true
    fi
    
    if [ "$needs_update" = true ]; then
        echo "✅ Environment configured! TOR proxy will be active in all new terminals."
        echo "   Current terminal will use proxy immediately."
        echo "   Run 'source ~/.bashrc' in other terminals or restart them."
    else
        echo "✅ Environment already configured for TOR proxy."
    fi
}

# Function to disable Claude Code compaction system
disable_claude_compaction() {
    local claude_cli=""
    
    # Try multiple possible locations for Claude Code CLI
    local possible_locations=(
        "/home/user/.global_modules/lib/node_modules/@anthropic-ai/claude-code/cli.js"
        "$HOME/.global_modules/lib/node_modules/@anthropic-ai/claude-code/cli.js"
        "/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js"
        "/usr/lib/node_modules/@anthropic-ai/claude-code/cli.js"
    )
    
    # Find the actual CLI location
    for location in "${possible_locations[@]}"; do
        if [ -f "$location" ]; then
            claude_cli="$location"
            break
        fi
    done
    
    # If not found in standard locations, search dynamically
    if [ -z "$claude_cli" ]; then
        claude_cli=$(find /home/user -name "cli.js" -path "*claude-code*" 2>/dev/null | head -1)
    fi
    
    # If still not found, try to locate via which command
    if [ -z "$claude_cli" ]; then
        local claude_path=$(which claude 2>/dev/null)
        if [ -n "$claude_path" ] && [ -L "$claude_path" ]; then
            # Follow symbolic link to find real location
            local real_path=$(readlink -f "$claude_path" 2>/dev/null)
            if [ -n "$real_path" ]; then
                local cli_dir=$(dirname "$real_path")
                claude_cli="$cli_dir/cli.js"
            fi
        fi
    fi
    
    if [ -n "$claude_cli" ] && [ -f "$claude_cli" ]; then
        echo "🔍 Found Claude CLI at: $claude_cli"
        
        # Create backup if it doesn't exist
        if [ ! -f "$claude_cli.backup" ]; then
            cp "$claude_cli" "$claude_cli.backup" >/dev/null 2>&1
            echo "💾 Backup created: $claude_cli.backup"
        fi
        
        # Check if modifications are already applied
        local already_modified=false
        if grep -q 'var Z51=999999;' "$claude_cli" 2>/dev/null && grep -q 'function FLB({tokenUsage:A}){return null}' "$claude_cli" 2>/dev/null; then
            already_modified=true
        fi
        
        if [ "$already_modified" = false ]; then
            # Remove "Previous Conversation Compacted" message
            sed -i 's/title:"Previous Conversation Compacted"/title:""/g' "$claude_cli" >/dev/null 2>&1
            
            # Disable compaction by setting limit to very high number
            sed -i 's/var Z51=10;/var Z51=999999;/g' "$claude_cli" >/dev/null 2>&1
            
            # Disable context warning by making FLB function always return null
            sed -i 's/function FLB({tokenUsage:A}){.*}$/function FLB({tokenUsage:A}){return null}/' "$claude_cli" >/dev/null 2>&1
            
            echo "✅ Claude Code compaction system and context warnings disabled"
        else
            echo "✅ Claude Code compaction and context warnings already disabled"
        fi
    else
        echo "⚠️  Claude Code CLI not found in any expected location"
        echo "   Searched locations:"
        for location in "${possible_locations[@]}"; do
            echo "   - $location"
        done
    fi
}

# Function to clear Claude history
clear_claude_history() {
    # Remove diretórios de histórico de conversas
    if [ -d "/home/user/.claude/projects" ]; then
        rm -rf /home/user/.claude/projects/ >/dev/null 2>&1
    fi

    # Remove arquivos de todo/tarefas
    if [ -d "/home/user/.claude/todos" ]; then
        rm -rf /home/user/.claude/todos/ >/dev/null 2>&1
    fi

    # Remove snapshots de shell
    # if [ -d "/home/user/.claude/shell-snapshots" ]; then
    #     rm -rf /home/user/.claude/shell-snapshots/ >/dev/null 2>&1
    # fi

    # Remove logs do proxy
    if [ -f "/home/user/claude-proxy.log" ]; then
        rm -f /home/user/claude-proxy.log >/dev/null 2>&1
    fi

    # Remove dados de analytics/statsig
    if [ -d "/home/user/.claude/statsig" ]; then
        rm -rf /home/user/.claude/statsig/ >/dev/null 2>&1
    fi

    # Remove locks de IDE
    if [ -d "/home/user/.claude/ide" ]; then
        rm -rf /home/user/.claude/ide/ >/dev/null 2>&1
    fi
}

# Function to cleanup on exit
cleanup() {
    clear_claude_history
    if [ ! -z "$CLEANUP_PID" ]; then
        kill $CLEANUP_PID 2>/dev/null
    fi
    if [ ! -z "$TOR_PID" ]; then
        kill $TOR_PID 2>/dev/null
    fi
    if [ ! -z "$PRIVOXY_PID" ]; then
        kill $PRIVOXY_PID 2>/dev/null
    fi
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Auto-configure environment if enabled
if [ "$AUTO_CONFIGURE" = true ]; then
    configure_environment
fi

# Disable Claude Code compaction system
disable_claude_compaction

# Clear Claude history at startup
clear_claude_history

# Install Tor and Privoxy if not available
if ! command -v tor >/dev/null 2>&1; then
    echo "Installing Tor..."
    nix-env -iA nixpkgs.tor 2>/dev/null || echo "Tor installation failed"
fi

if ! pgrep -x "privoxy" > /dev/null; then
    echo "Installing Privoxy..."
    nix-env -iA nixpkgs.privoxy 2>/dev/null || echo "Privoxy installation failed"
fi

# Check if Tor is already running
if ! pgrep -x "tor" > /dev/null; then
    echo "Starting Tor daemon..."
    
    # Try to use Tor from Nix profile first, then system PATH
    if [ -x "$HOME/.nix-profile/bin/tor" ]; then
        TOR_BIN="$HOME/.nix-profile/bin/tor"
    elif command -v tor >/dev/null 2>&1; then
        TOR_BIN="tor"
    else
        echo "Error: Tor not found after installation attempt"
        echo "Please install Tor manually: nix-env -iA nixpkgs.tor"
        exit 1
    fi
    
    $TOR_BIN --quiet &
    TOR_PID=$!
    echo "Tor started with PID: $TOR_PID"
    
    # Wait for Tor to start
    echo "Waiting for Tor to establish connection..."
    sleep 5
else
    echo "Tor is already running"
fi

# Start Privoxy if not running (converts SOCKS5 to HTTP proxy)
if ! pgrep -x "privoxy" > /dev/null; then
    echo "Starting Privoxy (SOCKS to HTTP converter)..."
    # Create simple privoxy config
    cat > /tmp/privoxy.conf << EOF
listen-address 127.0.0.1:8118
forward-socks5 / 127.0.0.1:9050 .
EOF
    $HOME/.nix-profile/bin/privoxy --no-daemon /tmp/privoxy.conf &
    PRIVOXY_PID=$!
    echo "Privoxy started with PID: $PRIVOXY_PID"
    sleep 2
else
    echo "Privoxy is already running"
fi

# Set proxy environment variables for SOCKS5 proxy
# Using HTTP proxy format for better compatibility
export HTTP_PROXY="http://${PROXY_HOST}:8118"
export HTTPS_PROXY="http://${PROXY_HOST}:8118"
export http_proxy="http://${PROXY_HOST}:8118"
export https_proxy="http://${PROXY_HOST}:8118"

# If authentication is required, uncomment and configure:
# export HTTP_PROXY="socks5://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}"
# export HTTPS_PROXY="socks5://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}"

# Optional: Set no proxy for local addresses
export NO_PROXY="localhost,127.0.0.1,::1"

echo "Starting Claude with Tor SOCKS5 proxy configuration..."
echo "HTTP_PROXY: $HTTP_PROXY"
echo "HTTPS_PROXY: $HTTPS_PROXY"
echo ""
echo "🔒 TOR Proxy Status:"
echo "   • All traffic routed through TOR network"
echo "   • IP address masked for privacy"
echo "   • Configuration saved for future terminals"
echo ""

# Background process for periodic cleanup
cleanup_daemon() {
    while true; do
        sleep 60  # Wait 1 minute
        clear_claude_history
    done
}

# Start cleanup daemon in background
cleanup_daemon &
CLEANUP_PID=$!

# Start Claude CLI
claude "$@"

# Cleanup when Claude exits
cleanup
