<script>
    import { pbStore } from "svelte-pocketbase";
    import { afterUpdate } from "svelte";
    
    export let board;
    
    let newSceneName = '';
    let updateTimer;
    
    function addScene() {
        const maxseq = board.scenes.reduce((prev, cur)=>{return Math.max(prev,cur.seq)}, 0) + 1;
        const sceneData = {
            "title": newSceneName,
            "seq": maxseq,
            "board": board.id
        }
        $pbStore.collection('scenes').create(sceneData).then(()=>{
            newSceneName = '';
        })
    }
    
    function updateScene() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(()=>{
            board.scenes.forEach((scene)=>{
                console.log("AFTER UPDATE", scene);
                $pbStore.collection('scenes').update(scene.id, scene);
            });
        }, 750);
    }
    
</script>


<table class="table does">
    <thead><tr>
        <th>Scene</th>
        <th>Add</th>
        <th>Edit</th>
        <th>Reveal</th>
        <th>Move</th>
        <th>Show Votes</th>
        <th>Vote</th>
        <th>Show Comments</th>
        <th>Comment</th>
    </tr></thead>
    <tbody>
        {#each board.scenes as scene}
        <tr>
            <td>{scene.title}</td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doAdd}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doEdit}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doReveal}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doMove}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doShowVotes}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doVote}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doShowComments}></td>
            <td><input type="checkbox" class="checkbox" on:click={updateScene} bind:checked={scene.doComment}></td>
        </tr>
        {/each}
        <tr>
            <td><input type="text" class="input" bind:value={newSceneName} on:keypress={(e)=>{if(e.key == 'Enter')addScene()}}></td>
            <td colspan="5">
                <button class="button is-small is-success is-light" on:click={addScene}>
                    <span class="icon is-small">
                        <i class="fas fa-plus"></i>
                    </span>
                    <span>Add</span>
                </button>
            </td>
        </tr>
    </tbody>
</table>
