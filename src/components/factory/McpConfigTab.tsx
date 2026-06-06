import { useState, useMemo } from 'react';
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

/** Recursively walk a config tree and replace the --server arg value. */
function rewriteServerUrl(config: Record<string, unknown>, newUrl: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(config)) {
    if (key === 'args' && Array.isArray(val)) {
      out[key] = [];
      for (let i = 0; i < val.length; i++) {
        if (val[i] === '--server' && i + 1 < val.length) {
          (out[key] as unknown[]).push(val[i], newUrl);
          i++; // skip the next element (old url)
        } else {
          (out[key] as unknown[]).push(val[i]);
        }
      }
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      out[key] = rewriteServerUrl(val as Record<string, unknown>, newUrl);
    } else if (Array.isArray(val)) {
      out[key] = val.map((v) =>
        typeof v === 'object' && v !== null
          ? rewriteServerUrl(v as Record<string, unknown>, newUrl)
          : v,
      );
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Build YAML for Hermes Agent config. */
function toYaml(config: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push('mcp_servers:');
  const servers = config.mcp_servers as Record<string, unknown> | undefined;
  if (servers) {
    const name = Object.keys(servers)[0];
    lines.push(`  ${name}:`);
    const inner = servers[name] as Record<string, unknown>;
    lines.push(`    command: ${JSON.stringify(inner.command)}`);
    lines.push('    args:');
    for (const arg of inner.args as string[]) {
      lines.push(`      - ${JSON.stringify(arg)}`);
    }
  }
  return lines.join('\n');
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
  const [customUrl, setCustomUrl] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['mcp-config', agent.id],
    queryFn: async () => {
      const res = await api.get<McpConfigResponse>(`/v1/agents/${encodeURIComponent(agent.id)}/mcp-config`);
      return res;
    },
  });

  const effectiveUrl = customUrl.trim() || data?.api_url || '';
  const displayUrl = customUrl || data?.api_url || '';

  // Rewrite all configs whenever effectiveUrl changes
  const rewrittenConfigs = useMemo(() => {
    if (!data || !effectiveUrl) return null;
    return data.configs.map((host) => ({
      ...host,
      config: effectiveUrl !== data.api_url
        ? rewriteServerUrl(host.config, effectiveUrl)
        : host.config,
    }));
  }, [data, effectiveUrl]);

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

  const configs = rewrittenConfigs ?? data.configs;

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

      {/* Editable API URL */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] mono text-noc-text3 uppercase tracking-widest font-bold">
          Conclave API URL
        </label>
        <div className="flex items-center gap-2 bg-black/30 border border-noc-border rounded-lg px-3 py-2">
          <input
            type="text"
            value={displayUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="bg-transparent text-xs mono text-noc-text1 flex-1 focus:outline-none border-none p-0"
            placeholder={data.api_url}
          />
          {customUrl && (
            <button
              onClick={() => setCustomUrl('')}
              className="text-[10px] mono text-noc-text3 hover:text-noc-text1 transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-[9px] mono text-noc-text4">
          {customUrl
            ? `Using custom API URL — all configs updated`
            : `Auto-detected from deployment — ${data.api_url}`}
        </p>
      </div>

      {/* Connection info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Principal ID</p>
            <p className="text-xs mono text-noc-text1 truncate font-mono">{data.agent_id}</p>
          </div>
          <div>
            <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest">Agent Token</p>
            <p className="text-xs mono text-noc-text1 truncate">
              clv_…{agent.id.slice(-8)}
            </p>
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
            configJson = toYaml(host.config);
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