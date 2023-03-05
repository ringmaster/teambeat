<script>
    import Card from "./Card.svelte";
    import { pbStore } from "svelte-pocketbase";
    import boarddefaults from "./boarddefaults";
    
    
    export let board
    export let currentScene
    
    let selectedPreset;
    $: user = $pbStore.authStore.model
    
    let status = '';
    let dropped_in = false;
    
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
        
        // Load the initial card data
        let record = await $pbStore.collection('cards').getOne(element_id);
        
        // Update the column on the card
        let oldColumnId = record.column;
        record.column = e.target.closest('.column').id;
        
        // Submit the updated data
        record = await $pbStore.collection('cards').update(element_id, record);
    }
    
    function addCard(column) {
        const data = {
            "user": user.id,
            "type": "default",
            "description": "",
            "options": "{}",
            "column": column.id
        };
        
        $pbStore.collection('cards').create(data)
    }
    
    function addPreset() {
        let promises = []
        selectedPreset.columns.forEach((column)=>{
            column.board = board.id;
            promises.push($pbStore.collection('columns').create(column));
        })
        Promise.all(promises).then(()=>{})
    }
</script>

{#if board.columns.length > 0}
<div class="boardscroll">
    <div class="board">
        <div class="row columns">
            {#each board.columns as column}
            
            <div class="column cardcolumn content" on:dragenter={handleDragEnter} on:dragleave={handleDragLeave} on:dragover={handleDragOver} on:drop={handleDragDrop} id="{column.id}">
                <div class="columnheader level">
                    <div class="level-left">
                        <div class="level-item">
                            <h2 class="subtitle">{column.title}</h2>
                        </div>
                        {#if currentScene.doAdd}
                        <div class="level-item">
                            <div class="field has-addons">
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <button class="button is-small is-rounded" on:click={()=>addCard(column)}>
                                    <span class="icon is-small">
                                        <i class="fa-light fa-cards-blank"></i>
                                    </span>
                                    <span>Add Card</span>
                                </button>
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>
                
                {#each column.cards as card(card.id)}
                <Card bind:card={card} bind:scene={currentScene} bind:board={board} on:dragstart={handleDragStart} on:dragend={handleDragEnd} />
                {/each}
                
                
            </div>
            
            {/each}
        </div>
    </div>
</div>
{:else}
<div class="container">
    <div class="columns">
        <div class="column">
            <div class="notification is-info is-light">
                <div class="content">
                    <h2>This board has no columns</h2>
                    <p><b>Maybe this is intentional?</b> If not, you have two options:</p>
                    <ol>
                        <li>Configure the columns and scenes for this board manually using the <code>Configure</code> button, above.</li>
                        <li>Choose one of the preset board configurations to the right.</li>
                    </ol>
                </div>
            </div>
        </div>
        <div class="column">
            <div class="field">
                <label class="label" for="presetChooser">Choose a Preset</label>
                <div class="control">
                    <div class="select">
                        <select bind:value={selectedPreset} id="presetChooser">
                            {#each boarddefaults as preset}
                            <option value="{preset}">{preset.title}</option>
                            {/each}
                        </select>
                    </div>
                    <button class="button" on:click={addPreset}>Use Preset</button>
                </div>
            </div>
            <p>
                {selectedPreset?.description}
            </p>
        </div>
    </div>
</div>
{/if}


<style lang="scss">
    .boardscroll {
        overflow:scroll;
        height: calc(100vh - 124px)
    }
    .board {
        // margin: 0 calc((100% - 80rem)/2) 3rem;
        padding: 20px;
        min-height: 70vh;
    }
    .cardcolumn {
        min-width: 30rem;
    }
    :global(.column-over) {
        background-color: #eee;
    }
    :global(.novis) {
        opacity: 0.0;
    }
    .columnheader{
        position: sticky;
        z-index: 100;
        top: 0px;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
    }
</style>