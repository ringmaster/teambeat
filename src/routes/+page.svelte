<script>
    import { key } from '@milkdown/plugin-listener';
    import { goto } from '$app/navigation';
    import { pbStore } from 'svelte-pocketbase';
    
    $: loggedIn = $pbStore.authStore.isValid
    
    $: getboards = $pbStore.collection('boards').getFullList(10, {
        sort: '-created',
        expand: "users,facilitators"
    });
    
    $pbStore.collection('boards').subscribe("*", ()=>{
        getboards = $pbStore.collection('boards').getFullList(10, {
            sort: '-created',
            expand: "users,facilitators"
        });
    })
    
    let newmodal = false;
    let newBoardName = '';
    let badBoard = '';
    
    function createBoard(){
        if(newBoardName == '') {
            badBoard = "Please supply a name for the new board.";
            return;
        }
        const data = {
            "name": newBoardName,
            "users": [
            $pbStore.authStore.model.id
            ],
            "facilitators": [
            $pbStore.authStore.model.id
            ]
        };
        $pbStore.collection('boards').create(data).then((newboard)=>{
            let promises = [];
            const scenedatas = [
            {"board": newboard.id, "title": "collect", "current": true, "seq": 1, "doAdd": true, "doEdit": true, "doMove": true },
            {"board": newboard.id, "title": "group", "current": false, "seq": 2, "doAdd": false, "doEdit": false, "doMove": true, "doReveal": true },
            {"board": newboard.id, "title": "vote", "current": false, "seq": 3, "doAdd": false, "doEdit": false, "doMove": false, "doReveal": true, "doVote": true },
            ];
            scenedatas.forEach((scenedata)=>{
                promises.push($pbStore.collection('scenes').create(scenedata));
            });
            const votetypesdata = {
                "board": newboard.id,
                "typename": "votes",
                "amount": 0
            }
            promises.push($pbStore.collection('votetypes').create(votetypesdata));
            Promise.all(promises).then(()=>{
                goto( "/board/" + newboard.id );
            })
        })
    }
    
</script>

<svelte:head>
<title>Teambeat</title>
</svelte:head>

<div class="container content">
    
    <h1>Welcome to Teambeat</h1>
    
    <p>Teambeat is a tool for realtime retrospectives, surveys, and team pulse checks.</p>
    
    {#if loggedIn}
    <h2>Your Boards</h2>
    <table class="table is-fullwidth">
        <thead>
            <tr>
                <th>Board Name</th>
                <th>Facilitators</th>
                <th>Users</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            {#await getboards}
            <tr><td colspan="4"><div class="centered">Loading...</div></td></tr>
            {:then boards} 
            {#each boards as board}
            <tr>
                <td><a href="/board/{board.id}">{board.name}</a></td>
                <td>
                    {#each board.expand.facilitators as facilitator}
                    <div>{facilitator.name}</div>
                    {/each}
                </td>
                <td>
                    {#each board.expand.users as user}
                    <span class="has-tooltip-arrow" data-tooltip="{user.name}">
                        <i class="fa-solid fa-user"></i>
                    </span>
                    {/each}
                </td>
                <td>{board.created}</td>
            </tr>
            {/each}         
            {:catch error}
            <tr><td colspan="4" style="color: red">{error.message}</td></tr>       
            {/await}
        </tbody>
    </table>
    
    <div class="level">
        <div class="level-right">
            <buttom class="button" on:click={()=>newmodal=true}>New Board</buttom>
        </div>
    </div>
    
    <div class="modal" class:is-active={newmodal}>
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Create New Board</p>
            </header>
            <section class="modal-card-body">
                <form>
                    <div class="field">
                        <label class="label" for="boardname">Board Name</label>
                        <div class="control" class:has-icons-right={badBoard!=''}>
                            <input id="boardname" class:is-danger={badBoard!=''} class="input" type="text" placeholder="Board Name" bind:value={newBoardName} on:keypress={(e)=>{if(e.key=="Enter") createBoard()}}>
                            {#if badBoard != ''}
                            <span class="icon is-small is-right">
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                            {/if}
                        </div>
                        {#if badBoard != ''}
                        <p class="help is-danger">{badBoard}</p>
                        {/if}
                    </div>
                </form>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success" on:click={createBoard}>Create Board</button>
                <button class="button" on:click={()=>newmodal=false}>Cancel</button>
            </footer>
        </div>
    </div>
    {/if}
</div>


<style>
    .centered {
        text-align: center;
    }
</style>