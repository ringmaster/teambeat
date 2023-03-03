<script>
    import { pbStore } from "svelte-pocketbase";
    import Card from "./Card.svelte";
    import {onDestroy, tick} from "svelte"
    import { fly, fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import notify from "../../../utils/notify";
    
    import TimerDial from "./TimerDial.svelte";
    
    export let data;
    
    $: user = $pbStore.authStore.model
    
    let status = '';
    let dropped_in = false;
    let drawer;
    let timer = false;
    let timerexpanded = false;
    let timeLimit = 0;
    let timePassed = 0;
    let startTimer;
    let stopTimer;
    let confirmDelete = false;
    let newSceneName = '';
    let newColumnName = '';
    let newColumnVote = true;
    let currentScene = {title: "", loaded: false};
    let boardData;
    let board = {columns: [], scenes: [], facilitators: [], currentScene: {title: ''}};

    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;

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
            boardData = $pbStore.collection('boards').getOne(data.boardid, {expand: "users,facilitators,scenes(board),columns(board)"});
        }
        
        boardData.then((boardData) => {
            board = {
                name: boardData.name,
                columns: makeColumns(boardData.expand["columns(board)"]),
                scenes: boardData.expand["scenes(board)"],
                timerstart: boardData.timerstart,
                timerlength: boardData.timerlength,
                facilitators: boardData.facilitators,
                users: boardData.users
            }
            currentScene = board.scenes.reduce((prev, cur) => {
                if(cur.current) {
                    return cur
                }
                return prev
            }, board.scenes[0])
            $pbStore.collection('scenes').subscribe('*', sceneSubUpdate)
            checkTimer();
            
            $pbStore.collection('boards').subscribe(data.boardid, (b)=>{
                board.timerstart = b.record.timerstart;
                board.timerlength = b.record.timerlength;
                checkTimer();
            })
        })
    }
    
    let dosTimer;
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
                timePassed = (Date.now() - board.timerstart) / 1000;
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
            expand: 'user,comments(card)',
            '$cancelKey': column.id // Wihtout this, the client cancels separate column requests as non-unique
        })
        return cardData;
    }
    
    function configBoard() {
        drawer.show();
    }
        
    // https://svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
    // https://www.javascripttutorial.net/web-apis/javascript-drag-and-drop/
    
    function handleDragStart(e) {
        status = "Dragging the element " + e.detail.currentTarget.getAttribute('id');
        // This sets the class on the original before the dragged clone is made
        window.setTimeout(()=>e.detail.target.classList.add('novis'), 0);
        e.detail.dataTransfer.dropEffect = "move";
        e.detail.dataTransfer.setData("text", e.detail.target.getAttribute('id'));
    }
    
    function handleDragEnd(e) {
        e.preventDefault();
        if (dropped_in == false) {
            window.setTimeout(()=>e.detail.target.classList.remove('novis'), 0);
            status = "You let the " + e.detail.target.getAttribute('id') + " go.";
        }
        dropped_in = false;
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        status = "You are dragging over " + e.currentTarget.getAttribute('id');
        let columnOver = document.getElementsByClassName('column-over')
        for(let element of columnOver) {
            element.classList.remove('column-over');
        };
        e.target.closest('.column').classList.add('column-over')
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        let columnOver = document.getElementsByClassName('column-over')
        for(let element of columnOver) {
            element.classList.remove('column-over');
        };
        e.target.closest('.column').classList.add('column-over')
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        if(e.target.classList.contains('column')) {
            status = "You left the " + e.target.getAttribute('id');
            e.target.closest('.column').classList.remove('column-over');
        }
        else {
            e.cancelBubble = true;
        }
    }
    
    async function handleDragDrop(e) {
        e.preventDefault();
        e.target.closest('.column').classList.remove('column-over');
        var element_id = e.dataTransfer.getData("text");
        document.getElementById(element_id).classList.remove('novis');
        dropped_in = true;
        status = "You droped " + element_id + " into drop zone " + e.target.closest('.column').id;
        
        // Load the initial card data
        let record = await $pbStore.collection('cards').getOne(element_id);
        
        // Update the column on the card
        let oldColumnId = record.column;
        record.column = e.target.closest('.column').id;
        
        // Submit the updated data
        record = await $pbStore.collection('cards').update(element_id, record);
    }
    
    function addCard(column) {
        const data = {
            "user": user.id,
            "type": "default",
            "description": "",
            "options": "{}",
            "column": column.id
        };
        
        $pbStore.collection('cards').create(data)
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
    
    function delColumn(id) {
        $pbStore.collection('columns').delete(id).then(()=>{
            getBoard();
        })
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
            </div>
        </div>
        {#if isFacilitator}
        <div class="level-right is-flex is-justify-content-right is-align-content-center">
            <div class="field has-addons">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="control">
                    <button class="button is-small is-rounded" on:click={configBoard}>
                        <span class="icon is-small">
                            <i class="fa-light fa-square-kanban"></i>
                        </span>
                        <span>Configure</span>
                    </button>
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
                
            </div>
        </div>
        {/if}
    </div>
</div>

{#if board.columns.length > 0}
<div class="boardscroll">
    <div class="board">
        <div class="row columns">
            {#each board.columns as column}
            
            <div class="column cardcolumn content" on:dragenter={handleDragEnter} on:dragleave={handleDragLeave} on:dragover={handleDragOver} on:drop={handleDragDrop} id="{column.id}">
                <div class="columnheader level">
                    <div class="level-left">
                        <div class="level-item">
                            <h2 class="subtitle">{column.title}</h2>
                        </div>
                        {#if currentScene.doAdd}
                        <div class="level-item">
                            <div class="field has-addons">
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <button class="button is-small is-rounded" on:click={()=>addCard(column)}>
                                    <span class="icon is-small">
                                        <i class="fa-light fa-cards-blank"></i>
                                    </span>
                                    <span>Add Card</span>
                                </button>
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>
                
                {#each column.cards as card(card.id)}
                <Card bind:card={card} bind:scene={currentScene} on:dragstart={handleDragStart} on:dragend={handleDragEnd} />
                {/each}
                
                
            </div>
            
            {/each}
        </div>
    </div>
</div>
{:else}
<div class="hero content">
    <div class="container">
        <h2>This is a new board</h2>
        <p>You will need to do a few things to make this board viable:</p>
        <ol>
            <li>Click the Confiure button, above.</li>
            <li>Switch to the <code>Columns</code> tab to add new columns</li>
            <li>Swtich to the <code>Scenes</code> tab to add new scenes with specific capabilities.</li>
        </ol>
    </div>
</div>
{/if}

{/await}

<sl-drawer placement="top" class="drawer-placement-top" bind:this={drawer} on:sl-request-close={updateSceneDos}>
    <div slot="label"><h1 class="title"><i class="fa-light fa-square-kanban"></i> Configure Board</h1></div>
    
    <sl-tab-group>
        <sl-tab slot="nav" panel="general">General</sl-tab>
        <sl-tab slot="nav" panel="columns">Columns</sl-tab>
        <sl-tab slot="nav" panel="scenes">Scenes</sl-tab>
        
        <sl-tab-panel name="general">
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
        
        <TimerDial bind:timeLimit bind:timePassed bind:start={startTimer} bind:stop={stopTimer}/>
    </div>
</div>
{/if}

<style lang="scss">
    .container {
        padding-bottom: 0;
    }
    .boardscroll {
        overflow:scroll;
        height: calc(100vh - 124px)
    }
    .board {
        // margin: 0 calc((100% - 80rem)/2) 3rem;
        padding: 20px;
        min-height: 70vh;
    }
    .cardcolumn {
        min-width: 30rem;
    }
    :global(.column-over) {
        background-color: #eee;
    }
    :global(.novis) {
        opacity: 0.0;
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
    .columnheader{
        position: sticky;
        z-index: 100;
        top: 0px;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
    }
    .dropdown-menu {
        z-index: 200;
    }
</style>
