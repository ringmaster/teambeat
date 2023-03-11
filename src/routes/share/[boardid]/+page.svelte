<script>
    import { pbStore } from 'svelte-pocketbase';
    import { v4 } from 'uuid';
    import randomAnimal from "./randomanimal";
    import { goto } from '$app/navigation';
    import notify from '../../../utils/notify';
    
    export let data;
    
    let loading = false;
    
    let username = "";
    let userpassword = "";
    let useremail = "";
    
    if($pbStore.authStore.isValid) {
        goto(`/board/${data.boardid}`);
    }
    
    function goAnon() {
        const password = v4();
        const name = randomAnimal();
        // example create data
        const userdata = {
            "email": "",
            "emailVisibility": false,
            "password": password,
            "passwordConfirm": password,
            "name": name,
            "anonymous": true,
        };
        
        createUser(userdata);
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
    
    function createUser(userdata) {
        loading = true;
        
        $pbStore.collection("boards").getFirstListItem(`id = "${data.boardid}"`).then((board)=>{
            $pbStore.collection('users').create(userdata).then((user)=>{
                $pbStore.collection('users').authWithPassword(user.username, password).then((user)=>{
                    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false });
                    // associate anonymous user with board!
                    board.users.push(user.record.id);
                    $pbStore.collection("boards").update(board.id, board).then(()=>{
                        goto("/board/" + data.boardid);
                    }).catch(()=>{
                        loading = false;
                        notify("There was a problem adding your user to the board.", "error");
                    })
                }).catch(()=>{
                    loading = false;
                    notify("There was a problem authenticating the user record.", "error");
                })
            }).catch(()=>{
                loading = false;
                notify("There was a problem creating the user record.", "error");
            })
        }).catch(()=>{
            loading = false;
            notify("There was a problem fetching the requested board.", "error");
        })
        
    }
    
</script>


<div class="container">
    <div class="notification is-info is-light">
        <div class="content">
            <h2>This board is active</h2>
            <p><b>But you are not logged in!</b> You have these options:</p>
        </div>
    </div>
    
    <div class="columns">
        <div class="column">
            <div class="notification is-info is-light">
                <div class="content">
                    <p>Provide personal info to associate a new account with this board:</p>
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
                                <label class="label" for="password">Password</label>
                                <div class="control">
                                    <input class="input" type="password" placeholder="password" id="password" bind:value="{userpassword}">
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
        </div>
        <div class="column">
            <button class="button" on:click={goAnon} class:is-loading={loading} disabled={loading}>Continue without logging in.</button>  <br/>
            <i>You will lose access to edit your data if your session ends.</i>
        </div>
    </div>
</div>
