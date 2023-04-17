<script>
    import Card from "./Card.svelte";
    import { pbStore } from "svelte-pocketbase";
    import boarddefaults from "./boarddefaults";
    import { votes as votedata } from "$stores/votes.js";
    import { asDropZone } from 'svelte-drag-and-drop-actions'
    
    import { quintOut } from 'svelte/easing';
    import { crossfade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    
    //import simplemde from "simplemde/src/js/simplemde.js";
    import notify from "../../../utils/notify";
    
    export let board
    export let currentScene
    
    let selectedPreset;
    $: user = $pbStore.authStore.model
    
    function dropZoneDrop(x,y, Operation, offeredTypeList, droppedCard, targetColumn) {
        if(targetColumn.id == droppedCard.column) {
            console.log("CAN'T DROP ON SAME COLUMN", droppedCard, targetColumn);
            return false;
        }
        console.log("DROP ON COLUMN", droppedCard, targetColumn);
        
        droppedCard.column = targetColumn.id;
        let follow = ()=>{}
        if(droppedCard.groupedto != null) {
            let parent = droppedCard.expand.groupedto;
            //follow = () => {$pbStore.collection('cards').update(parent.id, parent)};
            droppedCard.groupedto = null;
        }
        $pbStore.collection('cards').update(droppedCard.id, droppedCard).then(follow);
    }
    
    function addCard(column) {
        if(!column.editor.textContent.match(/\S/)) {
            notify('The card you add must have content.', "warning");
        }
        else {
            const data = {
                "user": user.id,
                "type": "default",
                "description": column.editor.innerText,
                "options": "{}",
                "column": column.id
            };
            
            $pbStore.collection('cards').create(data).then(()=>{
                column.editor.innerHTML = "";
            })
        }
    }
    
    function addPreset() {
        let promises = []
        let collist = {};
        selectedPreset.columns.forEach((column)=>{
            column.board = board.id;
            promises.push($pbStore.collection('columns').create(column).then((col)=>{
                collist[col.title] = col.id;
            }));
        })
        let delscenes = board.scenes.map((scene) => scene.id);
        Promise.all(promises).then(()=>{
            let promises = [];
            selectedPreset.scenes.forEach((scene)=>{
                scene.board = board.id;
                scene.options = scene.options.map((item) => {
                    let r = item.match(/\$(.+)$/)
                    if(r) {
                        item = item.replace(/\$(.+)$/, collist[r[1]])
                    }
                    return item;
                });
                promises.push($pbStore.collection('scenes').create(scene));
            });
            delscenes.forEach((sceneid) => {
                promises.push($pbStore.collection('scenes').delete(sceneid))
            })
            Promise.all(promises)
        })
    }
    
    function focusEditor(column) {
        column.editor.focus();
    }
    
    function editorKeypress(e, column) {
        if(e.key == 'Enter') {
            addCard(column);
        }
    }
    
    function maybeSort(cards, dosort) {
        if(dosort) {
            cards.sort((a, b) => {
                let aval = $votedata.cards[a.id] ? $votedata.cards[a.id].votes.total : 0;
                let bval = $votedata.cards[b.id] ? $votedata.cards[b.id].votes.total : 0;
                return bval - aval;
            })
        }
        return cards;
    }
    
    const [send, receive] = crossfade({
        duration: d => Math.sqrt(d * 200),
        
        fallback(node, params) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            
            return {
                duration: 600,
                easing: quintOut,
                css: t => `
                transform: ${transform} scale(${t});
                opacity: ${t}
                `
            };
        }
    });
    
</script>

{#if board.columns.length > 0}
<div class="boardscroll">
    <div class="board">
        <div class="row columns">
            {#each board.columns as column}
            {#if !currentScene.do(`hide:${column.id}`)}
            
            <div class="column cardcolumn content" use:asDropZone={{Extras: column, onDrop: dropZoneDrop, TypesToAccept:{ 'text/card':'all' }}} draggable="false" id="column-{column.id}">
                <div class="columnheader level">
                    <div class="level-left">
                        <div class="level-item">
                            <h2 class="subtitle">{column.title}</h2>
                        </div>
                        {#if currentScene.do("doAdd")}
                        <div class="level-item">
                        </div>
                        {/if}
                    </div>
                </div>
                {#if currentScene.do("doAdd")}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="card" on:click={()=>{focusEditor(column)}}>
                    <div class="card-content cardcontent">
                        
                        <!-- THE EDITOR IS HERE-->
                        <div class="cardcontentdescription cardeditor">
                            <div class="editor" bind:this={column.editor} contenteditable="true" on:keypress={(e)=>editorKeypress(e,column)}></div>
                        </div>
                        
                        <div class="cardcontentedit">
                            <span class="has-tooltip-arrow" data-tooltip="Add This Card" on:click={()=>addCard(column)}>
                                <i class="fa-solid fa-plus"></i>
                            </span>
                        </div>
                    </div>
                </div>
                {/if}
                
                {#each maybeSort([...column.cards], currentScene.do("doShowVotes")) as card(card.id)}
                <div in:receive|local="{{key: card.id}}" out:send|local="{{key: card.id}}" animate:flip|local="{{duration: 200}}">
                    <Card bind:card={card} bind:scene={currentScene} bind:board={board} />
                </div>
                {/each}
                
                
            </div>
            {/if}
            
            {/each}
        </div>
    </div>
</div>
{:else}
<div class="container">
    <div class="columns">
        <div class="column">
            <div class="notification is-info is-light">
                <div class="content">
                    <h2>This board has no columns</h2>
                    <p><b>Maybe this is intentional?</b> If not, you have two options:</p>
                    <ol>
                        <li>Configure the columns and scenes for this board manually using the <code><i class="fa-light fa-gear"></i></code> Configure button, at the top right.</li>
                        <li>Choose one of the preset board configurations to the right.</li>
                    </ol>
                </div>
            </div>
        </div>
        <div class="column">
            <div class="field">
                <label class="label" for="presetChooser">Choose a Preset</label>
                <div class="control">
                    <div class="select">
                        <select bind:value={selectedPreset} id="presetChooser">
                            {#each boarddefaults as preset}
                            <option value="{preset}">{preset.title}</option>
                            {/each}
                        </select>
                    </div>
                    <button class="button" on:click={addPreset}>Use Preset</button>
                </div>
            </div>
            <div class="content">
                {@html selectedPreset?.description}
            </div>
        </div>
    </div>
</div>
{/if}


<style lang="scss">
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
        min-width: 20rem;
    }
    :global(.column.hovered .columnheader h2) {
        text-shadow: 0px 0px 10px #034a91;
    }
    :global(.novis) {
        opacity: 0.0;
    }
    .columnheader{
        position: sticky;
        z-index: 100;
        top: 0px;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
    }
    
    .card {
        border-width: 3px 1px 1px;
        box-shadow: var(--sl-shadow-large);
        margin-bottom: 1rem;
        width: 100%;
    }
    .cardcontent {
        display: flex;
    }
    .cardcontentdescription {
        flex-grow: 1;
    }
    .cardcontentedit {
        flex-grow: 0;
        max-width: 16px;
        padding-left: 1rem;
    }
    .editor {
        overflow-wrap: anywhere;
    }
    .editor {
        outline: none;
    }
</style>