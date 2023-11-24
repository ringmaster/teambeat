<script>
    import { goto } from '$app/navigation';
    import { redirect } from '@sveltejs/kit'
    import { pbStore } from 'svelte-pocketbase';
    import { onMount } from 'svelte';
    import moment from 'moment'
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
            {"board": newboard.id, "title": "collect", "current": true, "seq": 1, options: ["doAdd", "doEdit", "doMove", "doHidden"], mode: "columns" },
            {"board": newboard.id, "title": "group", "current": false, "seq": 2, options: ["doMove"], mode: "columns" },
            {"board": newboard.id, "title": "vote", "current": false, "seq": 3, options: ["doVote"], mode: "columns" },
            {"board": newboard.id, "title": "discuss", "current": false, "seq": 4, options: ["doShowVotes", "doComment", "doShowComments"], mode: "present" },
            {"board": newboard.id, "title": "review", "current": false, "seq": 5, options: [], mode: "review" },
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
        let x = err
        while(Object.hasOwn(x, 'data')) x = x.data
        Object.keys(x).forEach((key)=>{
            output += "\n" + `${key}: ${x[key].message}`;
        })
        return output;
    }
    
    function createUser(userdata) {
        loading = true;
        
        $pbStore.collection('users').create(userdata).then((user)=>{
            $pbStore.authStore.clear();
            $pbStore.collection('users').authWithPassword(user.username, userdata.password).then((user)=>{
                document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false });
                $pbStore.authStore.isValid
                loggedIn = true
            }).catch((err)=>{
                loading = false;
                console.log("Auth fail", err)
                notify("There was a problem authenticating the user record." + collapseErrData(err), "error");
            })
        }).catch((err)=>{
            loading = false;
            console.log("Create fail", err)
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
    
    {#key loggedIn}
    {#if $pbStore.authStore.isValid}
    <div class="columns">
        <div class="column is-three-fifths">
            <h2 class="title">Your Boards</h2>
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
                        <td>{moment(board.created).fromNow()}</td>
                    </tr>
                    {/each}         
                </tbody>
            </table>
            
            <form>
                <div class="field has-addons">
                    <div class="control is-expanded" class:has-icons-right={badBoard!=''}>
                        <input id="boardname" class:is-danger={badBoard!=''} class="input" type="text" placeholder="Board Name" bind:value={newBoardName}>
                        {#if badBoard != ''}
                        <span class="icon is-small is-right">
                            <i class="fas fa-exclamation-triangle"></i>
                        </span>
                        {/if}
                    </div>
                    
                    <div class="control">
                        <button class="button is-success" on:click={createBoard}>Create Board</button>
                    </div>
                </div>
                {#if badBoard != ''}
                <p class="help is-danger">{badBoard}</p>
                {/if}
            </form>
        </div>
        <!--div class="column is-two-fifths">
            <h2 class="title">Groups</h2>
            
            <div class="level">
                <div class="level-right">
                    <buttom class="button" on:click={()=>newmodal=true}>New Group</buttom>
                </div>
            </div>    
        </div-->
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