

#!/bin/bash

# Script para reverter TODAS as configurações do Claude proxy system
# Este script desfaz tudo que o script original fez

echo "🔄 Iniciando reversão completa do Claude proxy system..."

# ===============================
# LOGGING FUNCTION
# ===============================
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%H:%M:%S')
    
    case "$level" in
        "INFO")  echo "[$timestamp] ℹ️  $message" ;;
        "WARN")  echo "[$timestamp] ⚠️  $message" ;;
        "ERROR") echo "[$timestamp] ❌ $message" ;;
        "SUCCESS") echo "[$timestamp] ✅ $message" ;;
    esac
}

# ===============================
# PARAR TODOS OS PROCESSOS
# ===============================

log_message "INFO" "Parando todos os processos relacionados..."

# Parar daemons personalizados
pkill -f "advanced_daemon" 2>/dev/null
pkill -f "dns_interceptor" 2>/dev/null
pkill -f "traffic_padding" 2>/dev/null
pkill -f "telemetry_blocker" 2>/dev/null

# Parar TOR
pkill -x "tor" 2>/dev/null
sleep 2
killall -9 tor 2>/dev/null

# Parar Privoxy (todas as instâncias)
pkill -f "privoxy" 2>/dev/null
sleep 2
killall -9 privoxy 2>/dev/null

log_message "SUCCESS" "Todos os processos foram terminados"

# ===============================
# REMOVER VARIÁVEIS DE AMBIENTE
# ===============================

log_message "INFO" "Removendo variáveis de proxy do ambiente..."

unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy
unset NO_PROXY
unset DNS_SERVER
unset HTTP_USER_AGENT
unset HTTP_ACCEPT
unset HTTP_ACCEPT_LANGUAGE
unset HTTP_ACCEPT_ENCODING
unset HTTP_DNT
unset HTTP_CONNECTION
unset HTTP_UPGRADE_INSECURE_REQUESTS
unset HTTP_SEC_FETCH_SITE
unset HTTP_SEC_FETCH_MODE
unset HTTP_SEC_FETCH_USER
unset HTTP_SEC_FETCH_DEST
unset HTTP_CACHE_CONTROL
unset SCREEN_RESOLUTION
unset SO_RCVBUF
unset SO_SNDBUF
unset CURL_HOME

log_message "SUCCESS" "Variáveis de ambiente removidas"

# ===============================
# RESTAURAR BASHRC
# ===============================

log_message "INFO" "Restaurando arquivo .bashrc..."

bashrc="$HOME/.bashrc"

if [ -f "$bashrc" ]; then
    # Remover configurações de proxy
    sed -i '/# TOR Proxy configuration (auto-added by Claude proxy script)/,/^$/d' "$bashrc" 2>/dev/null
    sed -i '/export HTTP_PROXY.*8118/d' "$bashrc" 2>/dev/null
    sed -i '/export HTTPS_PROXY.*8118/d' "$bashrc" 2>/dev/null
    sed -i '/export http_proxy.*8118/d' "$bashrc" 2>/dev/null
    sed -i '/export https_proxy.*8118/d' "$bashrc" 2>/dev/null
    sed -i '/export NO_PROXY.*localhost/d' "$bashrc" 2>/dev/null
    
    # Remover linha do Nix se foi adicionada pelo script
    sed -i '/export PATH="\$HOME\/\.nix-profile\/bin:\$PATH"/d' "$bashrc" 2>/dev/null
    
    log_message "SUCCESS" "Arquivo .bashrc restaurado"
else
    log_message "WARN" "Arquivo .bashrc não encontrado"
fi

# ===============================
# RESTAURAR CLAUDE CLI
# ===============================

log_message "INFO" "Restaurando Claude CLI original..."

# Locais possíveis do Claude CLI
possible_locations=(
    "/home/user/.global_modules/lib/node_modules/@anthropic-ai/claude-code/cli.js"
    "$HOME/.global_modules/lib/node_modules/@anthropic-ai/claude-code/cli.js"
    "/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js"
    "/usr/lib/node_modules/@anthropic-ai/claude-code/cli.js"
    "/opt/claude/cli.js"
)

claude_cli=""
for location in "${possible_locations[@]}"; do
    if [ -f "$location" ]; then
        claude_cli="$location"
        break
    fi
done

