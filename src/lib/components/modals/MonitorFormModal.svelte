<script lang="ts">
	import Modal from './Modal.svelte';
	import { monitors } from '$lib/stores';
	import type { CustomMonitor } from '$lib/types';

	interface Props {
		open: boolean;
		onClose: () => void;
		editMonitor?: CustomMonitor | null;
	}

	let { open = false, onClose, editMonitor = null }: Props = $props();

	let name = $state('');
	let keywords = $state('');
	let enabled = $state(true);
	let error = $state('');

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			if (editMonitor) {
				name = editMonitor.name;
				keywords = editMonitor.keywords.join(', ');
				enabled = editMonitor.enabled;
			} else {
				name = '';
				keywords = '';
				enabled = true;
			}
			error = '';
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();

		const trimmedName = name.trim();
		
		// Validação de comprimento máximo
		if (trimmedName.length > 50) {
			error = 'Nome deve ter no máximo 50 caracteres';
			return;
		}
		
		// Validação de caracteres permitidos (apenas letras, números, espaços e alguns caracteres especiais)
		const namePattern = /^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/;
		if (!namePattern.test(trimmedName)) {
			error = 'Nome contém caracteres inválidos';
			return;
		}
		
		if (!trimmedName) {
			error = 'Nome é obrigatório';
			return;
		}

		const keywordList = keywords
			.split(',')
			.map((k) => k.trim().toLowerCase())
			.filter((k) => k.length > 0);

		// Validação de palavras-chave
		if (keywordList.length === 0) {
			error = 'Pelo menos uma palavra-chave é obrigatória';
			return;
		}
		
		// Validar cada palavra-chave (máximo 30 caracteres, apenas letras, números e hífens)
		const keywordPattern = /^[a-zA-Z0-9\-_]+$/;
		for (const keyword of keywordList) {
			if (keyword.length > 30) {
				error = `Palavra-chave "${keyword}" excede 30 caracteres`;
				return;
			}
			if (!keywordPattern.test(keyword)) {
				error = `Palavra-chave "${keyword}" contém caracteres inválidos`;
				return;
			}
		}

		if (editMonitor) {
			// Update existing monitor
			monitors.updateMonitor(editMonitor.id, {
				name: trimmedName,
				keywords: keywordList,
				enabled
			});
		} else {
			// Create new monitor
			const result = monitors.addMonitor({
				name: trimmedName,
				keywords: keywordList,
				enabled
			});

			if (!result) {
				error = 'Número máximo de monitores atingido (20)';
				return;
			}
		}

		onClose();
	}

	function handleDelete() {
		if (editMonitor) {
			monitors.deleteMonitor(editMonitor.id);
			onClose();
		}
	}
</script>

<Modal {open} title={editMonitor ? 'Editar Monitor' : 'Criar Monitor'} {onClose}>
	<form class="monitor-form" onsubmit={handleSubmit}>
		{#if error}
			<div class="form-error">{error}</div>
		{/if}

		<div class="form-group">
			<label for="monitor-name">Nome</label>
			<input
				id="monitor-name"
				type="text"
				bind:value={name}
				placeholder="ex: Crise Ucraniana"
				maxlength="50"
			/>
		</div>

		<div class="form-group">
			<label for="monitor-keywords">Palavras-chave (separadas por vírgula)</label>
			<input
				id="monitor-keywords"
				type="text"
				bind:value={keywords}
				placeholder="ex: ucrania, zelensky, kiev"
			/>
			<p class="form-hint">Notícias que correspondam a qualquer uma dessas palavras-chave aparecerão no seu monitor</p>
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={enabled} />
				<span>Habilitado</span>
			</label>
		</div>

		<div class="form-actions">
			{#if editMonitor}
				<button type="button" class="delete-btn" onclick={handleDelete}> Excluir </button>
			{/if}
			<button type="button" class="cancel-btn" onclick={onClose}> Cancelar </button>
			<button type="submit" class="submit-btn">
				{editMonitor ? 'Salvar Alterações' : 'Criar Monitor'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.monitor-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-error {
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		padding: 0.5rem;
		color: var(--danger);
		font-size: 0.7rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.form-group label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.form-group input[type='text'] {
		padding: 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.form-group input[type='text']:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.7rem;
		color: var(--text-primary);
	}

	.checkbox-label input {
		accent-color: var(--accent);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.cancel-btn,
	.submit-btn,
	.delete-btn {
		padding: 0.5rem 1rem;
		min-height: 44px;
		min-width: 44px;
		border-radius: 4px;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	@media (max-width: 768px) {
		.cancel-btn,
		.submit-btn,
		.delete-btn {
			min-height: 44px;
			min-width: 44px;
			padding: 0.6rem 1.2rem;
		}
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.cancel-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.submit-btn {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: white;
	}

	.submit-btn:hover {
		filter: brightness(1.1);
	}

	.delete-btn {
		background: transparent;
		border: 1px solid rgba(255, 68, 68, 0.3);
		color: var(--danger);
		margin-right: auto;
	}

	.delete-btn:hover {
		background: rgba(255, 68, 68, 0.1);
	}
</style>
