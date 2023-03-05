<script>
    import { pbStore } from "svelte-pocketbase";

    export let board;

    let newColumnName = '';
    let newColumnVote = false;

    function addColumn() {
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

    function delColumn(id) {
        $pbStore.collection('columns').delete(id);
    }
</script>

<table class="table does">
    <thead><tr>
        <th>Column</th>
        <th>Vote</th>
        <th>Delete</th>
    </tr></thead>
    <tbody>
        {#each board.columns as column}
        <tr>
            <td>{column.title}</td>
            <td><input type="checkbox" class="checkbox"></td>
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
            <td><input type="text" class="input" bind:value={newColumnName} on:keypress={(e)=>{if(e.key == 'Enter')addColumn()}}></td>
            <td><input type="checkbox" class="checkbox" bind:checked={newColumnVote}></td>
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