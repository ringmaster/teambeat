<script>
    import { pbStore } from "svelte-pocketbase";
    import { votes as votedata } from "$stores/votes.js";
    import {onDestroy, tick} from "svelte"
    import { fly, fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import notify from "../../../utils/notify";
    import Card from "./Card.svelte";
    
    export let board;
    export let currentScene;
    
    let onlyvoted = false;
    let voteSort = 'votes';
    
    function decompVotes(cardid, votetype) {
        let v = $votedata.cards[cardid];
        if(v == undefined) return 0
        v = v[votetype];
        if(v == undefined) return 0
        v = v.total;
        if(v == undefined) return 0
        return v;
    }
    
    function presentSort(columns, onlyvoted) {
        let cards = [];
        columns.forEach(column => {
            if(!currentScene.do(`hide:${column.id}`)) {
                cards = [...cards, ...column.cards];
            }
        });
        console.log("ONLYVOTED", onlyvoted);
        cards = cards.sort((a, b) => {
            let aval = decompVotes(a.id, voteSort);
            let bval = decompVotes(b.id, voteSort);
            return bval - aval;
        }).filter((card) => !onlyvoted || decompVotes(card.id, voteSort) > 0 )
        return cards;
    }
    
    function selectCard(selcard) {
        currentScene.presenting = selcard.id;
        $pbStore.collection('scenes').update(currentScene.id, currentScene);
    }
</script>

<div class="container">
    <div class="columns presentationscreen">
        <div class="column">
            <div class="presentationarea">
                {#each presentSort([...board.columns], onlyvoted) as card(card.id)}
                {#if card.id == currentScene.presenting}
                <div class="focuscard">
                    <Card bind:card={card} bind:scene={currentScene} bind:board={board} />
                </div>
                {/if}
                {/each}
            </div>
        </div>
        <div class="column is-one-third cardlist">
            <div class="level filtercontrols">
                <div class="level-item">
                    {#if board.votetypes.length > 1}
                    <div class="select is-small">
                        <select bind:value={voteSort}>
                            {#each board.votetypes as votetype}
                            <option>{votetype.typename}</option>
                            {/each}
                        </select>
                    </div>
                    {/if}
                    <label class="checkbox">
                        <input type="checkbox" bind:checked={onlyvoted}>
                        Only Voted 
                    </label>
                </div>
            </div>
            {#each presentSort([...board.columns], onlyvoted) as card(card.id)}
            <div class="cardrow">
                <div class="cardcontrols">
                    {#if currentScene.presenting == card.id}
                    <span class="icon" on:click={()=> card.selected = true}>
                        <i class="fa-solid fa-circle-chevron-left"></i>
                    </span>
                    {:else}
                    <span class="icon" on:click={()=>selectCard(card)}>
                        <i class="fa-thin fa-circle-chevron-left"></i>
                    </span>
                    {/if}
                </div>
                <Card bind:card={card} bind:scene={currentScene} bind:board={board} />
            </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .presentationscreen {
        height: calc(100vh - 112px);
    }
    .cardlist {
        overflow: scroll;
        padding-top: 0px;
    }
    .filtercontrols {
        position: sticky;
        top: 0px;
        z-index: 100;
        background: rgb(255,255,255);
        background: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 25%);
        padding-bottom: 1rem;
    }
    .cardrow {
        display: flex;
        align-items: center;
    }
    .cardcontrols {
        width: 2rem;
    }
    .presentationarea {
        overflow: hidden;
        display: grid;
    }
    .focuscard {
        grid-column: 1/2;
        grid-row: 1/2
    }
</style>