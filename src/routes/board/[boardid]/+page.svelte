<script>
    import { pbStore } from "svelte-pocketbase";
    import Card from "./Card.svelte";
    import {onDestroy, tick} from "svelte"
    import { fly, fade } from 'svelte/transition';
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
    let newColumnName = '';
    let newColumnVote = true;
    
    onDestroy(()=>{
        board.columns.forEach((column) => {
            column.disconnect();
        })
    })
    
    function getBoard() {
        let boardData = $pbStore.collection('boards').getOne(data.params.boardid, {expand: "users,facilitators,scenes(board),columns(board)"});
        
        boardData.then((boardData) => {
            board = {
                name: boardData.name,
                columns: makeColumns(boardData.expand["columns(board)"]),
                scenes: boardData.expand["scenes(board)"],
                currentScene: null,
                timerstart: boardData.timerstart,
                timerlength: boardData.timerlength,
            }
            board.scenes.forEach((scene)=>{
                if(scene.current) {
                    board.currentScene = scene
                }
            })
            if(board.currentScene == null) {
                board.currentScene = board.scenes[0];
            }
            checkTimer();
            
            $pbStore.collection('boards').subscribe(data.params.boardid, (b)=>{
                board.timerstart = b.record.timerstart;
                board.timerlength = b.record.timerlength;
                checkTimer();
            })
        })
    }
    
    function checkTimer() {
        if(board.timerlength != 0) {
            if((board.timerstart + board.timerlength * 1000) > Date.now()) {
                timeLimit = board.timerlength;
                timePassed = (Date.now() - board.timerstart) / 1000;
                timer = true;
                tick().then(() => startTimer());
            }
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
    
    let board = {columns: [], scenes: [], currentScene: {title: ''}};
    getBoard();
    
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
            console.log(e);
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
        
        console.log("BOARD", board);
        
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
        $pbStore.collection("boards").update(data.params.boardid, boardData)
        
        /*
        if(timer) {
            timeLimit += sec;
        } else {
            timeLimit = sec;
            tick().then(() => startTimer());
            timer = true;
        }
        */
    }
    
    function endTimer() {
        let boardData = {
            "name": board.name,
            "users": board.users,
            "facilitators": board.facilitators,
            "timerstart": 0,
            "timerlength": 0
        };
        $pbStore.collection("boards").update(data.params.boardid, boardData)
        if(typeof stopTimer == 'function') stopTimer();
        timer = false;
    }
    
    function doTimerClick() {
        timerexpanded = !timerexpanded
    }
    
    function deleteBoard(){
        if(confirmDelete) {
            $pbStore.collection('boards').delete(data.params.boardid).then(()=>{
                location.href="/";
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
            "board": data.params.boardid
        }
        $pbStore.collection('columns').create(columnData).then(()=>{
            getBoard();
            newColumnName = '';
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


{#await board}
<div class="container">
    <h1>Loading Board {data.params.boardid}</h1>
    <p>Loading...</p>
</div>
<div>Loading...</div>    
{:then board} 
<div class="container content">
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <h1 class="title">{board.name}</h1>
            </div>
            <div class="level-item">
                <div class="dropdown is-hoverable">
                    <div class="dropdown-trigger">
                        <button class="button is-small is-white" aria-haspopup="true" aria-controls="dropdown-menu">
                            <span>{board.currentScene.title}</span>
                            <span class="icon is-small">
                                <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            {#each board.scenes as scene}
                            <a href="#" class="dropdown-item">
                                {scene.title}
                            </a>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
            <div class="level-item">
            </div>
        </div>
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
    </div>
</div>
<div class="boardscroll">
    <div class="board">
        <div class="row columns">
            {#each board.columns as column}
            
            <div class="column cardcolumn content" on:dragenter={handleDragEnter} on:dragleave={handleDragLeave} on:dragover={handleDragOver} on:drop={handleDragDrop} id="{column.id}">
                <h2 class="subtitle">{column.title}</h2>
                <div class="field has-addons">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <button class="button is-small is-rounded" on:click={()=>addCard(column)}>
                        <span class="icon is-small">
                            <i class="fa-light fa-cards-blank"></i>
                        </span>
                        <span>Add Card</span>
                    </button>
                </div>
                
                {#each column.cards as card(card.id)}
                <Card bind:card={card} on:dragstart={handleDragStart} on:dragend={handleDragEnd} />
                {/each}
                
                
            </div>
            
            {/each}
        </div>
    </div>
</div>

{/await}

<sl-drawer placement="top" class="drawer-placement-top" bind:this={drawer}>
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
            <table class="table">
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
            <table class="table">
                <thead><tr>
                    <th>Scene</th>
                    <th>Add</th>
                    <th>Reveal</th>
                    <th>Rearrange</th>
                    <th>Vote</th>
                    <th>Comment</th>
                </tr></thead>
                <tbody>
                    {#each board.scenes as scene}
                    <tr>
                        <td>{scene.title}</td>
                        <td><input type="checkbox" class="checkbox"></td>
                        <td><input type="checkbox" class="checkbox"></td>
                        <td><input type="checkbox" class="checkbox"></td>
                        <td><input type="checkbox" class="checkbox"></td>
                        <td><input type="checkbox" class="checkbox"></td>
                    </tr>
                    {/each}
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
        overflow-x:scroll;
        
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
</style>
