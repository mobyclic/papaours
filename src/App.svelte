<script lang="ts">
  import { onMount } from 'svelte';
  import { initDB } from './lib/db';

  let connected = false;
  let error = '';

  onMount(async () => {
    try {
      await initDB();
      connected = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  });
</script>

<main>
  <div class="container">
    <h1>🐻 Papaours</h1>
    
    <div class="status">
      {#if connected}
        <p class="success">✅ Connecté à SurrealDB (namespace: papaours, database: dbpapaours)</p>
      {:else if error}
        <p class="error">❌ Erreur de connexion: {error}</p>
      {:else}
        <p class="loading">🔄 Connexion en cours...</p>
      {/if}
    </div>

    <div class="info">
      <h2>Stack technique</h2>
      <ul>
        <li>⚡ Bun - Runtime JavaScript ultra-rapide</li>
        <li>🏗️ Vite - Build tool moderne</li>
        <li>🎨 Svelte - Framework réactif</li>
        <li>💾 SurrealDB - Base de données distribuée</li>
        <li>☁️ Cloudflare Pages - Déploiement</li>
      </ul>
    </div>
  </div>
</main>

<style>
  main {
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .container {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 600px;
    width: 90%;
  }

  h1 {
    font-size: 3rem;
    margin: 0 0 2rem 0;
    text-align: center;
    color: #333;
  }

  h2 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem 0;
    color: #555;
  }

  .status {
    margin: 2rem 0;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .status p {
    margin: 0;
    font-weight: 500;
  }

  .success {
    color: #059669;
    background: #d1fae5;
  }

  .error {
    color: #dc2626;
    background: #fee2e2;
  }

  .loading {
    color: #2563eb;
    background: #dbeafe;
  }

  .info {
    margin-top: 2rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0.75rem 0;
    font-size: 1.1rem;
    color: #666;
  }
</style>
