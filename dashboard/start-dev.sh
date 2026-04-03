#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /Users/sergioponte/easy-market/dashboard
exec node node_modules/.bin/next dev --port 3000