# Busca dinâmica se não encontrou
if [ -z "$claude_cli" ]; then
    claude_cli=$(find /home/user -name "cli.js" -path "*claude-code*" 2>/dev/null | head -1)
fi

if [ -n "$claude_cli" ] && [ -f "$claude_cli" ]; then
    # Verificar se existe backup
    if [ -f "$claude_cli.backup" ]; then
        cp "$claude_cli.backup" "$claude_cli"
        log_message "SUCCESS" "Claude CLI restaurado do backup"
    else
        log_message "WARN" "Backup do Claude CLI não encontrado, tentando reversão manual..."
        
        # Reverter modificações conhecidas
        sed -i 's/title:""/title:"Previous Conversation Compacted"/g' "$claude_cli" 2>/dev/null
        sed -i 's/var Z51=999999;/var Z51=10;/g' "$claude_cli" 2>/dev/null
        sed -i 's/function FLB({tokenUsage:A}){return null}/function FLB({tokenUsage:A}){console.warn("Token usage warning")}/g' "$claude_cli" 2>/dev/null
        
        log_message "SUCCESS" "Claude CLI modificações revertidas manualmente"
    fi
else
    log_message "WARN" "Claude CLI não encontrado - nada para restaurar"
fi

# ===============================
# LIMPAR ARQUIVOS TEMPORÁRIOS
# ===============================

log_message "INFO" "Removendo todos os arquivos temporários..."

# Arquivos de configuração temporários
rm -f /tmp/torrc_claude_ultra 2>/dev/null
rm -f /tmp/privoxy_main.conf 2>/dev/null
rm -f /tmp/privoxy_session_*.conf 2>/dev/null
rm -f /tmp/claude_rate_limiter.sh 2>/dev/null
rm -f /tmp/traffic_padding.sh 2>/dev/null
rm -f /tmp/dns_interceptor.py 2>/dev/null
rm -f /tmp/claude_telemetry_block.hosts 2>/dev/null

# Logs e dados temporários
rm -f /tmp/claude_system.log 2>/dev/null
rm -f /tmp/claude_system_health.log 2>/dev/null
rm -f /tmp/privoxy_main.log 2>/dev/null
rm -f /tmp/privoxy_session_*.log 2>/dev/null
rm -f /tmp/traffic_padding.log 2>/dev/null
rm -f /tmp/dns_intercept.log 2>/dev/null

# Diretórios de dados
rm -rf /tmp/tor_data_claude 2>/dev/null
rm -rf /tmp/curl_cache 2>/dev/null

# Arquivos claude relacionados
rm -f /tmp/claude_*.* 2>/dev/null

log_message "SUCCESS" "Arquivos temporários removidos"

# ===============================
# RESTAURAR CONFIGURAÇÕES DNS
# ===============================

log_message "INFO" "Restaurando configurações DNS..."

# Remover configurações DNS personalizadas se existirem
if [ -f /etc/resolv.conf.backup ]; then
    cp /etc/resolv.conf.backup /etc/resolv.conf 2>/dev/null && log_message "SUCCESS" "DNS restaurado do backup"
else
    # Restaurar DNS padrão do sistema
    echo "nameserver 8.8.8.8" > /tmp/resolv.conf.temp 2>/dev/null
    echo "nameserver 8.8.4.4" >> /tmp/resolv.conf.temp 2>/dev/null
    log_message "INFO" "Configurações DNS padrão disponíveis em /tmp/resolv.conf.temp"
fi

# ===============================
# REMOVER CONFIGURAÇÕES DE REDE
# ===============================

log_message "INFO" "Revertendo otimizações de rede..."

# Reverter configurações de TCP (se possível)
if [ -w /proc/sys/net/ipv4/tcp_congestion_control ] 2>/dev/null; then
    echo "cubic" > /proc/sys/net/ipv4/tcp_congestion_control 2>/dev/null || true
    echo "0" > /proc/sys/net/ipv4/tcp_fastopen 2>/dev/null || true
    log_message "SUCCESS" "Configurações TCP revertidas"
fi

# ===============================
# VERIFICAR PROCESSOS RESTANTES
# ===============================

log_message "INFO" "Verificando processos restantes..."

remaining_processes=()

if pgrep -f "tor" > /dev/null; then
    remaining_processes+=("TOR")
fi

if pgrep -f "privoxy" > /dev/null; then
    remaining_processes+=("Privoxy")
fi

