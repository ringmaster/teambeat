<script>
    import { createEventDispatcher } from 'svelte';
    import { pbStore } from 'svelte-pocketbase';
    import { afterUpdate, onMount } from "svelte"
    import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
    import { commonmark } from '@milkdown/preset-commonmark';
    import { nord } from '@milkdown/theme-nord';
    import { listener, listenerCtx } from '@milkdown/plugin-listener';
    
    const dispatch = createEventDispatcher();
    
    export let card;
    export let scene;
    export let board;
    
    $: cardIsCurrentUsers = card.expand.user.id == $pbStore.authStore.model.id;
    $: skeleton = !cardIsCurrentUsers && !scene.doReveal;
    $: skeletontext = '<span>' + card.description.replace(/\S/g, 'X').replace(/\s+/g, '</span> <span>').replace(/<span><\/span>/g, '') + '</span>';
    
    
    let votes = {
        "vote": {"yours": 0, "total": 0}
    };
    
    afterUpdate(() => {
    });
    
    $pbStore.collection('votes').subscribe("*", (vote)=>{
        if(vote.record.card != card.id) {
            console.log('skipped?');
            return
        }
        // votes on this card was updated, get new vote count
        updateVotes();
    });
    
    onMount(()=>{
        updateVotes();
    })
    
    function updateVotes() {
        $pbStore.collection('votes').getFullList(200, {filter:`card="${card.id}"`, expand:'votetype', '$autoCancel': false}).then((results)=>{
            votes = {};
            board.votetypes.forEach((votetype)=>{
                votes[votetype.typename] = {yours: 0, total: 0}
            });
            results.forEach((vote)=>{
                const votetype = vote.expand.votetype.typename;
                
                if(vote.user == $pbStore.authStore.model.id) {
                    votes[votetype].yours++;
                }
                votes[votetype].total++;
            })
        })
    }
    
    function handleDragStart(e) {
        dispatch("dragstart", e)
    }
    
    function handleDragEnd(e) {
        dispatch("dragend", e)
    }
    
    function handleDelete(e){
        $pbStore.collection('cards').delete(card.id);
    }
    
    function getEmoji(emoji) {
        switch(emoji) {
            case "+1": return 'fa-regular fa-face-smile';
            case "-1": return "fa-regular fa-face-frown";
        }
    }
    
    let timer;
    let dirty = false;
    
    const updateCard = () => {
        clearTimeout(timer);
        dirty = true;
        timer = setTimeout(() => {
            $pbStore.collection("cards").update(card.id, card).then(()=>{
                dirty = false;
            })
        }, 750);
    }
    
    function editor(dom) {
        Editor.make()
        .config((ctx) => {
            ctx.set(rootCtx, dom);
            ctx.set(defaultValueCtx, card.description);
            ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
                card.description = markdown;
                updateCard();
            });
        })
        .config(nord)
        .use(commonmark)
        .use(listener)
        .create();
    }
    
    function voteAdd(votetype) {
        const vote = {
            votetype: votetype.id,
            user: $pbStore.authStore.model.id,
            card: card.id
        };
        $pbStore.collection('votes').create(vote);
    }
    
    function voteDel(votetype) {
        $pbStore.collection('votes').getFirstListItem(`user="${$pbStore.authStore.model.id}" && card="${card.id}" && votetype="${votetype.id}"`, {'$autoCancel': false}).then((vote)=>{
            $pbStore.collection('votes').delete(vote.id);
        })
    }
    
</script>


