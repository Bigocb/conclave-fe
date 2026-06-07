import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Agent } from '../types/api';
import { api } from '../api/client';
import DetailsTab from '../components/factory/DetailsTab';

vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockAgent: Agent = {
  id: 'agt_abc123',
  name: 'test-agent',
  type: 'llm',
  provider: 'openai',
  model: 'gpt-4',
  principal_id: 'prn_xyz',
  org_id: 'org_demo',
  status: 'active',
  token: 'clv_token_abc',
  created_at: '2026-06-01T00:00:00Z',
  principal: {
    id: 'prn_xyz',
    name: 'Test Principal',
    roles: ['reviewer', 'submitter'],
  },
  org: {
    id: 'org_demo',
    name: 'Demo Organization',
    slug: 'demo-org',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: resolve with empty/null data so .then() never fails
  vi.mocked(api.post).mockResolvedValue({ vault_key: null });
  vi.mocked(api.get).mockResolvedValue({ review_count: 0, opinion_count: 0 });
});

describe('DetailsTab', () => {
  it('renders all five sections with correct titles', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('🔑 Agent Token')).toBeInTheDocument();
    expect(screen.getByText('👤 Principal')).toBeInTheDocument();
    expect(screen.getByText('🏢 Organization')).toBeInTheDocument();
    expect(screen.getByText('🔐 Vault API Key')).toBeInTheDocument();
    expect(screen.getByText('📊 Activity Summary')).toBeInTheDocument();
  });

  it('renders token value when present', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('clv_token_abc')).toBeInTheDocument();
  });

  it('renders principal name, id and roles', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('Test Principal')).toBeInTheDocument();
    expect(screen.getByText('prn_xyz')).toBeInTheDocument();
    expect(screen.getByText('reviewer')).toBeInTheDocument();
    expect(screen.getByText('submitter')).toBeInTheDocument();
  });

  it('renders org name, slug and id', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('Demo Organization')).toBeInTheDocument();
    expect(screen.getByText('demo-org')).toBeInTheDocument();
    expect(screen.getAllByText('org_demo').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Token not available" message when token is null', () => {
    const noToken = { ...mockAgent, token: undefined };
    render(<DetailsTab agent={noToken} />);

    expect(screen.getByText('Token not available in cache — regenerate')).toBeInTheDocument();
  });

  it('shows fallback text when principal is missing', () => {
    const noPrincipal = { ...mockAgent, principal: undefined };
    render(<DetailsTab agent={noPrincipal} />);

    expect(screen.getByText('No principal data available')).toBeInTheDocument();
  });

  it('shows fallback text when org is missing', () => {
    const noOrg = { ...mockAgent, org: undefined };
    render(<DetailsTab agent={noOrg} />);

    expect(screen.getByText('No organization data available')).toBeInTheDocument();
  });

  it('shows loading spinner for vault key on mount', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('Resolving key...')).toBeInTheDocument();
  });

  it('shows loading spinner for stats on mount', () => {
    render(<DetailsTab agent={mockAgent} />);

    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
  });

  it('copies token to clipboard when token COPY button is clicked', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<DetailsTab agent={mockAgent} />);

    const copyBtns = screen.getAllByText('COPY');
    await user.click(copyBtns[0]);

    expect(writeText).toHaveBeenCalledWith('clv_token_abc');
  });

  it('shows "COPIED!" after clicking token copy button', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      writable: true,
      configurable: true,
    });

    render(<DetailsTab agent={mockAgent} />);

    const copyBtns = screen.getAllByText('COPY');
    await user.click(copyBtns[0]);

    expect(screen.getByText('COPIED!')).toBeInTheDocument();
  });

  it('resolves vault key on mount and shows it with copy button', async () => {
    vi.mocked(api.post).mockResolvedValue({ vault_key: 'sk-abc123' });
    vi.mocked(api.get).mockResolvedValue({ review_count: 5, opinion_count: 2 });

    render(<DetailsTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('sk-abc123')).toBeInTheDocument();
    });

    expect(api.post).toHaveBeenCalledWith(
      '/v1/agents/agt_abc123/resolve-key',
      { fallback_to_provider: true }
    );
  });

  it('shows "No API key" message when vault key resolves empty', async () => {
    vi.mocked(api.post).mockResolvedValue({ vault_key: null });
    vi.mocked(api.get).mockResolvedValue({ review_count: 0, opinion_count: 0 });

    render(<DetailsTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('No API key in vault for this agent')).toBeInTheDocument();
    });
  });

  it('shows error message when vault key resolve fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'));
    vi.mocked(api.get).mockResolvedValue({ review_count: 0, opinion_count: 0 });

    render(<DetailsTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to resolve vault key')).toBeInTheDocument();
    });
  });

  it('displays stats from API', async () => {
    vi.mocked(api.post).mockResolvedValue({ vault_key: null });
    vi.mocked(api.get).mockResolvedValue({ review_count: 42, opinion_count: 7 });

    render(<DetailsTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/v1/agents/agt_abc123/stats');
  });

  it('calls resolve-key with the correct agent ID', async () => {
    vi.mocked(api.post).mockResolvedValue({ vault_key: 'sk-xyz' });
    vi.mocked(api.get).mockResolvedValue({ review_count: 0, opinion_count: 0 });

    render(<DetailsTab agent={mockAgent} />);

    await waitFor(() => {
      expect(screen.getByText('sk-xyz')).toBeInTheDocument();
    });

    expect(api.post).toHaveBeenCalledWith(
      '/v1/agents/agt_abc123/resolve-key',
      { fallback_to_provider: true }
    );
  });
});