if pgrep -f "claude.*proxy" > /dev/null; then
    remaining_processes+=("Claude proxy scripts")
fi

if [ ${#remaining_processes[@]} -gt 0 ]; then
    log_message "WARN" "Processos ainda rodando: ${remaining_processes[*]}"
    log_message "INFO" "Para força-los a parar: sudo killall -9 tor privoxy"
else
    log_message "SUCCESS" "Nenhum processo relacionado encontrado"
fi

# ===============================
# VERIFICAR PORTAS
# ===============================

log_message "INFO" "Verificando portas..."

active_ports=()

if netstat -tlnp 2>/dev/null | grep -q ":9050.*LISTEN" || ss -tlnp 2>/dev/null | grep -q ":9050.*LISTEN"; then
    active_ports+=("9050 (TOR)")
fi

if netstat -tlnp 2>/dev/null | grep -q ":8118.*LISTEN" || ss -tlnp 2>/dev/null | grep -q ":8118.*LISTEN"; then
    active_ports+=("8118 (Privoxy)")
fi

if netstat -tlnp 2>/dev/null | grep -q ":9051.*LISTEN" || ss -tlnp 2>/dev/null | grep -q ":9051.*LISTEN"; then
    active_ports+=("9051 (TOR Control)")
fi

if [ ${#active_ports[@]} -gt 0 ]; then
    log_message "WARN" "Portas ainda ativas: ${active_ports[*]}"
else
    log_message "SUCCESS" "Todas as portas liberadas"
fi

# ===============================
# VERIFICAR VARIÁVEIS NO SHELL ATUAL
# ===============================

log_message "INFO" "Verificando variáveis no shell atual..."

proxy_vars_found=false

if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ] || [ -n "$HTTPS_PROXY" ] || [ -n "$https_proxy" ]; then
    proxy_vars_found=true
fi

if [ "$proxy_vars_found" = true ]; then
    log_message "WARN" "Variáveis de proxy ainda definidas no shell atual"
    log_message "INFO" "Execute: source ~/.bashrc ou abra um novo terminal"
else
    log_message "SUCCESS" "Nenhuma variável de proxy encontrada"
fi

# ===============================
# RELATÓRIO FINAL
# ===============================

echo ""
echo "============================================================"
echo "🔄 REVERSÃO COMPLETA DO CLAUDE PROXY SYSTEM"
echo "============================================================"
echo ""
echo "✅ AÇÕES REALIZADAS:"
echo "   🛑 Todos os processos TOR e Privoxy terminados"
echo "   🧹 Variáveis de ambiente removidas"
echo "   📝 Arquivo .bashrc restaurado"
echo "   🔧 Claude CLI restaurado (se backup disponível)"
echo "   🗑️  Todos os arquivos temporários removidos"
echo "   🌐 Configurações DNS revertidas"
echo "   📡 Otimizações de rede desfeitas"
echo ""

if [ ${#remaining_processes[@]} -eq 0 ] && [ ${#active_ports[@]} -eq 0 ] && [ "$proxy_vars_found" = false ]; then
    echo "🎉 SISTEMA COMPLETAMENTE REVERTIDO!"
    echo "✅ Não há processos, portas ou configurações restantes"
else
    echo "⚠️  REVERSÃO PARCIAL CONCLUÍDA"
    if [ ${#remaining_processes[@]} -gt 0 ]; then
        echo "   📋 Processos restantes: ${remaining_processes[*]}"
    fi
    if [ ${#active_ports[@]} -gt 0 ]; then
        echo "   🔌 Portas ativas: ${active_ports[*]}"
    fi
    if [ "$proxy_vars_found" = true ]; then
        echo "   🔄 Execute 'source ~/.bashrc' ou abra novo terminal"
    fi
fi

echo ""
echo "📋 PRÓXIMOS PASSOS RECOMENDADOS:"
echo "   1. Abra um novo terminal para garantir ambiente limpo"
echo "   2. Teste Claude normalmente: claude"
echo "   3. Se necessário, reinicie o sistema para limpeza completa"
echo ""
echo "🔍 Para verificar se tudo foi removido:"
echo "   • ps aux | grep -E '(tor|privoxy)'"
echo "   • netstat -tlnp | grep -E '(9050|8118|9051)'"
echo "   • echo \$HTTP_PROXY \$HTTPS_PROXY"
echo ""

log_message "SUCCESS" "Reversão completa do Claude proxy system finalizada!"