<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let card;

    let votes = [
        {"title": "Vote", "count": 0}
    ];

    let editing = false;
    
    function handleDragStart(e) {
        dispatch("dragstart", e)
    }
    
    function handleDragEnd(e) {
        dispatch("dragend", e)
    }

    function handleEdit(e) {
        editing = true;
    }

    function handleDoneEdit(e) {
        editing = false;
    }
    
</script>


<sl-card class="card" id={card.id} draggable="{!editing}" on:dragstart={handleDragStart} on:dragend={handleDragEnd} >
    <div contenteditable="{editing}" on:dblclick={handleEdit} on:blur={handleDoneEdit}>{card.description}</div>
    <div slot="footer">
        <div>
            {#each votes as vote}
            <sl-tooltip content="{vote.title}">
                {vote.count} <i class="fa-regular fa-ballot-check"></i>
            </sl-tooltip>                
            {/each}
        </div>
        <div>
            <i class="fa-regular fa-face-smile"></i>
            <sl-tooltip content="{card.expand.user.name}">
                <i class="fa-solid fa-user"></i>
            </sl-tooltip>
        </div>
    </div>
</sl-card>

<style>
    .card {
        border-width: 3px 1px 1px;
        box-shadow: var(--sl-shadow-large);
        margin-bottom: 1rem;
        width: 100%;
    }
    .card [slot='footer'] {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
</style>