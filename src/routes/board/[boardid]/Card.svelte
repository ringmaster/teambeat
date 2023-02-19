<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let card;

    function handleDragStart(e) {
        dispatch("dragstart", e)
    }

    function handleDragEnd(e) {
        dispatch("dragend", e)
    }
    
</script>


<sl-card class="card" id={card.id} draggable=true on:dragstart={handleDragStart} on:dragend={handleDragEnd} >
    {card.description}
    <div slot="footer">
        <sl-rating></sl-rating>
        <sl-tooltip content="{card.expand.user.name}">
            <i class="fa-solid fa-user"></i>
        </sl-tooltip>
    </div>
</sl-card>

<style>
    .card {
        border-width: 3px 1px 1px;
        box-shadow: var(--sl-shadow-large);
        margin-bottom: 1rem;
    }
    .card [slot='footer'] {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
</style>