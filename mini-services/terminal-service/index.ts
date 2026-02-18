/**
 * WALZ EXPLOIT - Terminal Service
 * WebSocket-based real-time terminal and bot management
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, exec, execSync, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync, rmSync, renameSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { totalmem, freemem, cpus, loadavg, uptime } from 'os';
import AdmZip from 'adm-zip';

const PORT = 3003;
const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create HTTP server and Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Bot process management
interface BotProcess {
  id: string;
  name: string;
  type: 'whatsapp' | 'telegram' | 'python' | 'nodejs' | 'shell';
  process: ChildProcess | null;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  scriptPath: string;
  workDir: string;
  startedAt?: Date;
}

const botProcesses: Map<string, BotProcess> = new Map();

// Server stats function
function getServerStats() {
  const memUsage = process.memoryUsage();
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const cpuList = cpus();
  const loadAvg = loadavg();
  const systemUptime = uptime();
  
  // Calculate CPU usage
  const cpuUsage = cpuList.reduce((acc: number, cpu: any) => {
    const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0) as number;
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpuList.length;

  // Get disk usage (simplified)
  let diskTotal = 0;
  let diskUsed = 0;
  try {
    const dfOutput = execSync('df -k / 2>/dev/null || echo "0 0"').toString();
    const parts = dfOutput.split('\n')[1]?.split(/\s+/);
    if (parts && parts.length >= 3) {
      diskTotal = parseInt(parts[1]) * 1024;
      diskUsed = parseInt(parts[2]) * 1024;
    }
  } catch {
    diskTotal = 50 * 1024 * 1024 * 1024; // 50GB default
    diskUsed = 10 * 1024 * 1024 * 1024; // 10GB default
  }

  return {
    memory: {
      total: Math.round(totalMem / (1024 * 1024)),
      used: Math.round(usedMem / (1024 * 1024)),
      free: Math.round(freeMem / (1024 * 1024)),
      percentage: Math.round((usedMem / totalMem) * 100),
      process: Math.round(memUsage.heapUsed / (1024 * 1024))
    },
    cpu: {
      usage: Math.round(cpuUsage * 100) / 100,
      cores: cpuList.length,
      loadAvg: loadAvg.map(l => Math.round(l * 100) / 100)
    },
    disk: {
      total: Math.round(diskTotal / (1024 * 1024 * 1024)),
      used: Math.round(diskUsed / (1024 * 1024 * 1024)),
      free: Math.round((diskTotal - diskUsed) / (1024 * 1024 * 1024)),
      percentage: Math.round((diskUsed / diskTotal) * 100)
    },
    uptime: {
      system: Math.round(systemUptime),
      server: Math.round(process.uptime())
    },
    timestamp: new Date().toISOString()
  };
}

// Find entry file for bot
function findEntryFile(dir: string): string | null {
  try {
    const files = readdirSync(dir);
    
    // Check for package.json with main
    if (files.includes('package.json')) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
        if (pkg.main && existsSync(join(dir, pkg.main))) {
          return join(dir, pkg.main);
        }
      } catch {}
    }
    
    // Check for common entry files
    const entryFiles = ['index.js', 'main.js', 'bot.js', 'app.js', 'index.ts', 'main.ts', 'bot.ts'];
    for (const file of entryFiles) {
      if (files.includes(file)) {
        return join(dir, file);
      }
    }
    
    // Check for Python files
    const pyFiles = files.filter(f => f.endsWith('.py'));
    if (pyFiles.length > 0) {
      return join(dir, pyFiles[0]);
    }
    
    // Search subdirectories
    for (const file of files) {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
        const found = findEntryFile(fullPath);
        if (found) return found;
      }
    }
  } catch {}
  
  return null;
}

// Install dependencies for Node.js projects
async function installDependencies(workDir: string, socket: any): Promise<boolean> {
  const pkgPath = join(workDir, 'package.json');
  const nodeModulesPath = join(workDir, 'node_modules');
  
  if (existsSync(pkgPath) && !existsSync(nodeModulesPath)) {
    socket.emit('terminal:output', {
      type: 'system',
      message: '\x1b[33m[INSTALL] Installing dependencies... Please wait...\x1b[0m\n'
    });
    
    return new Promise((resolve) => {
      exec('npm install --omit=dev --no-audit --no-fund', { cwd: workDir }, (error) => {
        if (error) {
          socket.emit('terminal:output', {
            type: 'system',
            message: '\x1b[31m[WARN] Some dependencies failed to install.\x1b[0m\n'
          });
        } else {
          socket.emit('terminal:output', {
            type: 'system',
            message: '\x1b[32m[DONE] Dependencies installed successfully.\x1b[0m\n'
          });
        }
        resolve(true);
      });
    });
  }
  
  return true;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);
  
  // Send welcome message
  socket.emit('terminal:output', {
    type: 'system',
    message: '\x1b[36m[SYSTEM] WALZ EXPLOIT Terminal Connected.\x1b[0m\n'
  });
  
  // Send initial stats
  socket.emit('server:stats', getServerStats());
  
  // Start stats broadcasting
  const statsInterval = setInterval(() => {
    socket.emit('server:stats', getServerStats());
  }, 2000);
  
  // Handle terminal input
  socket.on('terminal:input', async (data: { botId: string; command: string }) => {
    const bot = botProcesses.get(data.botId);
    if (bot && bot.process && bot.process.stdin) {
      try {
        bot.process.stdin.write(data.command + '\n');
        socket.emit('terminal:output', {
          type: 'input',
          message: `\x1b[33m> ${data.command}\x1b[0m\n`
        });
      } catch (error) {
        socket.emit('terminal:output', {
          type: 'error',
          message: '\x1b[31m[ERROR] Failed to send command.\x1b[0m\n'
        });
      }
    } else {
      socket.emit('terminal:output', {
        type: 'error',
        message: '\x1b[31m[ERROR] Bot is not running.\x1b[0m\n'
      });
    }
  });
  
  // Start bot
  socket.on('bot:start', async (data: { botId: string; scriptPath?: string; type?: string; name?: string }) => {
    let botId = data.botId;
    let scriptPath = data.scriptPath;
    let botType = data.type || 'nodejs';
    let botName = data.name || 'Bot';
    
    // If no scriptPath, find entry file
    if (!scriptPath) {
      scriptPath = findEntryFile(UPLOADS_DIR) || undefined;
    }
    
    if (!scriptPath || !existsSync(scriptPath)) {
      socket.emit('terminal:output', {
        type: 'error',
        message: '\x1b[31m[ERROR] No script found. Upload a script first.\x1b[0m\n'
      });
      return;
    }
    
    // Check if bot already running
    if (botProcesses.has(botId)) {
      const existingBot = botProcesses.get(botId)!;
      if (existingBot.status === 'running') {
        socket.emit('terminal:output', {
          type: 'error',
          message: '\x1b[31m[ERROR] Bot is already running.\x1b[0m\n'
        });
        return;
      }
    }
    
    const workDir = dirname(scriptPath);
    const ext = extname(scriptPath);
    
    // Determine bot type from extension
    if (ext === '.py') botType = 'python';
    else if (ext === '.sh') botType = 'shell';
    else botType = 'nodejs';
    
    // Install dependencies if needed
    if (botType === 'nodejs' || botType === 'whatsapp' || botType === 'telegram') {
      await installDependencies(workDir, socket);
    }
    
    socket.emit('terminal:output', {
      type: 'system',
      message: `\x1b[32m[START] Starting ${basename(scriptPath)}...\x1b[0m\n`
    });
    
    // Determine command based on type
    let command: string;
    let args: string[];
    
    switch (botType) {
      case 'python':
        command = 'python3';
        args = [scriptPath];
        break;
      case 'shell':
        command = 'bash';
        args = [scriptPath];
        break;
      default:
        command = 'node';
        args = [scriptPath];
    }
    
    // Spawn process
    const childProcess = spawn(command, args, {
      cwd: workDir,
      env: { ...process.env, FORCE_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const bot: BotProcess = {
      id: botId,
      name: botName,
      type: botType as any,
      process: childProcess,
      status: 'running',
      pid: childProcess.pid,
      scriptPath,
      workDir,
      startedAt: new Date()
    };
    
    botProcesses.set(botId, bot);
    
    // Handle stdout
    childProcess.stdout?.on('data', (data) => {
      socket.emit('terminal:output', {
        type: 'stdout',
        message: data.toString()
      });
    });
    
    // Handle stderr
    childProcess.stderr?.on('data', (data) => {
      socket.emit('terminal:output', {
        type: 'stderr',
        message: `\x1b[31m${data.toString()}\x1b[0m`
      });
    });
    
    // Handle close
    childProcess.on('close', (code) => {
      bot.status = 'stopped';
      bot.process = null;
      bot.pid = undefined;
      
      socket.emit('terminal:output', {
        type: 'system',
        message: `\n\x1b[31m[STOP] Bot stopped (Exit code: ${code})\x1b[0m\n`
      });
      
      socket.emit('bot:status', {
        botId,
        status: 'stopped',
        exitCode: code
      });
    });
    
    // Handle error
    childProcess.on('error', (error) => {
      bot.status = 'error';
      socket.emit('terminal:output', {
        type: 'error',
        message: `\x1b[31m[ERROR] ${error.message}\x1b[0m\n`
      });
      
      socket.emit('bot:status', {
        botId,
        status: 'error',
        error: error.message
      });
    });
    
    socket.emit('bot:status', {
      botId,
      status: 'running',
      pid: childProcess.pid
    });
  });
  
  // Stop bot
  socket.on('bot:stop', (data: { botId: string }) => {
    const bot = botProcesses.get(data.botId);
    
    if (bot && bot.process) {
      bot.process.kill('SIGTERM');
      bot.status = 'stopped';
      
      socket.emit('terminal:output', {
        type: 'system',
        message: '\x1b[33m[STOP] Bot stopped by user.\x1b[0m\n'
      });
      
      socket.emit('bot:status', {
        botId: data.botId,
        status: 'stopped'
      });
    } else {
      socket.emit('terminal:output', {
        type: 'error',
        message: '\x1b[31m[ERROR] No running bot found.\x1b[0m\n'
      });
    }
  });
  
  // Restart bot
  socket.on('bot:restart', async (data: { botId: string }) => {
    const bot = botProcesses.get(data.botId);
    
    if (bot && bot.process) {
      bot.process.kill('SIGTERM');
      bot.status = 'stopped';
      
      socket.emit('terminal:output', {
        type: 'system',
        message: '\x1b[33m[RESTART] Restarting bot...\x1b[0m\n'
      });
      
      // Wait a moment and restart
      setTimeout(() => {
        socket.emit('bot:start', {
          botId: data.botId,
          scriptPath: bot.scriptPath,
          type: bot.type,
          name: bot.name
        });
      }, 1000);
    } else {
      socket.emit('terminal:output', {
        type: 'error',
        message: '\x1b[31m[ERROR] No bot to restart.\x1b[0m\n'
      });
    }
  });
  
  // Get bot list
  socket.on('bot:list', () => {
    const bots = Array.from(botProcesses.entries()).map(([id, bot]) => ({
      id,
      name: bot.name,
      type: bot.type,
      status: bot.status,
      pid: bot.pid,
      scriptPath: bot.scriptPath,
      startedAt: bot.startedAt
    }));
    
    socket.emit('bot:list', bots);
  });
  
  // File operations
  socket.on('file:list', (data: { path?: string }) => {
    const targetPath = data.path ? join(UPLOADS_DIR, data.path) : UPLOADS_DIR;
    
    try {
      const files = readdirSync(targetPath)
        .filter(f => !f.startsWith('.'))
        .map(f => {
          const fullPath = join(targetPath, f);
          const stats = statSync(fullPath);
          return {
            name: f,
            path: fullPath.replace(UPLOADS_DIR, ''),
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime
          };
        });
      
      socket.emit('file:list', files);
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to list files' });
    }
  });
  
  // File read
  socket.on('file:read', (data: { path: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        socket.emit('file:content', { path: data.path, content });
      } else {
        socket.emit('file:error', { message: 'File not found' });
      }
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to read file' });
    }
  });
  
  // File write
  socket.on('file:write', (data: { path: string; content: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      writeFileSync(fullPath, data.content, 'utf-8');
      socket.emit('file:saved', { path: data.path, success: true });
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to save file' });
    }
  });
  
  // File delete
  socket.on('file:delete', (data: { path: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      if (existsSync(fullPath)) {
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          rmSync(fullPath, { recursive: true, force: true });
        } else {
          unlinkSync(fullPath);
        }
        socket.emit('file:deleted', { path: data.path, success: true });
      }
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to delete file' });
    }
  });
  
  // File rename
  socket.on('file:rename', (data: { oldPath: string; newPath: string }) => {
    const oldFullPath = join(UPLOADS_DIR, data.oldPath);
    const newFullPath = join(UPLOADS_DIR, data.newPath);
    
    try {
      renameSync(oldFullPath, newFullPath);
      socket.emit('file:renamed', { oldPath: data.oldPath, newPath: data.newPath, success: true });
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to rename file' });
    }
  });
  
  // Create directory
  socket.on('file:mkdir', (data: { path: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      mkdirSync(fullPath, { recursive: true });
      socket.emit('file:created', { path: data.path, type: 'directory', success: true });
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to create directory' });
    }
  });
  
  // Create file
  socket.on('file:create', (data: { path: string; content?: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      writeFileSync(fullPath, data.content || '', 'utf-8');
      socket.emit('file:created', { path: data.path, type: 'file', success: true });
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to create file' });
    }
  });
  
  // Unzip file
  socket.on('file:unzip', (data: { path: string }) => {
    const fullPath = join(UPLOADS_DIR, data.path);
    
    try {
      if (existsSync(fullPath) && data.path.endsWith('.zip')) {
        const zip = new AdmZip(fullPath);
        zip.extractAllTo(UPLOADS_DIR, true);
        unlinkSync(fullPath);
        socket.emit('file:unzipped', { path: data.path, success: true });
      } else {
        socket.emit('file:error', { message: 'Invalid zip file' });
      }
    } catch (error) {
      socket.emit('file:error', { message: 'Failed to unzip file' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
    clearInterval(statsInterval);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`[WALZ EXPLOIT] Terminal Service running on port ${PORT}`);
});
