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
    let providerCall = $pbStore.collection('users').listAuthMethods();
    let password;
    
    const redirectUrl = location.protocol + '//' + location.host + "/redirect"
    
    debugger
    if($pbStore.authStore.isValid) {
        $pbStore.collection('boards').getFirstListItem(`id = "${data.boardid}"`).then((board)=>{
            if(board.users.indexOf($pbStore.authStore.model.id) == -1) {
                board.users.push($pbStore.authStore.model.id);
                $pbStore.collection('Boards').update(board.id, board).then(()=>{
                    goto(`/board/${data.boardid}`);
                })
            }
            else {
                goto(`/board/${data.boardid}`);
            }
        })
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
        
        $pbStore.collection("boards").getOne(data.boardid).then((board)=>{
            $pbStore.collection('users').create(userdata).then((user)=>{
                $pbStore.collection('users').authWithPassword(user.username, userdata.password).then((user)=>{
                    document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false });
                    // associate anonymous user with board!
                    board.users.push(user.record.id);
                    $pbStore.collection("boards").update(board.id, board).then(()=>{
                        goto("/board/" + data.boardid);
                    }).catch((err)=>{
                        loading = false;
                        notify("There was a problem adding your user to the board." + collapseErrData(err), "error");
                    })
                }).catch((err)=>{
                    loading = false;
                    notify("There was a problem authenticating the user record." + collapseErrData(err), "error");
                })
            }).catch((err)=>{
                loading = false;
                notify("There was a problem creating the user record." + collapseErrData(err), "error");
            })
        }).catch((err)=>{
            loading = false;
            notify("There was a problem fetching the requested board." + collapseErrData(err), "error");
        })
        
    }
    
    function setProvider(provider) {
        localStorage.setItem('provider', JSON.stringify(provider));
    }
    
    async function doLogin() {
        loading = true;
        $pbStore.collection('boards').getOne(data.boardid).then((board)=>{
            $pbStore.collection('users').authWithPassword(useremail, password).then((authData)=>{
                document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false })
                
                if(board.users.indexOf($pbStore.authStore.model.id) == -1) {
                    board.users.push($pbStore.authStore.model.id);
                    $pbStore.collection('Boards').update(board.id, board).then(()=>{
                        goto(`/board/${data.boardid}`);
                    })
                }
                else {
                    goto(`/board/${data.boardid}`);
                }
            }).catch((error)=>{
                notify("There was a problem authenticating.  Please check your credentials and try again.", "error", "error");
                loading = false;
            })
        }).catch(()=>{
            notify("This board doesn't actually exist.", "error");
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
            
            <div class="notification is-info is-light">
                <h2 class="subtitle">Log In With An Existing Account</h2>
                <form on:submit={doLogin}>
                    
                    <div class="field">
                        <label for="username" class="label">Email</label>
                        <div class="control">
                            <input type="text" class="input" placeholder="email" id="email" bind:value="{useremail}">
                        </div>
                    </div>
                    
                    <div class="field">
                        <label class="label" for="password2">Password</label>
                        <div class="control">
                            <input class="input" type="password" placeholder="password" id="password2" bind:value="{password}">
                        </div>
                    </div>
                    
                    <div class="field is-grouped">
                        <div class="control">
                            <input class="button is-primary" type="submit" value="Log In" class:is-loading="{loading}">
                        </div>
                    </div>
                </form>
                
            </div>
            {#await providerCall}
            <div class="notification is-info is-light">
                <p>Loading available providers...</p>
            </div>
            {:then authMethods} 
            {#if authMethods.length > 0}
            <div class="notification is-info is-light">
                
                <h2 class="subtitle">3rd Party Logins</h2>
                <p>You may also use one of the following providers to log in:</p>
                
                <ul>
                    {#each authMethods.authProviders as provider}
                    <li><a href="{provider.authUrl + redirectUrl}" on:click="{()=>setProvider(provider)}">{provider.name}</a></li>
                    {/each}
                </ul>    
            </div>
            {/if}
            {/await}
            
        </div>
    </div>
    <div class="notification is-info is-light">
        <button class="button" on:click={goAnon} class:is-loading={loading} disabled={loading}>Continue without logging in.</button>  <br/>
        <i>You will lose access to edit your data if your session ends.</i>
    </div>
</div>
