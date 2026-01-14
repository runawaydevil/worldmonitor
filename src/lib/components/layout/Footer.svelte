<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="footer">
	<p class="footer-text">
		<em>Desenvolvido pelo Grupo Murad - {currentYear}</em>
	</p>
</footer>

<style>
	.footer {
		padding: 1rem;
		text-align: center;
		border-top: 1px solid var(--border);
		background: var(--surface);
		margin-top: auto;
	}

	.footer-text {
		margin: 0;
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-style: italic;
	}
</style>
