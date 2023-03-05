<script>
    import { pbStore } from "svelte-pocketbase";
    import Columns from "./Columns.svelte";
    import {onDestroy, tick} from "svelte"
    import { fly, fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import notify from "../../../utils/notify";
    
    import TimerDial from "./TimerDial.svelte";
    
    export let data;
    
    $: user = $pbStore.authStore.model
    
    let drawer;
    let timer = false;
    let timerexpanded = false;
    let timeLimit = 0;
    let startedAt = 0;
    let startTimer;
    let stopTimer;
    let confirmDelete = false;
    let newSceneName = '';
    let newColumnName = '';
    let newColumnVote = true;
    let newVoteType = '';
    let currentScene = {title: "", loaded: false};
    let audioFile = [new Audio("/alarmding2.mp3"), new Audio("/alarmding1.mp3")];
    let boardData;
    let board = {columns: [], scenes: [], facilitators: [], currentScene: {title: ''}, votetypes: [], votecounts: []};
    
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    $: totalCards = board?.columns?.reduce((prev, column)=>{return prev + column.cards.length}, 0)
    $: pureVoteCount = Math.ceil(Math.sqrt(totalCards))
    
    if($pbStore.authStore.isValid) {
        getBoard();
    } else {
        goto("/");
    }
    
    onDestroy(()=>{
        board.columns.forEach((column) => {
            column.disconnect();
        })
    })
    
    function getBoard() {
        if($pbStore.authStore.isValid) {
            boardData = $pbStore.collection('boards').getOne(data.boardid, {expand: "users,facilitators,scenes(board),columns(board),votetypes(board)"});
        }
        
        boardData.then((boardData) => {
            board = {
                id: boardData.id,
                name: boardData.name,
                columns: makeColumns(boardData.expand["columns(board)"]),
                scenes: boardData.expand["scenes(board)"].sort((a,b)=> a.seq - b.seq),
                timerstart: boardData.timerstart,
                timerlength: boardData.timerlength,
                facilitators: boardData.facilitators,
                users: boardData.users,
                votetypes: boardData.expand["votetypes(board)"],
                votecounts: {}
            }
            board.votecounts = getVoteCounts();
            
            currentScene = board.scenes.reduce((prev, cur) => {
                if(cur.current) {
                    return cur
                }
                return prev
            }, board.scenes[0])
            $pbStore.collection('scenes').subscribe('*', sceneSubUpdate);
            $pbStore.collection('votetypes').subscribe('*', votetypesSubUpdate);
            $pbStore.collection('columns').subscribe('*', columnsSubUpdate);
            checkTimer();
            
            $pbStore.collection('boards').subscribe(data.boardid, (b)=>{
                board.timerstart = b.record.timerstart;
                board.timerlength = b.record.timerlength;
                checkTimer();
            })
            
            $pbStore.collection('votes').subscribe('*', votesSubUpdate);
            votesSubUpdate({record: {user: $pbStore.authStore.model.id}});
        })
    }
    
    function updateSceneDos(e) {
        board.scenes.forEach((scene)=>{
            console.log(scene);
            $pbStore.collection('scenes').update(scene.id, scene);
        });
    }
    
    function checkTimer() {
        if(board.timerlength != 0) {
            if((board.timerstart + board.timerlength * 1000) > Date.now()) {
                timeLimit = board.timerlength;
                startedAt = board.timerstart;
                timer = true;
                tick().then(() => startTimer());
            }
        } else {
            timer = false;
        }
    }
    
    function makeColumns(columnData) {
        if(columnData != undefined) {
            columnData.map((item) => {
                item.cards = [];
                item.update = function(){
                    loadCards(item).then((cards) => {
                        item.cards = cards;
                        board = board;
                    })
                }
                item.disconnect = function(){
                    $pbStore.collection('cards').unsubscribe();
                }
                $pbStore.collection('cards').subscribe('*', function (e) {
                    item.update();
                });
                item.update();
                return item;
            })
        } else {
            columnData = [];
        }
        return columnData;
    }
    
    async function loadCards(column) {
        let cardData = await $pbStore.collection('cards').getFullList(10, {
            sort: "-created",
            filter: 'column = "' + column.id + '"',
            expand: 'user,comments(card),votes(card)',
            '$cancelKey': column.id // Wihtout this, the client cancels separate column requests as non-unique
        })
        return cardData;
    }
    
    function configBoard() {
        drawer.show();
    }
    
    
    function extendTimer(sec) {
        let newstart = 0, newlength = 0;
        // If the timer has expired
        if(board.timerstart + board.timerlength * 1000 < Date.now()) {
            newstart = Date.now();
            newlength = sec;
        } else {
            newstart = board.timerstart;
            newlength = board.timerlength + sec;
        }
        let boardData = {
            "name": board.name,
            "users": board.users,
            "facilitators": board.facilitators,
            "timerstart": newstart,
            "timerlength": newlength
        };
        $pbStore.collection("boards").update(data.boardid, boardData)
    }
    
    function endTimer() {
        let boardData = {
            "name": board.name,
            "users": board.users,
            "facilitators": board.facilitators,
            "timerstart": 0,
            "timerlength": 0
        };
        $pbStore.collection("boards").update(data.boardid, boardData)
        if(typeof stopTimer == 'function') stopTimer();
        timer = false;
    }
    
    function doTimerClick() {
        timerexpanded = !timerexpanded
    }
    
    function deleteBoard(){
        if(confirmDelete) {
            $pbStore.collection('boards').delete(data.boardid).then(()=>{
                goto("/");
            })
        } else {
            notify("Check the box to confirm the deletion of this board.", "warning", "exclamation-triangle")
        }
    }
    
    function addColumn() {
        const maxseq = board.columns.reduce((prev, cur)=>{return Math.max(prev,cur.seq)}, 0) + 1;
        const columnData = {
            "title": newColumnName,
            "seq": maxseq,
            "board": data.boardid
        }
        $pbStore.collection('columns').create(columnData).then(()=>{
            getBoard();
            newColumnName = '';
        })
    }    
    
    function addScene() {
        const maxseq = board.scenes.reduce((prev, cur)=>{return Math.max(prev,cur.seq)}, 0) + 1;
        const sceneData = {
            "title": newSceneName,
            "seq": maxseq,
            "board": data.boardid
        }
        $pbStore.collection('scenes').create(sceneData).then(()=>{
            getBoard();
            newSceneName = '';
        })
    }
    
    function addVoteType() {
        const voteTypeData = {
            "typename": newVoteType,
            "amount": 0,
            "board": data.boardid
        }
        $pbStore.collection('votetypes').create(voteTypeData).then(()=>{
            getBoard();
            newVoteType = '';
        })
    }
    
    function delVoteType(id) {
        $pbStore.collection('votetypes').delete(id).then(()=>{
            getBoard();
        })
    }
    
    function setScene(scene) {
        currentScene.current = false;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
        currentScene = scene;
        currentScene.current = true;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
    }

    function sceneSubUpdate(s) {
        if(s.board != board.id) return;
        //currentScene = {...currentScene, ...s.record};
        $pbStore.collection('scenes').getFullList(200, {
            filter: `board="${currentScene.board}"`,
            sort: '+seq',
            '$autoCancel': false
        }).then((scenes)=>{
            board.scenes = scenes;
            currentScene = board.scenes.reduce((prev, cur) => {
                if(cur.current) {
                    return cur
                }
                return prev
            }, board.scenes[0])
        })
    }
    
    function votetypesSubUpdate(votetype) {
        if(votetype.record.board != data.boardid) return;
        $pbStore.collection('votetypes').getFullList(200, {
            filter: `board = "${data.boardid}"`
        }).then((votetypes)=>{
            board.votetypes = votetypes;
        })
    }

    function columnsSubUpdate(column) {
        if(column.record.board != data.boardid) return;
        $pbStore.collection('columns').getFullList(200, {filter: `board = "${data.boardid}"`, sort: "+seq"}).then((columnData)=>{
            board.columns = makeColumns(columnData)
        })
    }
    
    function getVoteCounts() {
        let votes = {}
        board.votetypes.forEach((votetype)=>{
            votes[votetype.typename] = 0;
        })
        return votes;
    }
    
    function votesSubUpdate(vote) {
        if(vote.record.user != $pbStore.authStore.model.id) return;
        $pbStore.collection('votes').getFullList(200, {
            filter: `card.column.board = "${data.boardid}" && user = "${$pbStore.authStore.model.id}"`,
            expand: "votetype"
        }).then((myVotes) => {
            let votes = getVoteCounts();
            myVotes.forEach((vote)=>{
                if(vote.expand.votetype != undefined) {
                    votes[vote.expand.votetype.typename]++;
                }
            })
            board.votecounts = votes;
        })
    }
    
    function delColumn(id) {
        $pbStore.collection('columns').delete(id).then(()=>{
            getBoard();
        })
    }
    
    function alarm(e) {
        if(e.detail.length < 60) {
            audioFile[0].play();
        }
        else {
            audioFile[1].play();
        }
    }
    
    function clearVotes() {
        $pbStore.collection('votetypes').getFullList('200', {filter: `board="${data.boardid}"`}).then((votetypes)=>{
            votetypes.forEach((votetype)=>{
                votetype.amount = 0;
                $pbStore.collection('votetypes').update(votetype.id, votetype);
            })
        })
        $pbStore.collection('votes').getFullList('1000', {filter: `card.column.board="${data.boardid}"`}).then((votes)=>{
            votes.forEach((vote) => {
                $pbStore.collection('votes').delete(vote.id);
            })
        })
    }
    
    function addVotes(votetype, amount) {
        votetype.amount += amount;
        $pbStore.collection('votetypes').update(votetype.id, votetype);
        notify(`Increased ${votetype.typename} amount to ${votetype.amount}.`, "info", 'info')
    }
    
</script>

<svelte:head>
<title>Teambeat - {board.name}</title>
</svelte:head>


{#await boardData}
<div class="container">
    <h1>Loading Board {data.boardid}</h1>
    <p>Loading...</p>
</div>
<div>Loading...</div>
{:then foo} 
<div class="container content">
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <h1 class="title">{board.name}</h1>
            </div>
            {#if isFacilitator}
            <div class="level-item">
                <div class="dropdown is-hoverable">
                    <div class="dropdown-trigger">
                        <button class="button is-small is-white" aria-haspopup="true" aria-controls="dropdown-menu">
                            <span>{currentScene.title}</span>
                            <span class="icon is-small">
                                <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            {#each board.scenes as scene}
                            <a href="#" class="dropdown-item" on:click={()=>setScene(scene)}>
                                {scene.title}
                            </a>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
            {/if}
            <div class="level-item">
                {board.votecounts.vote}
            </div>
        </div>
        {#if isFacilitator}
        <div class="level-right is-flex is-justify-content-right is-align-content-center">
            <div class="field has-addons">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="control dropdown is-hoverable is-right">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-regular fa-ballot-check"></i>
                        </span>
                        <span>Votes</span>
                        <span class="icon is-small">
                            <i class="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                    </button>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            {#each board.votetypes as votetype}
                            <div class="dropdown-item">
                                <div>Add {votetype.typename}</div>
                                <div>
                                    <button class="button is-small is-white" on:click={()=>addVotes(votetype, 1)}>+1</button>
                                    <button class="button is-small is-white" on:click={()=>addVotes(votetype, 5)}>+5</button>
                                    <button class="button is-small is-white" on:click={()=>addVotes(votetype, pureVoteCount)}>+{pureVoteCount}</button>
                                </div>
                            </div>
                            {/each}
                            <hr class="dropdown-divider">
                            <a href="#" class="dropdown-item" on:click={clearVotes}>
                                Clear votes
                            </a>
                        </div>
                    </div>
                </div>
                <div class="control dropdown is-hoverable is-right">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-light fa-timer"></i>
                        </span>
                        <span>Timer</span>
                        <span class="icon is-small">
                            <i class="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                    </button>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(3)}>
                                + 0:03
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(30)}>
                                + 0:30
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(60)}>
                                + 1:00
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(300)}>
                                + 5:00
                            </a>
                            <hr class="dropdown-divider">
                            <a href="#" class="dropdown-item" on:click={endTimer}>
                                Stop Timer
                            </a>
                        </div>
                    </div>
                </div>
                <div class="control">
                    <button class="button is-small is-rounded" on:click={configBoard}>
                        <span class="icon is-small">
                            <i class="fa-light fa-square-kanban"></i>
                        </span>
                        <span>Configure</span>
                    </button>
                </div>                
            </div>
        </div>
        {/if}
    </div>
</div>


<Columns bind:board bind:currentScene />

{/await}

<sl-drawer placement="top" class="drawer-placement-top" bind:this={drawer} on:sl-request-close={updateSceneDos}>
    <div slot="label"><h1 class="title"><i class="fa-light fa-square-kanban"></i> Configure Board</h1></div>
    
    <sl-tab-group>
        <sl-tab slot="nav" panel="columns">Columns</sl-tab>
        <sl-tab slot="nav" panel="scenes">Scenes</sl-tab>
        <sl-tab slot="nav" panel="voting">Voting</sl-tab>
        <sl-tab slot="nav" panel="general">General</sl-tab>
        
        <sl-tab-panel name="general">
            <div class="content">
                <h3 class="subtitle">Other things that should be here...</h3>
                <ul>
                    <li>List of facilitators</li>
                    <li>Users active on this board?</li>
                </ul>
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-link is-light" on:click={deleteBoard}>
                        <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDelete} on:click={(e)=>e.stopPropagation()}></span>
                        <span>Delete Board</span>
                    </button>
                </div>
            </div>
        </sl-tab-panel>
        <sl-tab-panel name="columns">
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
        </sl-tab-panel>
        <sl-tab-panel name="scenes">
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
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doAdd}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doEdit}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doReveal}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doMove}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doShowVotes}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doVote}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doShowComments}></td>
                        <td><input type="checkbox" class="checkbox" bind:checked={scene.doComment}></td>
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
        </sl-tab-panel>
        <sl-tab-panel name="voting">
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
        </sl-tab-panel>
    </sl-tab-group>
    
