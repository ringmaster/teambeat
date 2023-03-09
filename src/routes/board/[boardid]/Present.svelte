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
    
    function presentSort(columns) {
        let cards = [];
        columns.forEach(column => {
            cards = [...cards, ...column.cards];
        });
        cards.sort((a, b) => {
            let aval = $votedata.cards[a.id] ? $votedata.cards[a.id].votes.total : 0;
            let bval = $votedata.cards[b.id] ? $votedata.cards[b.id].votes.total : 0;
            return bval - aval;
        })
        return cards;
    }
</script>

<div class="columns presentationscreen">
    <div class="column">
        
    </div>
    <div class="column is-one-third cardlist">
        <div class="level filtercontrols">
            <div class="level-item">
                <div class="select is-small">
                    <select>
                        <option>All Columns</option>
                        {#each board.columns as column}
                        <option>{column.title}</option>
                        {/each}
                    </select>
                </div>
                <label class="checkbox">
                    <input type="checkbox">
                    Only Voted
                </label>
            </div>
        </div>
        {#each presentSort([...board.columns]) as card(card.id)}
        <Card bind:card={card} bind:scene={currentScene} bind:board={board} />
        {/each}
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
</style>