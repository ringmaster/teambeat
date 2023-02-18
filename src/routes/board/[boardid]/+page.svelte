<script>
    import { pbStore } from "svelte-pocketbase";
    
    export let data;
    
    let status = '';
    let dropped_in = false;
    
    // Always escape HTML for text arguments!
    function escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    // Custom function to emit toast notifications
    function notify(message, variant = 'primary', icon = 'info-circle', duration = 3000) {
        const alert = Object.assign(document.createElement('sl-alert'), {
            variant,
            closable: true,
            duration: duration,
            innerHTML: `
            <sl-icon name="${icon}" slot="icon"></sl-icon>
            ${escapeHtml(message)}
            `
        });
        
        document.body.append(alert);
        return alert.toast();
    }
    
    
    async function getBoard() {
        let boardData = await $pbStore.collection('boards').getOne(data.params.boardid, {expand: "users,facilitators,scenes(board),columns(board)"});
        let board = {
            name: boardData.name
        }
        
        let columnData = boardData.expand["columns(board)"];
        
        board.columns = columnData.map(async (column) => {
            let cardData = await $pbStore.collection('cards').getFullList(10, {
                sort: "+created",
                filter: 'column = "' + column.id + '"',
                expand: 'user',
                '$cancelKey': column.id // Wihtout this, the client cancels separate column requests as non-unique
            })
            column.cards = cardData;
            return column;
        })
        
        return board;
    }
    
    let board = getBoard();
    
    // https://svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
    // https://www.javascripttutorial.net/web-apis/javascript-drag-and-drop/
    
    function handleDragStart(e) {
        status = "Dragging the element " + e
        .currentTarget
        .getAttribute('id');
        // This sets the class on the original before the dragged clone is made
        window.setTimeout(()=>e.target.classList.add('novis'), 0);
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer
        .setData("text", e.target.getAttribute('id'));
    }
    
    function handleDragEnd(e) {
        e.preventDefault();
        if (dropped_in == false) {
            e.target.classList.remove('novis');
            status = "You let the " + e
            .target
            .getAttribute('id') + " go.";
        }
        dropped_in = false;
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        status = "You are dragging over the " + e
        .currentTarget
        .getAttribute('id');
        console.log(e)
        let columnOver = document.getElementsByClassName('column-over')
        for(let element of columnOver) {
            element.classList.remove('column-over');
        };
        e.target.closest('.column').classList.add('column-over')
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        if(e.target.classList.contains('column')) {
            status = "You left the " + e.target.getAttribute('id');
            e.target.closest('.column').classList.remove('column-over');
        }
        else {
            e.cancelBubble = true;
        }
    }
    
    async function handleDragDrop(e) {
        e.preventDefault();
        e.target.closest('.column').classList.remove('column-over');
        var element_id = e.dataTransfer.getData("text");
        document.getElementById(element_id).classList.remove('novis');
        dropped_in = true;
        status = "You droped " + element_id + " into drop zone " + e.target.closest('.column').id;
        notify(status)
        
        // Load the initial card data
        let record = await $pbStore.collection('cards').getOne(element_id);
        
        // Update the column on the card
        record.column = e.target.closest('.column').id;
        
        // Submit the updated data
        record = await $pbStore.collection('cards').update(element_id, record);
        
        // Reload the whole board
        board = getBoard();
    }
    
</script>


{#await board}
<div class="container">
    <h1>Loading Board {data.params.boardid}</h1>
    <p>Loading...</p>
</div>
<div>Loading...</div>    
{:then board} 
<div class="container">
    <h1>{board.name}</h1>
    <p>{status}</p>
</div>
<div class="boardscroll">
    <div class="board">
        <div class="row">
            {#each board.columns as column}
            {#await column then column}
            
            <div class="column"
            on:dragenter={handleDragEnter} 
            on:dragleave={handleDragLeave}  
            on:dragover={handleDragEnter}
            on:drop={handleDragDrop} 
            id="{column.id}"
            >
            <h2>{column.title}</h2>
            
            {#await column.cards then cards}
            {#if cards}
            {#each cards as card(card.id)}
            <sl-card class="card" id={card.id} draggable=true on:dragstart={handleDragStart} on:dragend={handleDragEnd}>
                {card.description}
                <div slot="footer">
                    <sl-rating></sl-rating>
                    <sl-tooltip content="{card.expand.user.name}">
                        <i class="fa-solid fa-user"></i>
                    </sl-tooltip>
                </div>
            </sl-card>
            {/each}
            
            <sl-card class="card addcard fullwidth">
                <div>
                    <i class="fa-solid fa-circle-plus"></i>
                </div>
            </sl-card>
            {/if}
            {/await}
            
        </div>
        {/await}
        
        {/each}
    </div>
</div>
</div>

{/await}

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
    .addcard {
        width: 100%;
        text-align: center;
    }
    :global(.column-over) {
        background-color: #eee;
    }
    :global(.novis) {
        opacity: 0.0;
    }
</style>
