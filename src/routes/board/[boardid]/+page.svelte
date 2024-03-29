<script>
    import { Record, pbStore } from "svelte-pocketbase";
    import { votes } from "$stores/votes.js";
    import Columns from "./Columns.svelte";
    import Present from "./Present.svelte";
    import Review from "./Review.svelte";
    import {onDestroy, tick, onMount} from "svelte"
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
    let presenceInterval;
    let presenceId = null;
    let audioFile = [new Audio("/alarmding2.mp3"), new Audio("/alarmding1.mp3")];
    let boardData = false;
    let loaded = false;
    const votesDefault = {show: false, choices: {}, auto: false, didauto: false}
    let board = {columns: [], scenes: [], facilitators: [], currentScene: {title: ''}, votetypes: [], votecounts: [], votes: votesDefault, anonymous: false};
    let cardsRemaining;
    
    function showColumn(columnId) {
        const soloed = currentScene.options.reduce( (reduced, flag) => /^solo:(\S+)/.test(flag) ? flag.match(/^solo:(\S+)/)[1] : reduced, false)
        if(soloed) {
            return columnId == soloed
        }
        return !currentScene.do(`hide:${columnId}`)
    }
    
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    $: totalCards = board?.columns?.reduce((prev, column)=>{return prev + (showColumn(column.id) ? column.cards.length : 0)}, 0)
    $: pureVoteCount = Math.ceil(Math.sqrt(totalCards))
    
    onDestroy(()=>{
        board.columns.forEach((column) => {
            column.disconnect();
        });
        if(presenceId != null) {
            $pbStore.collection('presence').delete(presenceId);
            presenceId = null;
        }
        clearInterval(presenceInterval);
    })
    
    onMount(()=>{
        presenceInterval = setInterval(doPresence, 12345)
        doPresence();
        
        if($pbStore.authStore.isValid) {
            getBoard();
        } else {
            goto("/share/" + data.boardid);
        }
    })
    
    function doPresence() {
        if(!board.id) {
            setTimeout(doPresence, 100);
            return
        }
        let presence = {
            user: user.id,
            board: board.id,
            recently: Date.now()
        }
        $pbStore.collection('presence').getFirstListItem(`board = "${presence.board}" && user = "${presence.user}"`).then((result)=>{
            presenceId = result.id
            $pbStore.collection('presence').update(presenceId, presence).then((result)=>{
                presenceId = result.id
            }).catch((err)=>{
                console.log('PRESENCE ERROR', err)
            })
        }).catch((err) => {
            $pbStore.collection('presence').create(presence).then((result)=> {
                presenceId = result.id;
            }).catch((err)=>{
                console.log('PRESENCE CREATION ERROR', err)
            })
        })
    }
    
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
                votecounts: {},
                votes: {...votesDefault, ...(typeof boardData.votes !== 'undefined') ? boardData.votes : {}},
                anonymous: boardData.anonymous
            }
            board.votecounts = getVoteCounts();
            board.voteStatus = {};
            
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
                console.log('BOARD SUB')
                if(b.action == 'delete') {
                    loaded = false;
                    go('/')
                }
                else {
                    board.timerstart = b.record.timerstart;
                    board.timerlength = b.record.timerlength;
                    board.votes = {...votesDefault, ...b.record.votes};
                    checkTimer();
                }
            })
            
            $pbStore.collection('votes').subscribe('*', votesSubUpdate);
            votesSubUpdate();
            loaded = true;
        }).catch((e)=>{
            notify('Teambeat was not able to load that board.  Please click "Boards" in the main menu to return to the list of boards that are available to you.', 'error', 'error')
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
                    loadColumnCards(item).then((cards) => {
                        item.cards = cards;
                        board = board;
                    })
                }
                item.disconnect = function(){
                    $pbStore.collection('cards').unsubscribe();
                }
                item.debounceUpdate = function(){
                    clearTimeout(item.updateTimeout);
                    item.updateTimeout = setTimeout(()=>{
                        item.update()
                    }, 100);                    
                }
                $pbStore.collection('cards').subscribe('*', item.debounceUpdate);
                $pbStore.collection('comments').subscribe('*', item.debounceUpdate);
                $pbStore.collection('agreements').subscribe('*', item.debounceUpdate);
                item.update();
                return item;
            })
        } else {
            columnData = [];
        }
        return columnData;
    }
    
    function instrumentCard(card) {
        card.update = async function(){
            let cardData = await $pbStore.collection('cards').getOne(card.id, {
                expand: 'user,comments(card),votes(card),cards(groupedto),agreements(card),cards_emojis(card)',
                '$cancelKey': card.id // Without this, the client cancels separate column requests as non-unique
            })
            console.log(`UPDATING CARD ${card.id}:${card.description}`, cardData, cardData.expand['cards(groupedto)']);
            if(cardData.expand['cards(groupedto'] != undefined) {
                cardData.expand['cards(groupedto'] = cardData.expand['cards(groupedto'].map((subcard)=>instrumentCard(subcard))
            }
            Object.entries(cardData).forEach(([key, value])=>card[key] = value)
        }
        //$pbStore.collection('cards').subscribe(card.id, card.update);
        
        return card
    }
    
    async function loadColumnCards(column) {
        let cardData = await $pbStore.collection('cards').getFullList(10, {
            sort: "-created",
            filter: 'column = "' + column.id + '"',
            expand: 'user,comments(card),votes(card),cards(groupedto),agreements(card),cards_emojis(card)',
            '$cancelKey': column.id // Without this, the client cancels separate column requests as non-unique
        })
        cardData = cardData.map((card)=>instrumentCard(card))
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
        let boardData = {...board, ...{timerstart: newstart, timerlength: newlength, votes: {choices: {}, show: false, auto: board.votes.auto, didauto: false}}}
        
        $pbStore.collection("boards").update(data.boardid, boardData)
    }
    
    function endTimer() {
        let boardData = {...board, ...{timerstart: 0, timerlength: 0, votes: {choices: {}, show: false, auto: board.votes.auto, didauto: false}}}
        $pbStore.collection("boards").update(data.boardid, boardData)
        if(typeof stopTimer == 'function') stopTimer();
        timer = false;
    }
    
    function doTimerClick(e) {
        if(!isFacilitator) return;
        if(e.detail.shiftKey) {
            endTimer();
            e.detail.stopPropagation();
            return;
        }
        let boardData = {...board};
        boardData.votes.choices = {}
        boardData.votes.show = !board.votes.show
        boardData.votes.didauto = false;
        $pbStore.collection("boards").update(data.boardid, boardData)
    }
    
    function doMoreTimeMoveOn(user, option) {
        let boardData = {...board};
        boardData.votes.choices[user.id] = option
        $pbStore.collection("boards").update(data.boardid, boardData)
    }
    
    function getOptimalTimer(cardsRemaining, timeLeft = 60 - new Date().getMinutes()) {
        return timeLeft * 60 / cardsRemaining
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
            votesSubUpdate();
        })
    }
    
    function columnsSubUpdate(column) {
        if(column.record.board != data.boardid) return;
        $pbStore.collection('columns').getFullList(200, {filter: `board = "${data.boardid}"`, sort: "+seq"}).then((columnData)=>{
            board.columns = makeColumns(columnData)
        })
    }

    function nextScene() {
        let index = board.scenes.indexOf(currentScene)
        if(index == -1 || index >= board.scenes.length) return
        let scene = board.scenes[index + 1]
        
        currentScene.current = false;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
        currentScene = scene;
        currentScene.current = true;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
    }
    
    function getVoteCounts() {
        let votes = {}
        board.votetypes.forEach((votetype)=>{
            votes[votetype.typename] = 0;
        })
        return votes;
    }
    
    function assignedVotes(typename) {
        let result = board.votetypes.filter((type)=>type.typename == typename)
        return result[0].amount;
    }
    
    function votesSubUpdate() {
        //if(vote.record.user != $pbStore.authStore.model.id) return;
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
        $pbStore.collection('votestatus').getFullList(200, {filter: `board = "${board.id}"`}).then((voteStatuses)=>{
            board.voteStatus = {}
            voteStatuses.forEach((item)=>{
                board.voteStatus[item.typename] = item;
            })
        })
    }
    
    function alarm(e) {
        console.log(e);
        if(e.detail.length < 60) {
            audioFile[0].play();
        }
        else {
            audioFile[1].play();
        }
    }
    
    function alarmWarn(e) {
        if(true /*board.votes.auto*/) {
            if(!isFacilitator) return;
            if(board.votes.didauto) return
            let boardData = {...board};
            if(!boardData.votes.show) {
                boardData.votes.choices = {}
            }
            boardData.votes.show = true;
            boardData.votes.didauto = true;
            $pbStore.collection("boards").update(data.boardid, boardData)
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
    
    $: openVotes =  board.votetypes.reduce((prev, voteType) => voteType.amount + prev, 0)
    
    function getMoreTimeMoveOnPercent(board, index) {
        if(board.votes == undefined || board.votes.choices == undefined) {
            return 0
        }
        if(Object.values(board.votes.choices).length == 0) {
            return 0
        }
        let x= Math.floor(100*Object.values(board.votes.choices).reduce((prev, cur)=> cur == index ? prev+1 : prev, 0) / Object.values(board.votes.choices).length )
        return x
    }
    
    function getSelectedMoreTimeMoveOn(board, index) {
        if(board.votes == undefined || board.votes.choices == undefined) {
            return false
        }
        if(Object.values(board.votes.choices).length == 0) {
            return false
        }
        return board.votes.choices[user.id] == index
    }
    
    $: moreTimePercent = getMoreTimeMoveOnPercent(board, 1)
    $: moveOnPercent = getMoreTimeMoveOnPercent(board, 2)
    
    $: selectedMoreTime = getSelectedMoreTimeMoveOn(board, 1)
    $: selectedMoveOn = getSelectedMoreTimeMoveOn(board, 2)
    
    function toggleAutoVote() {
        let boardData = {...board};
        boardData.votes.auto = !board.votes.auto
        $pbStore.collection("boards").update(data.boardid, boardData)
    }
</script>


<svelte:head>
{#await boardData}
<title>Teambeat - loading...</title>
{:then foo}
<title>{board.name} - Teambeat</title>
{/await}
</svelte:head>


{#if !loaded}
<div class="container content">
    <h1>Loading Board {data.boardid}</h1>
    <p>Loading...</p>
</div>
<div>Loading...</div>
{:else} 
<div class="container content">
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <h1 class="title">{board.name}</h1>
            </div>
        </div>
        {#if currentScene.do("doVote")}
        <div class="level-item votesleft">
            {#if openVotes > 0}
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
                <span>
                    {#if board.votetypes.length > 1}
                    {votetype.typename} -    
                    {/if}
                    {board.voteStatus[votetype.typename]?.remaining || 0}
                </span>
                {/each}
            </div>
            {/if}
            {:else}
            {#if isFacilitator}
            <div class="has-text-danger">Add votes <i class="fa-solid fa-arrow-right-long"></i></div>
            {:else}
            <div>Facilitator must add votes</div>
            {/if}
            {/if}
        </div>
        {/if}
        {#if isFacilitator}
        <div class="level-right is-flex is-justify-content-right is-align-content-center">
            <div class="field has-addons mx-2 my-0">
                <div class="control">
                    <div class="dropdown is-hoverable">
                        <div class="dropdown-trigger">
                            <button class="button is-small is-rounded is-primary is-light" aria-haspopup="true" aria-controls="dropdown-menu">
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
                </div>
                <div class="control">
                    <button class="button is-small is-rounded is-primary is-light has-tooltip-arrow has-tooltip-bottom" on:click={nextScene} disabled={board.scenes.indexOf(currentScene) + 1 >= board.scenes.length}  data-tooltip="Go to the next scene">
                        <span class="icon is-small">
                            <i class="fa-solid fa-forward"></i>
                        </span>
                    </button>
                </div>
            </div>
            
            <div class="field has-addons">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="control dropdown is-right" class:is-hoverable={currentScene.do("doVote")}>
                    <button class="button is-small is-rounded is-primary is-light" disabled="{!currentScene.do("doVote")}">
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
                    <button class="button is-small is-rounded is-primary is-light">
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
                                <span class="icon"><i class="fa-kit fa-solid-timer-circle-plus"></i></span> 
                                <span>+ 0:03</span>
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(30)}>
                                <span class="icon"><i class="fa-kit fa-solid-timer-circle-plus"></i></span> 
                                <span>+ 0:30</span>
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(60)}>
                                <span class="icon"><i class="fa-kit fa-solid-timer-circle-plus"></i></span> 
                                <span>+ 1:00</span>
                            </a>
                            <a href="#" class="dropdown-item" on:click={()=>extendTimer(300)}>
                                <span class="icon"><i class="fa-kit fa-solid-timer-circle-plus"></i></span> 
                                <span>+ 5:00</span>
                            </a>
                            <!-- 
                                <hr class="dropdown-divider">
                                <a href="#" class="dropdown-item" class:is-active={board.votes.auto} on:click={toggleAutoVote}>
                                    <span class="icon"><i class="fa-solid fa-clock-rotate-left"></i></span>
                                    <span>Auto-Vote More Time</span>
                                </a>
                            -->
                            <hr class="dropdown-divider">
                            <a href="#" class="dropdown-item" on:click={endTimer}>
                                <span class="icon"><i class="fa-kit fa-solid-timer-circle-xmark"></i></span>
                                <span>Stop Timer</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="control">
                    <button class="button is-small is-rounded is-primary is-light has-tooltip-arrow has-tooltip-bottom" on:click={shareLink} data-tooltip="Copy a link to this board">
                        <span class="icon is-small">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </span>
                    </button>
                </div>                
                <div class="control">
                    <button class="button is-small is-rounded is-primary is-light has-tooltip-arrow has-tooltip-bottom" on:click={configBoard} data-tooltip="Configure this board">
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
<Present bind:board bind:currentScene bind:cardsRemaining />
{:else if currentScene.mode == 'review'}
<Review bind:board bind:currentScene />
{:else}
<Columns bind:board bind:currentScene />
{/if}

{/if}

<Drawer bind:board bind:visible={showDrawer} />

{#if timer}
<div class="timer" in:fly="{{ y: 200, duration: 500 }}" out:fly="{{ y: 200, duration: 500 }}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="timerbox" class:expanded={board.votes.show} >
        {#if board.votes.show}
        <div class="timerdetail" in:fade="{{delay: 1000}}" out:fade>
            <button class="button is-primary is-light" on:click={()=>doMoreTimeMoveOn(user, 1)}>
                More Time
                <progress class="progress is-small" class:is-success={selectedMoreTime} value={moreTimePercent} max="100">20%</progress>
            </button>
            <button class="button is-primary is-light" on:click={()=>doMoreTimeMoveOn(user, 2)}>
                Move On
                <progress class="progress is-small" class:is-success={selectedMoveOn} value={moveOnPercent} max="100">20%</progress>
            </button>
        </div>
        {/if}
        
        <span class="is-small has-tooltip-arrow has-tooltip-left" data-tooltip="{isFacilitator?'Toggle Discussion Voting':'time remaining'}">
            <TimerDial on:click={doTimerClick} on:timeup={alarm} on:warn={alarmWarn} bind:timeLimit bind:startedAt bind:start={startTimer} bind:stop={stopTimer}/>
        </span>
    </div>
</div>
{/if}

<style lang="scss">
    @import "../node_modules/bulmaswatch/flatly/variables";
    
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
        background-color: rgba(255,255,255,0.5);
        transition: width 200ms 400ms, height 200ms 400ms, border-radius 200ms 400ms;
        box-shadow: 3px 3px 3px #ccc;
    }
    .timer .timerbox.expanded {
        width: 300px;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 30px;
    }
    .timerdetail {
        margin-left: 30px;
        width: 210px;
        min-height: 58px;
    }
    .timerdetail button {
        flex-wrap: wrap;
        height: auto;
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
    .dropdown-item.is-active {
        background-color: $primary;
    }
    .button.is-primary.is-light[disabled] {
        border-color: $white-ter;
    }
</style>
