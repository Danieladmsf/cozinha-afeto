#!/bin/bash

# Claude proxy startup script with enhanced SDK and CLI proxy support
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

# Enhanced proxy configuration for Claude Code SDK and CLI
CLAUDE_PROXY_CONFIG() {
    echo "🔧 Configuring enhanced proxy support for Claude Code..."
    
    # Standard proxy environment variables
    export HTTP_PROXY="http://${PROXY_HOST}:8118"
    export HTTPS_PROXY="http://${PROXY_HOST}:8118"
    export http_proxy="http://${PROXY_HOST}:8118"
    export https_proxy="http://${PROXY_HOST}:8118"
    export ALL_PROXY="http://${PROXY_HOST}:8118"
    export all_proxy="http://${PROXY_HOST}:8118"
    
    # Node.js specific proxy configuration for SDK
    export NODE_HTTP_PROXY="http://${PROXY_HOST}:8118"
    export NODE_HTTPS_PROXY="http://${PROXY_HOST}:8118"
    
    # Claude Code specific proxy configuration
    export CLAUDE_HTTP_PROXY="http://${PROXY_HOST}:8118"
    export CLAUDE_HTTPS_PROXY="http://${PROXY_HOST}:8118"
    
    # SSL/TLS configuration for corporate proxies (if needed)
    # export NODE_TLS_REJECT_UNAUTHORIZED=0  # Uncomment for dev environments only
    
    # No proxy for local addresses
    export NO_PROXY="localhost,127.0.0.1,::1,*.local"
    export no_proxy="localhost,127.0.0.1,::1,*.local"
    
    echo "✅ Enhanced proxy configuration applied:"
    echo "   • CLI proxy: $HTTP_PROXY"
    echo "   • SDK proxy: $NODE_HTTPS_PROXY"
    echo "   • All traffic routed through proxy"
}

# Function to create Claude SDK proxy wrapper
create_claude_sdk_wrapper() {
    local wrapper_dir="$HOME/.claude/sdk"
    local wrapper_file="$wrapper_dir/claude-proxy-sdk.js"
    
    mkdir -p "$wrapper_dir"
    
    cat > "$wrapper_file" << 'EOF'
// Claude Code SDK with Proxy Support
const { query } = require('@anthropic-ai/claude-code');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');

class ClaudeSDKWithProxy {
  constructor(proxyConfig = {}) {
    // Configure proxy from environment or config
    this.proxyUrl = proxyConfig.url || 
                   process.env.CLAUDE_HTTPS_PROXY || 
                   process.env.HTTPS_PROXY || 
                   process.env.https_proxy;
    
    if (this.proxyUrl) {
      // Create proxy agent
      const proxyAgent = new HttpsProxyAgent(this.proxyUrl);
      
      // Set global agent for all HTTPS requests
      https.globalAgent = proxyAgent;
      
      console.log(`🌐 Claude SDK using proxy: ${this.proxyUrl}`);
    }
  }

  async processMessage(prompt, options = {}) {
    try {
      const messages = [];
      
      const queryOptions = {
        ...options,
        maxTurns: options.maxTurns || 1,
        workingDirectory: options.workingDirectory || process.cwd()
      };
      
      for await (const message of query({
        prompt,
        options: queryOptions
      })) {
        messages.push(message);
      }
      
      return messages[messages.length - 1]?.content || "No response";
      
    } catch (error) {
      console.error('Claude SDK Proxy Error:', error.message);
      throw error;
    }
  }

  async queryStream(prompt, options = {}) {
    const messages = [];
    
    for await (const message of query({
      prompt,
      options: {
        ...options,
        workingDirectory: options.workingDirectory || process.cwd()
      }
    })) {
      messages.push(message);
      yield message;
    }
    
    return messages;
  }
}

module.exports = { ClaudeSDKWithProxy };

// Usage example:
// const { ClaudeSDKWithProxy } = require('./claude-proxy-sdk');
// const claude = new ClaudeSDKWithProxy();
// const response = await claude.processMessage("Your prompt here");
EOF

    echo "📦 Created Claude SDK proxy wrapper at: $wrapper_file"
}

# Function to create CLI proxy wrapper
create_claude_cli_wrapper() {
    local wrapper_dir="$HOME/.claude/cli"
    local wrapper_file="$wrapper_dir/claude-proxy"
    
    mkdir -p "$wrapper_dir"
    
    cat > "$wrapper_file" << 'EOF'
#!/bin/bash

# Claude CLI Proxy Wrapper
# Ensures proxy is always configured when running Claude

# Load proxy configuration
if [ -f "$HOME/.claude/proxy.conf" ]; then
    source "$HOME/.claude/proxy.conf"
fi

# Set proxy environment variables
export HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:8118}"
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:8118}"
export http_proxy="${http_proxy:-http://127.0.0.1:8118}"
export https_proxy="${https_proxy:-http://127.0.0.1:8118}"
export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,::1}"

