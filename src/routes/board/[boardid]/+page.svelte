<script>
    import { pbStore } from "svelte-pocketbase";
    import Card from "./Card.svelte";
    import {onDestroy} from "svelte"
    import { fly, fade } from 'svelte/transition';
    import { Doughnut } from 'svelte-chartjs';
    import Color from "colorjs.io";
    import notify from "../../../utils/notify";
    
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        ArcElement,
        CategoryScale,
    } from 'chart.js';
    
    ChartJS.register(Title, ArcElement, CategoryScale);
    
    export let data;
    
    $: user = $pbStore.authStore.model
    
    let status = '';
    let dropped_in = false;
    let drawer;
    let timer = false;
    let timerexpanded = false;
    let timeleft = 0;
    let timerlength = 0;
    let timerint;
    let confirmDelete = false;
    
    let timerdata = {
        datasets: [
        {
            data: [60, 0],
            backgroundColor: ['green', '#ffffff']
        },
        ],
    };
    
    onDestroy(()=>{
        board.columns.forEach((column) => {
            column.disconnect();
        })
    })
    
    function getBoard() {
        let boardData = $pbStore.collection('boards').getOne(data.params.boardid, {expand: "users,facilitators,scenes(board),columns(board)"});
        
        boardData.then((data) => {
            board = {
                name: data.name,
                columns: makeColumns(data.expand["columns(board)"]),
                scenes: data.expand["scenes(board)"]
            }
        })
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
    
    let board = {columns: [], scenes: []};
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
        
        // Reload the destination column
        /*
        // This will be done by the column watch
        for(let column of board.columns) {
            if(column.id == record.column || column.id == oldColumnId) {
                loadCards(column).then((cards) => {
                    column.cards = cards;
                    board = board;
                });
            }
        }
        */
        
        // Reload the source column
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
    
    function doTimer() {
        if(!timer) {
            timeleft = 60;
            timerlength = 60;
            timerdata = {
                datasets: [
                {
                    data: [timeleft, timerlength-timeleft],
                    backgroundColor: ['green', '#ffffff']
                },
                ],
            };
            timerint = window.setInterval(()=>{
                timeleft = timeleft - 1;
                let color = new Color("red");
                let dorange = color.range("green", {
                    space: "lch", 
                    outputSpace: "srgb"
                });
                let timercol = dorange(timeleft/timerlength);
                timerdata = {
                    datasets: [
                    {
                        data: [timeleft, timerlength-timeleft],
                        backgroundColor: [timercol, '#ffffff']
                    },
                    ],
                };
                console.log(timerdata);
            }, 1000)
        } else {
            window.clearInterval(timerint);
        }
        timer = !timer;
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
                <h2 class="subtitle">        
                    {#each board.scenes as scene}
                    {scene.title}
                    {/each}
                </h2>
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
                        <span>Configure Board</span>
                    </button>
                </div>
                <div class="control">
                    <button class="button is-small is-rounded" on:click={configBoard}>
                        <span class="icon is-small">
                            <i class="fa-light fa-clapperboard"></i>
                        </span>
                        <span>Configure Scene</span>
                    </button>
                </div>
                <div class="control">
                    <button class="button is-small is-rounded" on:click={doTimer}>
                        <span class="icon is-small">
                            <i class="fa-light fa-timer"></i>
                        </span>
                        <span>Timer</span>
                    </button>
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
    
    <div class="field is-grouped">
        <div class="control">
            <button class="button is-link is-light" on:click={deleteBoard}>
                <span class="icon is-small"><input class="checkbox" type="checkbox" bind:checked={confirmDelete} on:click={(e)=>e.stopPropagation()}></span>
                <span>Delete Board</span>
            </button>
        </div>
    </div>
    
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <sl-button slot="footer" variant="primary" on:click={()=>drawer.hide()}>Close</sl-button>
</sl-drawer>


{#if timer}
<div class="timer" in:fly="{{ y: 200, duration: 500 }}" out:fly="{{ y: 200, duration: 500 }}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="timerbox" class:expanded={timerexpanded} >
        {#if timerexpanded}
        <div class="timerdetail" in:fade="{{delay: 1000}}" out:fade>
            <div class="field has-addons">
                <p class="control">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-light fa-minus"></i>5
                        </span>
                    </button>
                </p>
                <p class="control">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-light fa-minus"></i>1
                        </span>
                    </button>
                </p>
                <p class="control">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-light fa-plus"></i>1
                        </span>
                    </button>
                </p>
                <p class="control">
                    <button class="button is-small is-rounded">
                        <span class="icon is-small">
                            <i class="fa-light fa-plus"></i>5
                        </span>
                    </button>
                </p>
            </div>
        </div>
        {/if}
        <Doughnut class="timerdial" data={timerdata} options={{animation: {animateRotate: false }}}  on:click={doTimerClick} />
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
