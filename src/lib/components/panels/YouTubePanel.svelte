<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { PANELS } from '$lib/config';
</script>

<Panel id="youtube" title={PANELS.youtube.name}>
	<div class="youtube-container">
		<iframe
			width="560"
			height="315"
			src="https://www.youtube.com/embed/RqjoDY92FuM?si=YT2F7ZeiA2AlWSZa&autoplay=1&mute=1"
			title="YouTube video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			referrerpolicy="strict-origin-when-cross-origin"
			allowfullscreen
		></iframe>
	</div>
</Panel>

<style>
	.youtube-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		background: var(--surface);
		border-radius: 4px;
	}

	.youtube-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 4px;
	}
</style>