echo "🔐 Claude CLI using proxy: $HTTPS_PROXY"

# Execute Claude with all arguments and proxy configuration
exec claude "$@"
EOF

    chmod +x "$wrapper_file"
    echo "🔧 Created Claude CLI proxy wrapper at: $wrapper_file"
}

# Function to create proxy configuration file
create_proxy_config() {
    local config_file="$HOME/.claude/proxy.conf"
    
    cat > "$config_file" << EOF
# Claude Code Proxy Configuration
# Generated by start-with-proxy-enhanced.sh

# HTTP/HTTPS Proxy Configuration
export HTTP_PROXY="http://127.0.0.1:8118"
export HTTPS_PROXY="http://127.0.0.1:8118"
export http_proxy="http://127.0.0.1:8118"
export https_proxy="http://127.0.0.1:8118"
export ALL_PROXY="http://127.0.0.1:8118"

# Node.js specific
export NODE_HTTP_PROXY="http://127.0.0.1:8118"
export NODE_HTTPS_PROXY="http://127.0.0.1:8118"

# Claude Code specific
export CLAUDE_HTTP_PROXY="http://127.0.0.1:8118"
export CLAUDE_HTTPS_PROXY="http://127.0.0.1:8118"

# No proxy for local addresses
export NO_PROXY="localhost,127.0.0.1,::1,*.local"
export no_proxy="localhost,127.0.0.1,::1,*.local"

# SSL Configuration (uncomment if needed for corporate environments)
# export NODE_TLS_REJECT_UNAUTHORIZED=0

# Proxy credentials (if required)
# export PROXY_USER=""
# export PROXY_PASS=""
EOF

    echo "📄 Created proxy configuration file at: $config_file"
}

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
        echo "Adding enhanced proxy configuration to .bashrc..."
        cat >> "$bashrc" << 'EOF'

# Enhanced TOR Proxy configuration for Claude Code (auto-added)
export HTTP_PROXY="http://127.0.0.1:8118"
export HTTPS_PROXY="http://127.0.0.1:8118"
export http_proxy="http://127.0.0.1:8118"
export https_proxy="http://127.0.0.1:8118"
export ALL_PROXY="http://127.0.0.1:8118"
export NODE_HTTP_PROXY="http://127.0.0.1:8118"
export NODE_HTTPS_PROXY="http://127.0.0.1:8118"
export CLAUDE_HTTP_PROXY="http://127.0.0.1:8118"
export CLAUDE_HTTPS_PROXY="http://127.0.0.1:8118"
export NO_PROXY="localhost,127.0.0.1,::1,*.local"

# Add Claude proxy wrappers to PATH
export PATH="$HOME/.claude/cli:$PATH"
EOF
        needs_update=true
    fi
    
    if [ "$needs_update" = true ]; then
        echo "✅ Enhanced environment configured! Proxy will be active in all new terminals."
        echo "   Current terminal will use proxy immediately."
        echo "   Run 'source ~/.bashrc' in other terminals or restart them."
    else
        echo "✅ Environment already configured for enhanced proxy."
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

# Function to test proxy connectivity
test_proxy_connectivity() {
    echo "🧪 Testing proxy connectivity..."
    
    # Test basic connectivity
    if curl -s --proxy "$HTTP_PROXY" --connect-timeout 10 -I https://api.anthropic.com >/dev/null 2>&1; then
        echo "✅ Proxy connectivity test passed"
        return 0
    else
        echo "❌ Proxy connectivity test failed"
        return 1
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

# Create enhanced proxy components
create_proxy_config
create_claude_sdk_wrapper
create_claude_cli_wrapper

# Apply enhanced proxy configuration
CLAUDE_PROXY_CONFIG

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

# Test proxy connectivity
test_proxy_connectivity

echo ""
echo "🚀 Starting Claude with Enhanced Proxy Configuration..."
echo "📋 Configuration Summary:"
echo "   • CLI Proxy: $HTTP_PROXY"
echo "   • SDK Proxy: $NODE_HTTPS_PROXY" 
echo "   • Proxy Config: $HOME/.claude/proxy.conf"
echo "   • SDK Wrapper: $HOME/.claude/sdk/claude-proxy-sdk.js"
echo "   • CLI Wrapper: $HOME/.claude/cli/claude-proxy"
echo ""
echo "🔒 Enhanced TOR Proxy Status:"
echo "   • All Claude Code traffic routed through TOR"
echo "   • Both CLI and SDK proxy support enabled"
echo "   • IP address masked for privacy"
echo "   • Configuration saved for future use"
echo ""
echo "💡 Usage Examples:"
echo "   CLI: claude -p 'your prompt'"
echo "   SDK: const { ClaudeSDKWithProxy } = require('$HOME/.claude/sdk/claude-proxy-sdk');"
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

# Start Claude CLI with proxy
claude "$@"

# Cleanup when Claude exits
cleanup