<script>
    export let data;
    
    let status = '';
    let dropped_in = false;
    
    
    // https://svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
    
    function handleDragStart(e) {
        status = "Dragging the element " + e
        .currentTarget
        .getAttribute('id');
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer
        .setData("text", e.target.getAttribute('id'));
    }
    
    function handleDragEnd(e) {
        if (dropped_in == false) {
            status = "You let the " + e
            .target
            .getAttribute('id') + " go.";
        }
        dropped_in = false;
    }
    
    function handleDragEnter(e) {
        status = "You are dragging over the " + e
        .currentTarget
        .getAttribute('id');
        console.log(e)
    }
    
    function handleDragLeave(e) {
        if(e.target == e.currentTarget) {
            status = "You left the " + e
            .target
            .getAttribute('id');
        }
    }
    
    function handleDragDrop(e) {
        e.preventDefault();
        var element_id = e
        .dataTransfer
        .getData("text");
        dropped = dropped.concat(element_id);
        dropped_in = true;
        status = "You droped " + element_id + " into drop zone";
    }
    
</script>

<div class="container">
    <h1>{data.board.name}</h1>
    <p>{status}</p>
</div>

<div class="boardscroll">
    <div class="board">
        <div class="row">
            
            {#each data.board.expand.columns as column}
            
            <div class="column"
            on:dragenter={handleDragEnter} 
            on:dragleave={handleDragLeave}  
            on:drop={handleDragDrop} 
            id="{column.title}"
            >
            <h2 >{column.title}</h2>
            
            {#if column.expand.cards}
            {#each column.expand.cards as card(card.id)}
            <sl-card 
            class="card" 
            id={card.id} 
            draggable=true 
            on:dragstart={handleDragStart} 
            on:dragend={handleDragEnd}
            >
            {card.description}
            <div slot="footer">
                <sl-rating></sl-rating>
                <sl-tooltip content="{card.expand.user.name}">
                    <i class="fa-solid fa-user"></i>
                </sl-tooltip>
            </div>
        </sl-card>
        {/each}
        {/if}
    </div>
    
    {/each}
</div>

</div>
</div>

<style>
    .container {
        padding-bottom: 0;
    }
    .boardscroll {
        overflow-x:scroll;
    }
    .board {
        margin: 0 calc((100% - 80rem)/2) 3rem;
        padding: 20px;
        min-height: 70vh;
    }
    .column {
        min-width: 30rem;
    }
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
