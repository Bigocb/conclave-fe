import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { Agent } from '../../types/api';

interface Props {
  agent: Agent;
}

interface AgentStats {
  review_count: number;
  opinion_count: number;
}

export default function DetailsTab({ agent }: Props) {
  const [fetchedAgent, setFetchedAgent] = useState<Agent | null>(null);
  const [vaultKey, setVaultKey] = useState<string | null | undefined>(undefined);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [vaultError, setVaultError] = useState(false);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [copiedOrg, setCopiedOrg] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    // Fetch enriched agent data (principal + org fields come from GET /:id, not from list)
    api.get<Agent>(`/v1/agents/${agent.id}`)
      .then(setFetchedAgent)
      .catch(() => {});
  }, [agent.id]);

  useEffect(() => {
    api.post<{ vault_key?: string }>(`/v1/agents/${agent.id}/resolve-key`, { fallback_to_provider: true })
      .then(res => {
        setVaultKey(res?.vault_key ?? null);
        setVaultLoading(false);
      })
      .catch(() => {
        setVaultError(true);
        setVaultLoading(false);
      });
  }, [agent.id]);

  useEffect(() => {
    api.get<AgentStats>(`/v1/agents/${agent.id}/stats`)
      .then(setStats)
      .catch(() => {});
  }, [agent.id]);

  const a = fetchedAgent ?? agent;

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
    } catch {}
  };

  const sectionTitle = (text: string) => (
    <p className="text-[10px] mono text-noc-text3 uppercase tracking-widest mb-2">{text}</p>
  );

  const copyButton = (text: string, copied: boolean, setter: (v: boolean) => void) => (
    <button
      onClick={() => copyToClipboard(text, setter)}
      className="text-[10px] mono text-noc-cyan hover:text-noc-green transition-colors shrink-0"
    >
      {copied ? 'COPIED!' : 'COPY'}
    </button>
  );

  const section = (children: React.ReactNode) => (
    <div className="border border-noc-border rounded-lg p-4 bg-noc-bg3/50">{children}</div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 🔑 Agent Token */}
      <div className="col-span-2">
        {sectionTitle('🔑 Agent Token')}
        {section(
          a.token ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs mono text-noc-text2 font-mono break-all flex-1">{a.token}</span>
              {copyButton(a.token, copiedToken, setCopiedToken)}
            </div>
          ) : (
            <p className="text-xs mono text-noc-text3">Token not available in cache — regenerate</p>
          )
        )}
      </div>

      {/* 👤 Principal */}
      <div className="col-span-2 sm:col-span-1">
        {sectionTitle('👤 Principal')}
        {section(
          <div className="space-y-2">
            {a.principal ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs mono text-noc-text2 font-bold">{a.principal.name}</span>
                  {copyButton(a.principal.id, copiedPrincipal, setCopiedPrincipal)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono text-noc-text3">ID:</span>
                  <span className="text-[10px] mono text-noc-text2 font-mono truncate">{a.principal.id}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {a.principal.roles.map(role => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-full text-[10px] mono bg-noc-bg border border-noc-border text-noc-text2"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs mono text-noc-text3">No principal data available</p>
            )}
          </div>
        )}
      </div>

      {/* 🏢 Organization */}
      <div className="col-span-2 sm:col-span-1">
        {sectionTitle('🏢 Organization')}
        {section(
          <div className="space-y-2">
            {a.org ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs mono text-noc-text2 font-bold">{a.org.name}</span>
                  {copyButton(a.org.id, copiedOrg, setCopiedOrg)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono text-noc-text3">Slug:</span>
                  <span className="text-[10px] mono text-noc-text2">{a.org.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono text-noc-text3">ID:</span>
                  <span className="text-[10px] mono text-noc-text2 font-mono">{a.org.id}</span>
                </div>
              </>
            ) : (
              <p className="text-xs mono text-noc-text3">No organization data available</p>
            )}
          </div>
        )}
      </div>

      {/* 🔐 Vault API Key */}
      <div className="col-span-2 sm:col-span-1">
        {sectionTitle('🔐 Vault API Key')}
        {section(
          vaultLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
              <span className="text-xs mono text-noc-text3">Resolving key...</span>
            </div>
          ) : vaultError ? (
            <p className="text-xs mono text-noc-rose">Failed to resolve vault key</p>
          ) : vaultKey ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs mono text-noc-text2 font-mono break-all flex-1">{vaultKey}</span>
              {copyButton(vaultKey, copiedKey, setCopiedKey)}
            </div>
          ) : (
            <p className="text-xs mono text-noc-text3">No API key in vault for this agent</p>
          )
        )}
      </div>

      {/* 📊 Activity Summary */}
      <div className="col-span-2 sm:col-span-1">
        {sectionTitle('📊 Activity Summary')}
        {section(
          stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] mono text-noc-text3 uppercase">Reviews</p>
                <p className="text-lg mono font-bold text-noc-text1">{stats.review_count}</p>
              </div>
              <div>
                <p className="text-[10px] mono text-noc-text3 uppercase">Opinions</p>
                <p className="text-lg mono font-bold text-noc-text1">{stats.opinion_count}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-noc-border">
                <p className="text-[10px] mono text-noc-text3 uppercase">Status</p>
                <p className="text-xs mono text-noc-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-noc-green rounded-full" />
                  {a.status.toUpperCase()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] mono text-noc-text3 uppercase">Created</p>
                <p className="text-xs mono text-noc-text2">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-noc-green border-t-transparent rounded-full animate-spin" />
              <span className="text-xs mono text-noc-text3">Loading stats...</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}