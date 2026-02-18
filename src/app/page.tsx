'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, FolderOpen, Settings, LogOut, Play, Square, RotateCw,
  Upload, FileText, Folder, Trash2, Edit3, Plus, ChevronRight,
  Cpu, HardDrive, Wifi, Clock, Activity, Zap, Shield, Key,
  Menu, X, FileUp, Download, Copy, Check, AlertCircle, Users,
  Eye, EyeOff, RefreshCw, Power, Bot, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast, Toaster } from 'sonner';

// Types
interface ServerStats {
  memory: { total: number; used: number; free: number; percentage: number; process: number };
  cpu: { usage: number; cores: number; loadAvg: number[] };
  disk: { total: number; used: number; free: number; percentage: number };
  uptime: { system: number; server: number };
  timestamp: string;
}

interface BotInfo {
  id: string;
  name: string;
  type: 'whatsapp' | 'telegram' | 'python' | 'nodejs' | 'shell';
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  scriptPath?: string;
  startedAt?: string;
}

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

interface LicenseKey {
  id: string;
  key: string;
  type: 'single' | 'multi';
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  users?: { id: string; lastActive: string; createdAt: string }[];
}

// Particle Background Component
function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -20, 20],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Login Component
function LoginPage({ onLogin }: { onLogin: (isAdmin: boolean) => void }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleLogin = async () => {
    if (!licenseKey.trim()) {
      toast.error('Please enter your license key');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.toUpperCase() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Login successful!');
        onLogin(data.data.isAdmin);
      } else {
        toast.error(data.message || 'Invalid license key');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cyberpunk-bg flex items-center justify-center p-4 relative">
      <ParticleBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8 neon-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-10 h-10 text-purple-500" />
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-glow bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              WALZ EXPLOIT
            </h1>
            <p className="text-zinc-400 text-sm mt-2">Premium Cyberpunk Panel</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider">License Key</Label>
              <div className="relative mt-2">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="WALZ-XXXX-XXXX-XXXX-XXXX"
                  className="pl-10 pr-10 input-neon font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-neon btn-neon-primary h-12 text-base font-semibold"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  ACCESS PANEL
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-xs">
              Secure authentication with license key
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Server Stats Component
function ServerStatsPanel({ stats }: { stats: ServerStats | null }) {
  if (!stats) return null;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* RAM */}
      <Card className="stat-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Memory</p>
              <p className="text-lg font-bold text-white">
                {stats.memory.percentage}%
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={stats.memory.percentage} className="h-1.5 progress-neon" />
            <p className="text-xs text-zinc-500 mt-1">
              {stats.memory.used} / {stats.memory.total} MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CPU */}
      <Card className="stat-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">CPU</p>
              <p className="text-lg font-bold text-white">
                {stats.cpu.usage.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={stats.cpu.usage} className="h-1.5 progress-neon" />
            <p className="text-xs text-zinc-500 mt-1">
              {stats.cpu.cores} cores • Load: {stats.cpu.loadAvg[0]?.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disk */}
      <Card className="stat-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Storage</p>
              <p className="text-lg font-bold text-white">
                {stats.disk.percentage}%
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={stats.disk.percentage} className="h-1.5 progress-neon" />
            <p className="text-xs text-zinc-500 mt-1">
              {stats.disk.used} / {stats.disk.total} GB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card className="stat-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Uptime</p>
              <p className="text-lg font-bold text-white">
                {formatUptime(stats.uptime.server)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="status-online" />
            <p className="text-xs text-zinc-500">Server Online</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Terminal Component
function TerminalPanel({
  socket,
  bots,
  onRefreshBots
}: {
  socket: Socket | null;
  bots: BotInfo[];
  onRefreshBots: () => void;
}) {
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [activeBotId, setActiveBotId] = useState<string>('main');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('terminal:output', (data: { type: string; message: string }) => {
      setLogs(prev => [...prev.slice(-500), data.message]);
    });

    return () => {
      socket.off('terminal:output');
    };
  }, [socket]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const sendCommand = () => {
    if (!command.trim() || !socket) return;
    socket.emit('terminal:input', { botId: activeBotId, command });
    setCommand('');
  };

  const startBot = () => {
    if (!socket) return;
    socket.emit('bot:start', { botId: activeBotId });
    setTimeout(onRefreshBots, 1000);
  };

  const stopBot = () => {
    if (!socket) return;
    socket.emit('bot:stop', { botId: activeBotId });
    setTimeout(onRefreshBots, 500);
  };

  const restartBot = () => {
    if (!socket) return;
    socket.emit('bot:restart', { botId: activeBotId });
    setTimeout(onRefreshBots, 1000);
  };

  const activeBot = bots.find(b => b.id === activeBotId);

  return (
    <div className="h-full flex flex-col">
      {/* Bot Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={activeBotId}
          onChange={(e) => setActiveBotId(e.target.value)}
          className="input-neon px-3 py-2 text-sm min-w-[150px]"
        >
          <option value="main">Main Terminal</option>
          {bots.map(bot => (
            <option key={bot.id} value={bot.id}>
              {bot.name} ({bot.type})
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button onClick={startBot} size="sm" className="btn-neon btn-neon-primary">
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
          <Button onClick={stopBot} size="sm" className="btn-neon btn-neon-danger">
            <Square className="w-4 h-4 mr-1" /> Stop
          </Button>
          <Button onClick={restartBot} size="sm" className="btn-neon">
            <RotateCw className="w-4 h-4 mr-1" /> Restart
          </Button>
        </div>

        {activeBot && (
          <Badge
            variant={activeBot.status === 'running' ? 'default' : 'secondary'}
            className={`${activeBot.status === 'running' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-zinc-500/20 text-zinc-400'}`}
          >
            {activeBot.status === 'running' ? (
              <><div className="status-online mr-2" /> Running</>
            ) : (
              'Stopped'
            )}
          </Badge>
        )}
      </div>

      {/* Terminal */}
      <div className="flex-1 terminal rounded-lg neon-border overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border-b border-purple-500/20">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-zinc-500 font-mono">WALZ EXPLOIT Terminal</span>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={terminalRef}>
          <div className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">
            {logs.length === 0 ? (
              <span className="text-zinc-500">Waiting for output...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="terminal-line" dangerouslySetInnerHTML={{ __html: log }} />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 p-3 bg-black/50 border-t border-purple-500/20">
          <ChevronRight className="w-5 h-5 text-green-400" />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// File Manager Component
function FileManager({ socket }: { socket: Socket | null }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [editFile, setEditFile] = useState<FileInfo | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'directory'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback((path: string) => {
    if (socket) {
      socket.emit('file:list', { path });
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('file:list', (fileList: FileInfo[]) => {
      setFiles(fileList);
    });

    socket.on('file:content', (data: { path: string; content: string }) => {
      setEditContent(data.content);
    });

    socket.on('file:saved', () => {
      toast.success('File saved');
      setEditFile(null);
    });

    socket.on('file:deleted', () => {
      toast.success('File deleted');
    });

    socket.on('file:created', () => {
      toast.success('Created successfully');
      setShowNewFileDialog(false);
    });

    socket.on('file:unzipped', () => {
      toast.success('Extracted successfully');
    });

    socket.on('file:error', (data: { message: string }) => {
      toast.error(data.message);
    });

    loadFiles('');

    return () => {
      socket.off('file:list');
      socket.off('file:content');
      socket.off('file:saved');
      socket.off('file:deleted');
      socket.off('file:created');
      socket.off('file:unzipped');
      socket.off('file:error');
    };
  }, [socket, loadFiles]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    loadFiles(path);
  };

  const openFile = (file: FileInfo) => {
    if (file.type === 'directory') {
      navigateTo(file.path);
    } else {
      setEditFile(file);
      socket?.emit('file:read', { path: file.path });
    }
  };

  const deleteFile = (file: FileInfo) => {
    if (confirm(`Delete ${file.name}?`)) {
      socket?.emit('file:delete', { path: file.path });
    }
  };

  const unzipFile = (file: FileInfo) => {
    socket?.emit('file:unzip', { path: file.path });
  };

  const saveFile = () => {
    if (editFile) {
      socket?.emit('file:write', { path: editFile.path, content: editContent });
    }
  };

  const createNew = () => {
    if (newFileName) {
      const path = currentPath ? `${currentPath}/${newFileName}` : newFileName;
      socket?.emit(`file:${newFileType === 'directory' ? 'mkdir' : 'create'}`, {
        path,
        content: ''
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('File uploaded');
        loadFiles();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          onClick={() => navigateTo('')}
          variant="outline"
          size="sm"
          className="btn-neon"
        >
          <FolderOpen className="w-4 h-4 mr-1" /> Root
        </Button>
        
        <Button onClick={() => setShowNewFileDialog(true)} size="sm" className="btn-neon">
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
        
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="btn-neon btn-neon-primary">
          <Upload className="w-4 h-4 mr-1" /> Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />

        {currentPath && (
          <div className="flex items-center text-sm text-zinc-400">
            <Folder className="w-4 h-4 mr-1" />
            <span>/{currentPath}</span>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 glass rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-purple-500/10 text-xs text-zinc-400 uppercase tracking-wider border-b border-purple-500/20">
          <div className="col-span-1">Type</div>
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <ScrollArea className="h-[calc(100%-48px)]">
          {files.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No files found</p>
              <p className="text-xs mt-1">Upload or create a file to get started</p>
            </div>
          ) : (
            files.map((file, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-purple-500/10 cursor-pointer transition-colors border-b border-purple-500/10"
                onClick={() => openFile(file)}
              >
                <div className="col-span-1">
                  {file.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="col-span-6 text-sm truncate font-mono">
                  {file.name}
                </div>
                <div className="col-span-2 text-xs text-zinc-500">
                  {file.type === 'file' ? `${(file.size / 1024).toFixed(1)} KB` : '-'}
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  {file.name.endsWith('.zip') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); unzipFile(file); }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-400 hover:text-red-300"
                    onClick={(e) => { e.stopPropagation(); deleteFile(file); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editFile} onOpenChange={() => setEditFile(null)}>
        <DialogContent className="max-w-4xl h-[80vh] glass-strong neon-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              Edit: {editFile?.name}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 font-mono text-sm bg-black/50 border-purple-500/30"
            placeholder="File content..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFile(null)}>Cancel</Button>
            <Button onClick={saveFile} className="btn-neon btn-neon-primary">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="glass-strong neon-border">
          <DialogHeader>
            <DialogTitle>Create New</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newFileType === 'file'}
                    onChange={() => setNewFileType('file')}
                    className="accent-purple-500"
                  />
                  <FileText className="w-4 h-4" /> File
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newFileType === 'directory'}
                    onChange={() => setNewFileType('directory')}
                    className="accent-purple-500"
                  />
                  <Folder className="w-4 h-4" /> Folder
                </label>
              </div>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter name..."
                className="input-neon mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={createNew} className="btn-neon btn-neon-primary">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Panel Component
function AdminPanel() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyType, setNewKeyType] = useState<'single' | 'multi'>('single');
  const [newKeyMaxUses, setNewKeyMaxUses] = useState(1);
  const [newKeyExpiry, setNewKeyExpiry] = useState('');

  useEffect(() => {
    let cancelled = false;
    
    async function fetchKeys() {
      try {
        const res = await fetch('/api/admin/keys');
        const data = await res.json();
        if (data.success && !cancelled) {
          setKeys(data.data);
        }
      } catch {
        toast.error('Failed to load keys');
      }
    }
    
    fetchKeys();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/admin/keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch {
      toast.error('Failed to load keys');
    }
  };

  const createKey = async () => {
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newKeyType,
          maxUses: newKeyMaxUses,
          expiresAt: newKeyExpiry || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('License key created');
        setShowCreateDialog(false);
        loadKeys();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to create key');
    }
  };

  const toggleKey = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadKeys();
      }
    } catch {
      toast.error('Failed to update key');
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Delete this license key?')) return;
    try {
      const res = await fetch(`/api/admin/keys?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Key deleted');
        loadKeys();
      }
    } catch {
      toast.error('Failed to delete key');
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied to clipboard');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-400" />
          License Keys
        </h2>
        <Button onClick={() => setShowCreateDialog(true)} className="btn-neon btn-neon-primary">
          <Plus className="w-4 h-4 mr-2" /> Generate Key
        </Button>
      </div>

      <div className="flex-1 glass rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-purple-500/10 text-xs text-zinc-400 uppercase tracking-wider border-b border-purple-500/20">
          <div className="col-span-3">Key</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Usage</div>
          <div className="col-span-2">Expires</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <ScrollArea className="h-[calc(100%-48px)]">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No license keys found</p>
              <p className="text-xs mt-1">Generate a key to get started</p>
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-purple-500/10"
              >
                <div className="col-span-3 font-mono text-sm flex items-center gap-2">
                  <span className="text-purple-400">{key.key}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyKey(key.key)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    {key.type}
                  </Badge>
                </div>
                <div className="col-span-2 text-sm text-zinc-400">
                  {key.currentUses} / {key.maxUses}
                </div>
                <div className="col-span-2 text-sm text-zinc-400">
                  {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                </div>
                <div className="col-span-2">
                  <Badge
                    className={key.isActive
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                    }
                  >
                    {key.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => toggleKey(key.id, !key.isActive)}
                  >
                    {key.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-400 hover:text-red-300"
                    onClick={() => deleteKey(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-strong neon-border">
          <DialogHeader>
            <DialogTitle>Generate License Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Key Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newKeyType === 'single'}
                    onChange={() => { setNewKeyType('single'); setNewKeyMaxUses(1); }}
                    className="accent-purple-500"
                  />
                  Single Use
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newKeyType === 'multi'}
                    onChange={() => setNewKeyType('multi')}
                    className="accent-purple-500"
                  />
                  Multi Use
                </label>
              </div>
            </div>
            
            {newKeyType === 'multi' && (
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={newKeyMaxUses}
                  onChange={(e) => setNewKeyMaxUses(parseInt(e.target.value) || 1)}
                  className="input-neon mt-2"
                  min={1}
                />
              </div>
            )}
            
            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                className="input-neon mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createKey} className="btn-neon btn-neon-primary">Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main Dashboard Component
function Dashboard({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [activeTab, setActiveTab] = useState('terminal');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const newSocket = io('/?XTransformPort=3003', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('server:stats', (serverStats: ServerStats) => {
      setStats(serverStats);
    });

    newSocket.on('bot:list', (botList: BotInfo[]) => {
      setBots(botList);
    });

    newSocket.on('bot:status', (data: { botId: string; status: string }) => {
      setBots(prev => prev.map(b =>
        b.id === data.botId ? { ...b, status: data.status as any } : b
      ));
    });

    // Set socket in next tick to avoid synchronous setState in effect
    queueMicrotask(() => {
      setSocket(newSocket);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const refreshBots = useCallback(() => {
    socket?.emit('bot:list');
  }, [socket]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    onLogout();
  };

  const menuItems = [
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
    ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Admin' }] : [])
  ];

  return (
    <div className="min-h-screen cyberpunk-bg flex flex-col relative">
      <ParticleBackground />
      
      {/* Header */}
      <header className="glass-strong border-b border-purple-500/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-500" />
              <span className="font-bold text-lg text-glow bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                WALZ EXPLOIT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <Users className="w-3 h-3 mr-1" /> Admin
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
          w-64 sidebar-neon flex flex-col pt-16 lg:pt-0
          transition-transform duration-300 ease-in-out
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${activeTab === item.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col min-h-0">
          {/* Server Stats */}
          <div className="mb-6">
            <ServerStatsPanel stats={stats} />
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'terminal' && (
              <TerminalPanel socket={socket} bots={bots} onRefreshBots={refreshBots} />
            )}
            {activeTab === 'files' && (
              <FileManager socket={socket} />
            )}
            {activeTab === 'admin' && isAdmin && (
              <AdminPanel />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="glass-strong border-t border-purple-500/20 py-4 px-6 text-center relative z-10">
        <p className="text-sm text-zinc-500">
          © WALZ EXPLOIT — All Rights Reserved
        </p>
      </footer>
    </div>
  );
}

// Main Page
export default function Page() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/verify')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true);
          setIsAdmin(data.data?.isAdmin || false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (admin: boolean) => {
    setAuthenticated(true);
    setIsAdmin(admin);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen cyberpunk-bg flex items-center justify-center">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard isAdmin={isAdmin} onLogout={handleLogout} />;
}