</sl-drawer>


{#if timer}
<div class="timer" in:fly="{{ y: 200, duration: 500 }}" out:fly="{{ y: 200, duration: 500 }}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="timerbox" class:expanded={timerexpanded} >
        {#if timerexpanded}
        <div class="timerdetail" in:fade="{{delay: 1000}}" out:fade>
            Mysterious flyout!
        </div>
        {/if}
        
        <TimerDial on:click={doTimerClick} on:timeup={alarm} bind:timeLimit bind:startedAt bind:start={startTimer} bind:stop={stopTimer}/>
    </div>
</div>
{/if}

<style lang="scss">
    .container {
        padding-bottom: 0;
    }
    
    .timer {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
    }
    .timer .timerbox {
        width: 60px;
        height: 60px;
        border-radius: 30px;
        border: 1px solid gray;
        display: flex;
        justify-content: right;
        align-content: center;
        flex-wrap: nowrap;
        background-color: #fff;
        transition: width 200ms 400ms;
        box-shadow: 3px 3px 3px #ccc;
    }
    .timer .timerbox.expanded {
        width: 300px;
    }
    .timerdetail {
        margin-left: 30px;
        width: 210px;
    }
    table.does th {
        text-orientation: sideways;
        writing-mode: vertical-rl;
        padding: 0.25rem !important;
        
    }
    .dropdown-menu {
        z-index: 200;
    }
</style>
