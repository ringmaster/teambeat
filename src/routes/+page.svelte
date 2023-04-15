<script>
    import { goto } from '$app/navigation';
    import { pbStore } from 'svelte-pocketbase';
    import { onMount } from 'svelte';
    import notify from '../utils/notify';
    
    $: loggedIn = $pbStore.authStore.isValid
    
    $: user = $pbStore.authStore.model
    
    let boards = [];
    
    let username, useremail, userpassword;
    let loading = false;
    
    function getBoards() {
        $pbStore.collection('boards').getFullList(10, {
            filter: `users.id ?= "${user?.id}" || facilitators.id ?= "${user?.id}"`,
            sort: '-created',
            expand: "users,facilitators"
        }).then((result)=>{
            boards = result;
        })
    }
    
    onMount(()=>{
        $pbStore.collection('boards').subscribe("*", getBoards);
        getBoards();
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
            {"board": newboard.id, "title": "collect", "current": true, "seq": 1, options: ["doAdd", "doEdit", "doMove"], mode: "columns" },
            {"board": newboard.id, "title": "group", "current": false, "seq": 2, options: ["doMove", "doReveal"], mode: "columns" },
            {"board": newboard.id, "title": "vote", "current": false, "seq": 3, options: ["doReveal", "doVote"], mode: "columns" },
            {"board": newboard.id, "title": "discuss", "current": false, "seq": 4, options: ["doReveal", "doShowVotes", "doComment", "doShowComments"], mode: "present" },
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
    
    function newUser() {
        const userdata = {
            "email": useremail,
            "emailVisibility": false,
            "password": userpassword,
            "passwordConfirm": userpassword,
            "name": username,
            "anonymous": false,
        };
        
        createUser(userdata);
    }
    
    
    function collapseErrData(err) {
        let output = '';
        Object.keys(err.data.data).forEach((key)=>{
            output += "\n" + `${key}: ${err.data.data[key].message}`;
        })
        return output;
    }
    
    function createUser(userdata) {
        loading = true;
        
        $pbStore.collection('users').create(userdata).then((user)=>{
            $pbStore.authStore.clear();
            $pbStore.collection('users').authWithPassword(user.username, userdata.password).then((user)=>{
                document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false });
                goto('/');
            }).catch((err)=>{
                loading = false;
                notify("There was a problem authenticating the user record." + collapseErrData(err), "error");
            })
        }).catch((err)=>{
            loading = false;
            notify("There was a problem creating the user record." + collapseErrData(err), "error");
        })
    }
    
    
    
</script>

<svelte:head>
<title>Teambeat</title>
</svelte:head>

<div class="container content">
    
    <h1>Welcome to Teambeat</h1>
    
    <p>Teambeat is a tool for realtime retrospectives, surveys, and team pulse checks.</p>
    
    {#key loading}
    {#if $pbStore.authStore.isValid}
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
                    {#if user.anonymous}
                    <span class="has-tooltip-arrow" data-tooltip="Anonymous: {user.name}">
                        <i class="fa-regular fa-user-secret"></i>
                    </span>
                    {:else}
                    <span class="has-tooltip-arrow" data-tooltip="{user.name}">
                        <i class="fa-solid fa-user"></i>
                    </span>
                    {/if}
                    {/each}
                </td>
                <td>{board.created}</td>
            </tr>
            {/each}         
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
    {:else}
    <div class="columns">
        <div class="column">
            <div class="notification is-info is-light">
                <h2 class="subtitle">Create A New Account</h2>
                <div class="cardz">
                    <form on:submit="{newUser}">
                        <div class="field">
                            <label class="label" for="name">Name</label>
                            <div class="control">
                                <input class="input" type="text" placeholder="name" id="name" bind:value="{username}">
                            </div>
                        </div>
                        
                        <div class="field">
                            <label class="label" for="email">Email</label>
                            <div class="control">
                                <input class="input" type="text" placeholder="name" id="email" bind:value="{useremail}">
                            </div>
                        </div>
                        
                        <div class="field">
                            <label class="label" for="password1">Password</label>
                            <div class="control">
                                <input class="input" type="password" placeholder="password" id="password1" bind:value="{userpassword}">
                            </div>
                        </div>
                        
                        <div class="field is-grouped">
                            <div class="control">
                                <input class="button is-primary" class:is-loading={loading} type="submit" value="Create Account">
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
        </div>
        <div class="column">
            <div class="notice">
            </div>
        </div>
    </div>
    {/if}
    {/key}
</div>


<style>
    
</style>