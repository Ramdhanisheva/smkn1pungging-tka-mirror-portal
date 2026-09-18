#!/bin/bash
# ==========================================================
# Deploy Script Web Mirroring TKA 2026 ? SMKN 1 Pungging
# Server: Ubuntu 26.04 LTS (servertkj / /opt/labserver)
# ==========================================================

echo "======================================================"
echo "?? Memulai Deployment Web Portal TKA 2026..."
echo "======================================================"

# 1. Pastikan network docker 'lab-network' ada
docker network inspect lab-network >/dev/null 2>&1 || docker network create lab-network

# 2. Pastikan direktori unduhan ada
mkdir -p ./public/downloads
chmod -R 755 ./public/downloads

# 3. Build dan jalankan container Docker
echo "?? Menjalankan container Docker..."
docker compose down 2>/dev/null || true
docker compose build
docker compose up -d

# 4. Status container
echo ""
echo "? Deployment selesai! Status container:"
docker compose ps

echo ""
echo "?? Akses Web Portal:"
echo "   - Localhost : http://localhost:8085"
echo "   - IP Lab LAN: http://192.168.8.3:8085"
echo "   - ZeroTier  : http://192.168.195.219:8085"
echo "   - Admin     : http://192.168.8.3:8085/admin (User: servertkj / Pass: ServerTkj26#!)"
echo "======================================================"
