<script>
    import { pbStore } from "svelte-pocketbase";
    import notify from "$utils/notify";
    
    export let board;
    
    let newColumnName = '';
    let showDecks = false;
    
    function addColumn() {
        if(newColumnName == '') {
            notify("Please specify a name for the new column.", "error");
            return;
        }
        
        const maxseq = board.columns.reduce((prev, cur)=>{return Math.max(prev,cur.seq)}, 0) + 1;
        const columnData = {
            "title": newColumnName,
            "seq": maxseq,
            "board": board.id
        }
        $pbStore.collection('columns').create(columnData).then(()=>{
            newColumnName = '';
        })
    }

    function updateColumn(column) {
        $pbStore.collection('columns').update(column.id, column);
    }
    
    function delColumn(id) {
        $pbStore.collection('columns').delete(id);
    }

    function addDeck() {
        showDecks = true
        notify('This feature is incomplete, but will eventually allow you to add a deck of pre-defined cards to the column, which will be useful for pulse check surveys.')
    }
</script>

<table class="table does">
    <thead><tr>
        <th>Column</th>
        <th>Description</th>
        <th>Display</th>
        <th>Decks</th>
        <th>Delete</th>
    </tr></thead>
    <tbody>
        {#each board.columns as column}
        <tr>
            <td>{column.title}</td>
            <td><input type="text" class="input" bind:value={column.description} on:change={updateColumn(column)}/></td>
            <td>
                <div class="select">
                    <select bind:value={column.display} on:change={updateColumn(column)}>
                        <option value="default">Default</option>
                        <option value="narrow">Narrow</option>
                    </select>
                </div>
            </td>
            <td>
                <button class="button is-small is-primary is-light" on:click={addDeck}>
                    <span class="icon is-small"><i class="fas fa-cards"></i></span>
                    <span>Add Deck</span>
                </button>
            </td>
            <td>
                <button class="button is-small is-danger is-light" on:click={()=>delColumn(column.id)}>
                    <span>Delete</span>
                    <span class="icon is-small">
                        <i class="fas fa-times"></i>
                    </span>
                </button>
            </td>
        </tr>
        {/each}
        <tr>
            <td colspan="4"><input type="text" class="input" bind:value={newColumnName} on:keypress={(e)=>{if(e.key == 'Enter')addColumn()}}></td>
            <td>
                <button class="button is-small is-success is-light" on:click={addColumn}>
                    <span class="icon is-small">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span>Add</span>
                </button>
            </td>
        </tr>
    </tbody>
</table>

<div class="modal" class:is-active={showDecks}>
    <div class="modal-background"></div>
    <div class="modal-content">
      <!-- Any other Bulma elements you want -->
    </div>
    <button class="modal-close is-large" aria-label="close" on:click={()=>showDecks = false}></button>
</div>

<style>
    .table thead {
        position: sticky;
        top: 0px;
        z-index: 100;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
    }
</style>