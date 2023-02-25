<script>
    import { pbStore } from "svelte-pocketbase";
    import Card from "./Card.svelte";
	import Drawer from "./Drawer.svelte";
    
    export let data;
    
    let status = '';
    let dropped_in = false;
    let drawer;
    
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
    
    function getBoard() {
        let boardData = $pbStore.collection('boards').getOne(data.params.boardid, {expand: "users,facilitators,scenes(board),columns(board)"});
        
        boardData.then((data) => {
            board = {
                name: data.name,
                columns: makeColumns(data.expand["columns(board)"]),
                scenes: data.expand["scenes(board)"]
            }
        })
    }
    
    function makeColumns(columnData) {
        columnData.map((item) => {
            item.cards = [];
            loadCards(item).then((cards) => {
                item.cards = cards;
                board = board;
            })
            return item;
        })
        return columnData;
    }
    
    async function loadCards(column) {
        let cardData = await $pbStore.collection('cards').getFullList(10, {
            sort: "+created",
            filter: 'column = "' + column.id + '"',
            expand: 'user,comments(card)',
            '$cancelKey': column.id // Wihtout this, the client cancels separate column requests as non-unique
        })
        return cardData;
    }
    
    function debugBoard() {
        console.log(board);
    }

    function configBoard() {
        drawer.show();
    }
    
    let board = {columns: [], scenes: []};
    getBoard();
    
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
        let oldColumnId = record.column;
        record.column = e.target.closest('.column').id;
        
        // Submit the updated data
        record = await $pbStore.collection('cards').update(element_id, record);
        
        // Reload the destination column
        for(let column of board.columns) {
            if(column.id == record.column || column.id == oldColumnId) {
                loadCards(column).then((cards) => {
                    column.cards = cards;
                    board = board;
                });
            }
        }
        
        // Reload the source column
    }
    
</script>

<svelte:head>
    <title>Teambeat - {board.name}</title>
</svelte:head>


{#await board}
<div class="container">
    <h1>Loading Board {data.params.boardid}</h1>
    <p>Loading...</p>
</div>
<div>Loading...</div>    
{:then board} 
<div class="container content">
    <h1>{board.name}</h1>
    <sl-breadcrumb class="breadcrumb">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <sl-breadcrumb-item on:click={configBoard}>Config</sl-breadcrumb-item>
        {#each board.scenes as scene}
        <sl-breadcrumb-item>{scene.title}</sl-breadcrumb-item>
        {/each}
    </sl-breadcrumb>
</div>
<div class="boardscroll">
    <div class="board">
        <div class="row columns">
            {#each board.columns as column}
            
            <div class="column content" on:dragenter={handleDragEnter} on:dragleave={handleDragLeave} on:dragover={handleDragOver} on:drop={handleDragDrop} id="{column.id}">
                <h2 class="subtitle">{column.title}</h2>
                
                <div class="addcard">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <sl-button variant="default" size="large" circle on:click={debugBoard}>
                        <i class="fa-solid fa-plus-large"></i>
                    </sl-button>
                </div>
                
                {#each column.cards as card(card.id)}
                <Card bind:card={card} on:dragstart={handleDragStart} on:dragend={handleDragEnd} />
                {/each}
                
                
            </div>
            
            {/each}
        </div>
    </div>
</div>

{/await}

<sl-drawer label="Config" placement="top" class="drawer-placement-top" bind:this={drawer}>
    This drawer will show 
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <sl-button slot="footer" variant="primary" on:click={()=>drawer.hide()}>Close</sl-button>
</sl-drawer>

<style lang="scss">
    .container {
        padding-bottom: 0;
    }
    .boardscroll {
        overflow-x:scroll;
        
    }
    .board {
        // margin: 0 calc((100% - 80rem)/2) 3rem;
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
    .breadcrumb::part(label) {
        font-size: var(--sl-font-size-xlarge);
    }
</style>
