<script>
    import { pbStore } from "svelte-pocketbase";
    import Card from "./Card.svelte";
    
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
            await column;
            column.reload = ()=>column.cards = loadCards(column);
            column.reload();
            return column;
        })
        
        return board;
    }
    
    async function loadCards(column) {
        let cardData = await $pbStore.collection('cards').getFullList(10, {
            sort: "+created",
            filter: 'column = "' + column.id + '"',
            expand: 'user',
            '$cancelKey': column.id // Wihtout this, the client cancels separate column requests as non-unique
        })
        return cardData;
    }
    
    let board = getBoard();
    
    // https://svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
    // https://www.javascripttutorial.net/web-apis/javascript-drag-and-drop/
    
    function handleDragStart(e) {
        status = "Dragging the element " + e.detail.currentTarget.getAttribute('id');
        // This sets the class on the original before the dragged clone is made
        window.setTimeout(()=>e.detail.target.classList.add('novis'), 0);
        e.detail.dataTransfer.dropEffect = "move";
        e.detail.dataTransfer.setData("text", e.detail.target.getAttribute('id'));
    }
    
    function handleDragEnd(e) {
        e.preventDefault();
        if (dropped_in == false) {
            window.setTimeout(()=>e.detail.target.classList.remove('novis'), 0);
            console.log(e);
            status = "You let the " + e.detail.target.getAttribute('id') + " go.";
        }
        dropped_in = false;
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        status = "You are dragging over " + e.currentTarget.getAttribute('id');
        let columnOver = document.getElementsByClassName('column-over')
        for(let element of columnOver) {
            element.classList.remove('column-over');
        };
        e.target.closest('.column').classList.add('column-over')
    }
    
    function handleDragOver(e) {
        e.preventDefault();
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
        
        console.log("BOARD", board);
        
        // Load the initial card data
        let record = await $pbStore.collection('cards').getOne(element_id);
        
        // Update the column on the card
        record.column = e.target.closest('.column').id;
        
        // Submit the updated data
        record = await $pbStore.collection('cards').update(element_id, record);
        
        // Reload the whole board
        //board = getBoard();
        
        // Reload the destination column
        board.then((board)=>{
            console.log("COLUMNS 2", board);
            for(let column of board.columns) {
                column.then((column) => {
                    console.log(column.id, e.target.closest('.column').id)
                    //if(column.id == e.target.closest('.column').id) {
                        column.cards = loadCards(column);
                    //}
                    return column;
                })
            }
            return board;
        })
        
        // Reload the source column
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
            
            <div class="column" on:dragenter={handleDragEnter} on:dragleave={handleDragLeave} on:dragover={handleDragOver} on:drop={handleDragDrop} id="{column.id}">
                <h2>{column.title}</h2>
                
                {#await column.cards then cards}
                {#each cards as card(card.id)}
                <Card bind:card={card} on:dragstart={handleDragStart} on:dragend={handleDragEnd} />
                {/each}
                {/await}
                
                <div class="addcard">
                    <sl-button variant="default" size="large" circle>
                        <i class="fa-solid fa-plus-large"></i>
                    </sl-button>
                </div>
                
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
    .row {
        /* 
        background: rgb(255,255,255);
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(248,248,248,1) 13%); 
        */
    }
    .column {
        min-width: 30rem;
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