<div class="card" id={card.id} draggable="{scene.doMove}" on:dragstart={handleDragStart} on:dragend={handleDragEnd} >
    <div class="card-content cardcontent">
        
        {#if skeleton}
        <div class="cardcontentdescription skeleton-paragraphs">
            {@html skeletontext}
        </div>
        {:else}
        <!-- THE EDITOR IS HERE-->
        <div class="cardcontentdescription cardeditor" use:editor></div>
        {/if}
        
        <div class="cardcontentedit">
            <span class="has-tooltip-arrow" data-tooltip="Author: {card.expand.user.name}">
                <i class="fa-solid fa-user"></i>
            </span>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#if cardIsCurrentUsers}
            <span class="has-tooltip-arrow" data-tooltip="Delete Card" on:click={handleDelete}>
                <i class="fa-solid fa-trash"></i>
            </span>
            {/if}
        </div>
    </div>
    {#if card.expand["comments(card)"] && scene.doShowComments}
    <div class="card-content">
        {#each card.expand["comments(card)"] as comment}
        <sl-divider></sl-divider>
        <div class="comment">
            {#if comment.emoji != ""}
            <i class="{getEmoji(comment.emoji)}"></i>
            {:else}
            <i class="fa-regular fa-message-lines"></i>
            {/if} {comment.body}
        </div>
        {/each}
    </div>
    {/if}
    {#if scene.doShowVotes || scene.doVote || scene.doShowComments}
    <div class="card-footer level">
        <div class="level-left">
            {#if scene.doShowVotes || scene.doVote}
            {#each board.votetypes as votetype}
            <div class="level-item votewidget">
                {#if scene.doVote}
                <button class="downvote udvote button is-small" class:is-disabled={votes[votetype.typename]?.yours<=0} on:click={()=>voteDel(votetype)}><i class="fa-solid fa-minus"></i></button>
                <span>{votes[votetype.typename]?.yours}</span>
                {/if}
                {#if scene.doShowVotes && scene.doVote}
                /
                {/if}
                {#if scene.doShowVotes }
                {votes[votetype.typename]?.total}
                {/if}
                <span class="icon">
                    <i class="fak fa-vote"></i>
                </span>
                {#if scene.doVote}
                <button class="upvote udvote button is-small" on:click={()=>voteAdd(votetype)}><i class="fa-solid fa-plus"></i></button>
                {/if}
            </div>
            {/each}
            {/if}
        </div>
        {#if scene.doShowComments}
        <div class="level-right">
            <div class="level-item">
                <sl-button-group label="Comment Group">
                    <sl-button ><i class="fa-regular fa-message-medical"></i></sl-button>
                    <sl-dropdown placement="bottom-end">
                        <sl-button slot="trigger" caret>
                            <sl-visually-hidden>More comment options</sl-visually-hidden>
                        </sl-button>
                        <sl-menu>
                            <sl-menu-item><i class="fa-regular fa-face-smile"></i></sl-menu-item>
                            <sl-menu-item><i class="fa-regular fa-face-frown"></i></sl-menu-item>
                        </sl-menu>
                    </sl-dropdown>
                </sl-button-group>
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>

<style>
    .card {
        border-width: 3px 1px 1px;
        box-shadow: var(--sl-shadow-large);
        margin-bottom: 1rem;
        width: 100%;
    }
    .card-footer {
        /* display: flex;
        justify-content: space-between;
        align-items: center; */
        padding: 3px 1rem;
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
    .comment {
        font-size: smaller;
        padding-left: 2rem;
    }
    :global(.skeleton-paragraphs span) {
        margin: 0.2rem 0.25rem;
        background-color: #efefef;
        color: #efefef;
        display: inline-block;
        border-radius: 1rem;
        min-width: 2rem;
    }
    :global(.ProseMirror:hover) {
        outline: none;
        background: #f0f0f0;
    }
    :global(.ProseMirror:focus-visible) {
        outline: none;
        background: #f8f8f8;
    }
    .votecontrols {
        display: inline;
    }
    .votewidget .downvote, .votewidget .upvote {
        visibility: hidden;
    }
    .votewidget:hover .downvote, .votewidget:hover .upvote {
        visibility: visible;
    }
    .votewidget:hover .udvote.is-disabled {
        visibility: hidden;
    }
    .downvote:hover {
        background-color: rgb(255, 219, 219);
    }
    .upvote:hover {
        background-color: rgb(155, 234, 197);
    }
    .udvote {
        border: none;
    }
    .udvote {
        border-radius: 1rem; 
        width: 1.5rem; 
        height: 1.5rem; 
    }
    
</style>