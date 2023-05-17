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
    
    $: user = $pbStore.authStore.model
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    
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

    function showColumn(columnId) {
        const soloed = currentScene.options.reduce( (reduced, flag) => /^solo:(\S+)/.test(flag) ? flag.match(/^solo:(\S+)/)[1] : reduced, false)
        if(soloed) {
            return columnId == soloed
        }
        return !currentScene.do(`hide:${columnId}`)
    }
    
    function presentSort(columns, onlyvoted) {
        let cards = [];
        columns.forEach(column => {
            if(showColumn(column.id)) {
                cards = [...cards, ...column.cards];
            }
        });
        cards = cards.sort((a, b) => {
            let aval = decompVotes(a.id, voteSort);
            let bval = decompVotes(b.id, voteSort);
            return bval - aval;
        }).filter((card) => !onlyvoted || decompVotes(card.id, voteSort) > 0 )
        return cards;
    }
    
    function presentCard(columns) {
        let cards = [];
        columns.forEach(column => {
            if(showColumn(column.id)) {
                cards = [...cards, ...column.cards];
            }
        });
        cards = cards.filter((card) => card.id == currentScene.presenting )
        return cards;
    }
    
    function selectCard(selcard) {
        if(isFacilitator) {
            currentScene.presenting = selcard.id;
            $pbStore.collection('scenes').update(currentScene.id, currentScene);
        }
    }
</script>

<div class="container">
    <div class="columns presentationscreen">
        <div class="column presentationarea">
            {#if currentScene.presenting }
            {#each presentCard([...board.columns]) as card(card.id)}
            <div class="focuscard">
                <Card bind:card={card} bind:scene={currentScene} bind:board={board} present=true />
            </div>
            {/each}
            {:else}
            {#if isFacilitator}
            <div class="notification is-info is-light">
                <div class="content">
                    <h2>There is no card selected to present</h2>
                    <p>To begin, you must select a card from the list to the right.  When you select a card, the card will appear here for all participants.</p>
                    <p>To select a card, click the <i class="fa-thin fa-circle-chevron-left"></i> icon next to the card.</p>
                </div>
            </div>
            {:else}
            <div class="notification is-info is-light">
                <div class="content">
                    <h2>There is no card selected to present</h2>
                    <p>When a facilitator selects a card to present, it will appear here for all participants.</p>
                </div>
            </div>
            {/if}
            {/if}
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
                    {#key voteSort, currentScene.presenting}
                    {#if currentScene.presenting == card.id}
                    <span class="icon chevron">
                        <i class="fa-solid fa-circle-chevron-left"></i>
                    </span>
                    {:else}
                    {#if isFacilitator}
                    <span class="doselect chevron icon" class:facilitator={isFacilitator} on:click={()=>selectCard(card)}>
                        <i class="fa-thin fa-circle-chevron-left"></i>
                    </span>
                    {/if}
                    {/if}
                    {/key}
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
        width: 2.5rem;
    }
    .presentationarea {
        overflow: scroll;
        display: grid;
    }
    .focuscard {
        grid-column: 1/2;
        grid-row: 1/2
    }
    .doselect.facilitator {
        cursor: pointer;
    }
    .chevron {
        height: 2rem;
        width: 2rem;
    }
    :global(.chevron svg) {
        height: 2rem;
        width: 2rem;
    }
</style>