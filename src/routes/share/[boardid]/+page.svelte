<script>
    import { pbStore } from 'svelte-pocketbase';
    import { v4 } from 'uuid';
    import randomAnimal from "./randomanimal";
    import { goto } from '$app/navigation';
    import notify from '../../../utils/notify';
    
    export let data;

    let loading = false;

    if($pbStore.authStore.isValid) {
        goto(`/board/${data.boardid}`);
    }
    
    function goAnon() {
        loading = true;
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
        
        $pbStore.collection('users').create(userdata).then((user)=>{
            $pbStore.collection('users').authWithPassword(user.username, password).then(()=>{
                document.cookie = $pbStore.authStore.exportToCookie({ httpOnly: false, secure: false });
                goto("/board/" + data.boardid);
            }).catch(()=>{
                loading = false;
                notify("There was a problem authenticating the anonymous user record.", "error");
            })
        }).catch(()=>{
            loading = false;
            notify("There was a problem creating the anonymous user record.", "error");
        })
    }
    
</script>


<div class="container">
    <div class="columns">
        <div class="column">
            <div class="notification is-info is-light">
                <div class="content">
                    <h2>This board is active</h2>
                    <p><b>But you are not logged in!</b> You have two options:</p>
                    <ol>
                        <li>Log in using the form to the right, and your account will be associated with this board.</li>
                        <li>
                            <button class="button" on:click={goAnon} class:is-loading={loading} disabled={loading}>Continue without logging in.</button>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
        <div class="column">
        </div>
    </div>
</div>
