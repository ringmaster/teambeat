<script>
    import { pbStore } from "svelte-pocketbase";
    import TagsInput from "./TagsInput.svelte";
    
    export let board;
    
    let newSceneName = '';
    
    function addScene() {
        const maxseq = board.scenes.reduce((prev, cur)=>{return Math.max(prev,cur.seq)}, 0) + 1;
        const sceneData = {
            "title": newSceneName,
            "seq": maxseq,
            "board": board.id,
            "mode": "columns",
            "options": []
        }
        $pbStore.collection('scenes').create(sceneData).then(()=>{
            newSceneName = '';
        })
    }
    
    function updateScene(scene, items) {
        $pbStore.collection('scenes').update(scene.id, scene);
    }
    
</script>


<table class="table does">
    <thead><tr>
        <th>Scene</th>
        <th>Options</th>
        <th>Mode</th>
    </tr></thead>
    <tbody>
        {#each board.scenes as scene}
        <tr>
            <td>{scene.title}</td>
            <td>
                <TagsInput bind:value={scene.options} on:change={(items)=>updateScene(scene, items)}>
                    <option value="doAdd">Add</option>
                    <option value="doEdit">Edit</option>
                    <option value="doReveal">Reveal</option>
                    <option value="doMove">Move</option>
                    <option value="doGroup">Group</option>
                    <option value="doShowVotes">Show Votes</option>
                    <option value="doVote">Vote</option>
                    <option value="doShowComments">Show Comments</option>
                    <option value="doComment">Comment</option>
                    {#each board.columns as column}
                    <option value="hide:{column.id}">Hide {column.title}</option>
                    {/each}
                </TagsInput>
            </td>
            <td>
                <div class="select">
                    <select bind:value={scene.mode}>
                        <option value="columns">Columns</option>
                        <option value="present">Present</option>
                    </select>
                </div>
            </td>
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
