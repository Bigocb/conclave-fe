import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';
import { Button, Card } from '../ui/core';
import { Copy, Check, Terminal, FileCode, Download } from 'lucide-react';

interface Props {
  agent: Agent;
}

interface McpHostConfig {
  label: string;
  description: string;
  filename: string;
  config: Record<string, unknown>;
}

interface McpConfigResponse {
  agent_id: string;
  agent_name: string;
  api_url: string;
  configs: McpHostConfig[];
}

function ConfigBlock({ config, label, filename }: { config: string; label: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-noc-text3" />
          <span className="text-xs mono text-noc-text1 font-bold">{label}</span>
          <span className="text-[9px] mono text-noc-text3 italic">{filename}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} className="p-1.5" variant="secondary">
            {copied ? <Check size={12} className="text-noc-green" /> : <Copy size={12} />}
          </Button>
          <Button onClick={handleDownload} className="p-1.5" variant="secondary">
            <Download size={12} />
          </Button>
        </div>
      </div>
      <pre className="bg-black/40 border border-noc-border rounded-lg p-3 overflow-x-auto">
        <code className="text-[11px] mono text-noc-text2 leading-relaxed">{config}</code>
      </pre>
    </div>
  );
}

export default function McpConfigTab({ agent }: Props) {
  const [localPath, setLocalPath] = useState('src/mcp/index.ts');

  const { data, isLoading, error } = useQuery({
    queryKey: ['mcp-config', agent.id],
    queryFn: async () => {
      const res = await api.get<McpConfigResponse>(`/v1/agents/${encodeURIComponent(agent.id)}/mcp-config`);
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-32 flex items-center justify-center border border-dashed border-noc-border rounded-xl">
        <p className="text-xs mono text-noc-text3 italic">Failed to load MCP configuration</p>
      </div>
    );
  }

  const configs = data.configs;

  return (
    <div className="flex flex-col gap-6">
      {/* Local path input */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] mono text-noc-text3 uppercase tracking-widest font-bold">
          Local MCP Script Path
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-noc-border rounded-lg px-3 py-2">
            <Terminal size={14} className="text-noc-text3 shrink-0" />
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              className="bg-transparent text-xs mono text-noc-text1 flex-1 focus:outline-none border-none p-0"
              placeholder="src/mcp/index.ts"
            />
          </div>
          <span className="text-[10px] mono text-noc-text3 whitespace-nowrap">
            npx tsx {localPath}
          </span>
        </div>
      </div>

      {/* Connection info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">API URL</p>
            <p className="text-xs mono text-noc-text1 truncate">{data.api_url}</p>
          </div>
          <div>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Principal ID</p>
            <p className="text-xs mono text-noc-text1 truncate">{data.agent_id}</p>
          </div>
        </div>
      </Card>

      {/* Config snippets */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs mono text-noc-text2 uppercase tracking-wider font-bold">
          MCP Client Configurations ({configs.length})
        </h3>
        {configs.map((host) => {
          let configJson = JSON.stringify(host.config, null, 2);

          // For Hermes Agent, show YAML instead of JSON
          if (host.label === 'Hermes Agent') {
            const yamlLines: string[] = [];
            yamlLines.push('mcp_servers:');
            yamlLines.push(`  ${Object.keys(host.config.mcp_servers as Record<string, unknown>)[0]}:`);
            const inner = (host.config.mcp_servers as Record<string, unknown>)[Object.keys(host.config.mcp_servers as Record<string, unknown>)[0]] as Record<string, unknown>;
            yamlLines.push(`    command: ${JSON.stringify(inner.command)}`);
            yamlLines.push('    args:');
            for (const arg of inner.args as string[]) {
              yamlLines.push(`      - ${JSON.stringify(arg)}`);
            }
            configJson = yamlLines.join('\n');
          }

          return (
            <ConfigBlock
              key={host.label}
              label={host.label}
              filename={host.filename}
              config={configJson}
            />
          );
        })}
      </div>
    </div>
  );
}