// src/routes/commissions/+page.svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { commissionsApi } from "$lib/api/client";

  let commissions = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = true;
  let error: string | null = null;

  async function fetchData() {
    loading = true;
    error = null;
    try {
      const res = await commissionsApi.list({ page, pageSize });
      if (res.success && res.data) {
        commissions = res.data.commissions || [];
        total = res.data.total || 0;
      }
    } catch (e) {
      error = "Failed to load commissions";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });
</script>

<div class="page-container">
  <header class="page-header">
    <h1>Partnership Commissions</h1>
    <button class="btn-primary" on:click={() => console.log("Open create modal")}>
      + New Commission
    </button>
  </header>

  {#if loading}
    <div class="state-msg">Loading...</div>
  {:else if error}
    <div class="state-msg error">{error}</div>
  {:else if commissions.length === 0}
    <div class="state-msg">No commissions found.</div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>Partner</th>
          <th>Type</th>
          <th>Rate</th>
          <th>Currency</th>
          <th>Period</th>
          <th>Status</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each commissions as comm}
          <tr>
            <td>{comm.partner?.name ?? "—"}</td>
            <td>{comm.commission_type}</td>
            <td>{comm.rate ? `${comm.rate}%` : comm.fixed_amount ?? "—"}</td>
            <td>{comm.currency}</td>
            <td>{comm.period ?? "—"}</td>
            <td>
              <span class="badge status-{comm.status ?? 'draft'}">
                {comm.status ?? "draft"}
              </span>
            </td>
            <td>{new Date(comm.created_at).toLocaleDateString()}</td>
            <td>
              <a href={`/commissions/${comm.id}`}>View</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    background: var(--background, #f5f7fa);
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.6rem;
    margin: 0;
  }

  .state-msg {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .state-msg.error {
    color: #ef4444;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  .data-table th {
    background: #f9fafb;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .data-table td a {
    color: #2563eb;
    text-decoration: none;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-active {
    background: #d1fae5;
    color: #065f46;
  }

  .status-expired {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-draft {
    background: #e5e7eb;
    color: #374151;
  }

  .status-negotiated {
    background: #dbeafe;
    color: #1e40af;
  }
</style>
