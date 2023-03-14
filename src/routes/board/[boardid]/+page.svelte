<script>
    import { pbStore } from "svelte-pocketbase";
    import { votes } from "$stores/votes.js";
    import Columns from "./Columns.svelte";
    import Present from "./Present.svelte";
    import {onDestroy, tick} from "svelte"
    import { fly, fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import notify from "../../../utils/notify";
    
    import TimerDial from "./TimerDial.svelte";
    import Drawer from "./Drawer.svelte";
    
    export let data;
    
    $: user = $pbStore.authStore.model
    
    let showDrawer = false;
    let timer = false;
    let timerexpanded = false;
    let timeLimit = 0;
    let startedAt = 0;
    let startTimer;
    let stopTimer;
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
        goto("/share/" + data.boardid);
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
                scenes: processScenes(boardData.expand["scenes(board)"]),
                timerstart: boardData.timerstart,
                timerlength: boardData.timerlength,
                facilitators: boardData.facilitators,
                users: boardData.users,
                expandedusers: boardData.expand['users'],
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
            votes.setBoard(board.id);
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
            columnData.sort((a,b)=>a.seq-b.seq)
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
                    clearTimeout(item.updateTimeout);
                    item.updateTimeout = setTimeout(()=>{
                        item.update()
                    }, 100);
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
        showDrawer = true;
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
    
    function setScene(scene) {
        currentScene.current = false;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
        currentScene = scene;
        currentScene.current = true;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
    }
    
    function sceneSubUpdate(s) {
        if(s.record.board != board.id) return;
        $pbStore.collection('scenes').getFullList(200, {
            filter: `board="${currentScene.board}"`,
            sort: '+seq',
            '$autoCancel': false
        }).then(processScenes)
    }
    
    function processScenes(scenes){
        board.scenes = scenes.sort((a,b)=> a.seq - b.seq).map((scene)=>{
            scene.do = (flag) => scene.options.indexOf(flag) != -1;
            return scene;
        });
        currentScene = board.scenes.reduce((prev, cur) => {
            if(cur.current) {
                return cur
            }
            return prev
        }, board.scenes[0])
        return board.scenes;
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
        //notify(`Increased ${votetype.typename} amount to ${votetype.amount}.`, "info", 'info')
    }
    
    function shareLink() {
        if (!navigator.clipboard) {
            notify("Your browser does not support this feature.", "error");
            return;
        }
        navigator.clipboard.writeText(location.origin + "/share/" + board.id).then(function() {
            notify("Share link has been copied to the clipboard.", "info");
        }, function(err) {
            notify("There was a problem copying the share link to the clipboard.", "error");
        });
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
                {#if isFacilitator}
                <div class="dropdown is-hoverable">
                    <div class="dropdown-trigger">
                        <button class="button is-small is-white" aria-haspopup="true" aria-controls="dropdown-menu">
                            <span class="icon"><i class="fa-light fa-clapperboard"></i></span>
                            <span>{currentScene.title}</span>
                            <span class="icon is-small">
                                <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            {#each board.scenes as scene}
                            <a href="#" class="dropdown-item" on:click={()=>setScene(scene)} class:is-active={scene == currentScene}>
                                {scene.title}
                            </a>
                            {/each}
                        </div>
                    </div>
                </div>
                {/if}
            </div>
        </div>
        {#if currentScene.do("doVote")}
        <div class="level-item votesleft">
            <div>
            <span><b>Votes Left:</b></span>
            {#each board.votetypes as votetype}
            <span>
                {#if board.votetypes.length > 1}
                {votetype.typename} -    
                {/if}
                {votetype.amount - board.votecounts[votetype.typename]}
            </span>
            {/each}
            </div>
            {#if isFacilitator}
            <div>
            <span><b>Outstanding votes:</b> </span>
            {#each board.votetypes as votetype}
            {#if board.votetypes.length > 1}
            {votetype.typename} -    
            {/if}
            {(board.users.length * votetype.amount)}
            {/each}
            </div>
            {/if}
        </div>
        {/if}
        {#if isFacilitator}
        <div class="level-right is-flex is-justify-content-right is-align-content-center">
            <div class="field has-addons">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="control dropdown is-right" class:is-hoverable={currentScene.do("doVote")}>
                    <button class="button is-small is-rounded" disabled="{!currentScene.do("doVote")}">
                        <span class="icon is-small">
                            <i class="fak fa-vote"></i>
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
                                <div>Add {votetype.typename}
                                    {#if votetype.amount > 0}
                                    ({votetype.amount})
                                    {/if}
                                </div>
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
                    <button class="button is-small is-rounded" on:click={shareLink}>
                        <span class="icon is-small">
                            <i class="fa-light fa-share"></i>
                        </span>
                    </button>
                </div>                
                <div class="control">
                    <button class="button is-small is-rounded" on:click={configBoard}>
                        <span class="icon is-small">
                            <i class="fa-light fa-gear"></i>
                        </span>
                    </button>
                </div>                
            </div>
        </div>
        {/if}
    </div>
</div>

{#if currentScene.mode == 'present'}
<Present bind:board bind:currentScene />
{:else}
<Columns bind:board bind:currentScene />
{/if}

{/await}

<Drawer bind:board bind:visible={showDrawer} />

{#if timer}
<div class="timer" in:fly="{{ y: 200, duration: 500 }}" out:fly="{{ y: 200, duration: 500 }}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="timerbox" class:expanded={timerexpanded} >
        {#if timerexpanded}
        <div class="timerdetail" in:fade="{{delay: 1000}}" out:fade>
            <button class="button">
                Continue Discussion
            </button>
            <button class="button">
                Move On
            </button>
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
        border-radius: 30px;
        border: 1px solid gray;
        display: flex;
        justify-content: right;
        align-content: center;
        align-items: flex-end;
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
        min-height: 58px;
    }
    .dropdown-menu {
        z-index: 200;
    }
    .votesleft span {
        margin-right: 0.5rem;
    }
    .timerdetail .button {
        width: 95%;
        justify-content: left;
        margin: 3px 0px;
    }
</style>
