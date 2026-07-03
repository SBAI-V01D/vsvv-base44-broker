// src/routes/partner-documents/+page.svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { partnerDocumentsApi } from "$lib/api/client";

  let documents = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = true;
  let error: string | null = null;
  let search = "";
  let typeFilter = "";

  async function fetchData() {
    loading = true;
    error = null;
    try {
      const res = await partnerDocumentsApi.list({ page, pageSize, search: search || undefined, type: typeFilter || undefined });
      if (res.success && res.data) {
        documents = res.data.documents || [];
        total = res.data.total || 0;
      }
    } catch (e) {
      error = "Failed to load partner documents";
    } finally {
      loading = false;
    }
  }

  function handleSearch() {
    page = 1;
    fetchData();
  }

  function nextPage() {
    if (page * pageSize < total) {
      page++;
      fetchData();
    }
  }

  function prevPage() {
    if (page > 1) {
      page--;
      fetchData();
    }
  }

  onMount(() => {
    fetchData();
  });
</script>

<div class="page-container">
  <header class="page-header">
    <h1>Partner Documents</h1>
    <button class="btn-primary" on:click={() => console.log("Open upload modal")}>
      + Upload Document
    </button>
  </header>

  <div class="filters">
    <input
      type="search"
      placeholder="Search documents..."
      bind:value={search}
      on:keyup={handleSearch}
      class="search-input"
    />
    <select bind:value={typeFilter} on:change={handleSearch} class="filter-select">
      <option value="">All Types</option>
      <option value="contract">Contract</option>
      <option value="policy">Policy</option>
      <option value="certificate">Certificate</option>
      <option value="id">ID</option>
    </select>
  </div>

  {#if loading}
    <div class="state-msg">Loading...</div>
  {:else if error}
    <div class="state-msg error">{error}</div>
  {:else if documents.length === 0}
    <div class="state-msg">No partner documents found.</div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Company</th>
          <th>Uploaded By</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each documents as doc}
          <tr>
            <td>{doc.name}</td>
            <td>{doc.type}</td>
            <td>{doc.company_name ?? "—"}</td>
            <td>{doc.uploader?.name ?? "—"}</td>
            <td>{new Date(doc.created_at).toLocaleDateString()}</td>
            <td>
              <a href={`/partner-documents/${doc.id}`}>View</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="pagination">
      <button on:click={prevPage} disabled={page <= 1} class="btn-secondary">
        Previous
      </button>
      <span>Page {page} of {Math.ceil(total / pageSize)}</span>
      <button on:click={nextPage} disabled={page * pageSize >= total} class="btn-secondary">
        Next
      </button>
    </div>
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

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .filter-select {
    padding: 0.6rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
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

  .data-table td a:hover {
    text-decoration: underline;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn-primary, .btn-secondary {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-secondary {
    background: #e5e7eb;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #d1d5db;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
