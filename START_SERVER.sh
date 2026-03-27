#!/bin/bash

export SUPABASE_URL=https://qfkwqfrnemqregjqxkcr.supabase.co
export SUPABASE_SERVICE_KEY="REMOVED.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma3dxZnJuZW1xcmVnanF4a2NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA0MDY2NiwiZXhwIjoyMDg5NjE2NjY2fQ.t72EXHKdH_X3ZooQVMzmCNfZjRmN0zkg258-njqx4Us"
export OPENWEATHER_API_KEY=REDACTED
export JWT_SECRET=change-me-in-production
export NODE_ENV=production
export PORT=3000

echo "🚀 Iniciando Smart Market Backend..."
echo ""
echo "📊 Credenciais:"
echo "   SUPABASE_URL: qfkwqfrnemqregjqxkcr"
echo "   OPENWEATHER_API_KEY: ✅ Configurada"
echo ""

cd /Users/sergioponte/easy-market/backend
node src/index.js

