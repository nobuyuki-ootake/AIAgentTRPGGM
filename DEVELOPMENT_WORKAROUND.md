# Development Environment Workaround

## Current Issue
The `pnpm install` command is timing out due to the large number of dependencies and potential network issues. This is preventing the normal `pnpm dev` command from working.

## Temporary Solutions

### Option 1: Manual Installation (Recommended)
Run these commands in separate terminals:

```bash
# Terminal 1: Start Types package
cd packages/types
pnpm install
pnpm run build
pnpm run dev

# Terminal 2: Install and Start Frontend
cd apps/frontend
npm install --legacy-peer-deps  # Use npm with legacy-peer-deps to handle conflicts
npm run dev

# Terminal 3: Install and Start Proxy Server
cd apps/proxy-server  
npm install --legacy-peer-deps
npm run dev
```

### Option 2: Use the start-dev scripts
We've created start-dev scripts that handle dependencies automatically:

For Linux/WSL:
```bash
./start-dev.sh
```

For Windows:
```bash
start-dev.bat
```

### Option 3: Individual package installations
If the workspace installation keeps failing, install each package individually:

```bash
# Root dependencies
npm install turbo concurrently @playwright/test

# Types package
cd packages/types
npm install

# Frontend
cd apps/frontend  
npm install --legacy-peer-deps

# Proxy server
cd apps/proxy-server
npm install --legacy-peer-deps
```

## Current Status
- ✅ Types package builds successfully
- ⚠️ Frontend dependencies need installation
- ⚠️ Proxy server dependencies need installation
- ✅ All necessary fixes have been applied to package.json files

## Fixed Issues
- ✅ Turbo commands now use `npx turbo run` instead of just `turbo`
- ✅ @axe-core/playwright version conflicts resolved (4.10.3 → 4.10.2)
- ✅ Types package has dev script added
- ✅ Three.js dependencies removed to resolve React version conflicts

## Next Steps
Once dependencies are installed, you should be able to access:
- Frontend: http://localhost:5173
- Proxy Server: http://localhost:3001