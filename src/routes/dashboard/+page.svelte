// src/routes/dashboard/+page.svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { partnerDocumentsApi, commissionsApi, logsApi } from "$lib/api/client";

  interface DashboardStats {
    totalDocuments: number;
    activeCommissions: number;
    errorsLast7Days: number;
  }

  let stats: DashboardStats | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // Fetch real data
      const [docs, comms, errors] = await Promise.all([
        partnerDocumentsApi.list({ page: 1, pageSize: 1 }),
        commissionsApi.list({ page: 1, pageSize: 1 }),
        logsApi.getErrorCount("org_placeholder", "week"),
      ]);

      stats = {
        totalDocuments: docs.data?.total ?? 0,
        activeCommissions: comms.data?.total ?? 0,
        errorsLast7Days: errors.data?.count ?? 0,
      };
    } catch (e: unknown) {
      // Fallback to mock data for demo
      stats = {
        totalDocuments: 0,
        activeCommissions: 0,
        errorsLast7Days: 0,
      };
    } finally {
      loading = false;
    }
  });
</script>

<div class="dashboard">
  <h1>Broker Dashboard</h1>

  <div class="stats-grid">
    {#if loading}
      <div class="stat-card loading">Loading...</div>
      <div class="stat-card loading">Loading...</div>
      <div class="stat-card loading">Loading...</div>
    {:else if error}
      <div class="stat-card error">{error}</div>
    {:else if stats}
      <div class="stat-card">
        <h3>Partner Documents</h3>
        <p class="value">{stats.totalDocuments}</p>
      </div>
      <div class="stat-card">
        <h3>Active Commissions</h3>
        <p class="value">{stats.activeCommissions}</p>
      </div>
      <div class="stat-card">
        <h3>Errors (7d)</h3>
        <p class="value" class:warn={stats.errorsLast7Days > 0}>{stats.errorsLast7Days}</p>
      </div>
    {/if}
  </div>

  <div class="quick-links">
    <a href="/partner-documents" class="link">Partner Documents</a>
    <a href="/commissions" class="link">Commissions</a>
    <a href="/logs" class="link">System Logs</a>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary, #1a1a2e);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--surface-primary, #f8f9fa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .stat-card.loading {
    color: #999;
  }

  .stat-card.error {
    color: #e74c3c;
    text-align: left;
  }

  .stat-card h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary, #666);
    margin-bottom: 0.5rem;
  }

  .stat-card .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary, #1a1a2e);
  }

  .stat-card .value.warn {
    color: #e74c3c;
  }

  .quick-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .quick-links .link {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color, #2563eb);
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
  }

  .quick-links .link:hover {
    background: var(--primary-hover, #1d4ed8);
  }
</style>
