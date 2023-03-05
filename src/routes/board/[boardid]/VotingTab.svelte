<script>
    import { pbStore } from "svelte-pocketbase";
    
    export let board;
    
    let newVoteType = '';
    
    function addVoteType() {
        const voteTypeData = {
            "typename": newVoteType,
            "amount": 0,
            "board": board.id
        }
        $pbStore.collection('votetypes').create(voteTypeData).then(()=>{
            //getBoard();
            newVoteType = '';
        })
    }
    
    function delVoteType(id) {
        $pbStore.collection('votetypes').delete(id).then(()=>{
            //getBoard();
        })
    }
    
</script>

<table class="table">
    <thead><tr>
        <th>Vote Type</th>
        <th>Available</th>
        <th>Color</th>
        <th>Icon</th>
        <th>Delete</th>
    </tr></thead>
    <tbody>
        {#each board.votetypes as votetype}
        <tr>
            <td>{votetype.typename}</td>
            <td>{votetype.amount}</td>
            <td>black</td>
            <td>default</td>
            <td>
                <button class="button is-small is-danger is-light" on:click={()=>delVoteType(votetype.id)} disabled={votetype.typename == 'votes'} class:is-disabled={votetype.typename == 'votes'}>
                    <span>Delete</span>
                    <span class="icon is-small">
                        <i class="fas fa-times"></i>
                    </span>
                </button>
            </td>
        </tr>
        {/each}
        <tr>
            <td><input type="text" class="input" bind:value={newVoteType} on:keypress={(e)=>{if(e.key == 'Enter')addVoteType()}}></td>
            <td colspan="5">
                <button class="button is-small is-success is-light" on:click={addVoteType}>
                    <span class="icon is-small">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span>Add</span>
                </button>
            </td>
        </tr>
    </tbody>
</table>