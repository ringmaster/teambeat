<script>
    import { createEventDispatcher } from 'svelte';
    import { pbStore } from 'svelte-pocketbase';
    import { votes as votedata } from "$stores/votes.js";
    import { slide } from 'svelte/transition';
    import InkMde from 'ink-mde/svelte'
    
    const dispatch = createEventDispatcher();
    
    export let card;
    export let scene;
    export let board;
    
    let editorEl;
    
    $: user = $pbStore.authStore.model
    $: cardIsCurrentUsers = card.expand.user.id == $pbStore.authStore.model.id;
    $: skeleton = !cardIsCurrentUsers && !scene.do("doReveal");
    $: skeletontext = '<span>' + card.description.replace(/\S/g, 'X').replace(/\s+/g, '</span> <span>').replace(/<span><\/span>/g, '') + '</span>';
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    
    function getVoteData(data, id) {
        let neovotes = {}
        board.votetypes.forEach((type) => {
            neovotes[type.typename] = {yours: 0, total: 0}
        })
        
        if(data.cards[id]) {
            Object.keys(data.cards[id]).forEach((key) => {
                neovotes[key] = data.cards[id][key]
            })
        }
        return neovotes;
    }
    
    $: cardvotes = getVoteData($votedata, card.id)
    
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
    
    const updateCard = (doc) => {
        clearTimeout(timer);
        dirty = true;
        card.description = doc;
        timer = setTimeout(() => {
            $pbStore.collection("cards").update(card.id, card).then(()=>{
                dirty = false;
            })
        }, 750);
    }
    
    function focusCard() {
        if(editorEl != undefined) {
            editorEl.focus();
        }
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


<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="card" id={card.id} draggable="{scene.do("doMove") && (cardIsCurrentUsers || isFacilitator)}" on:dragstart={handleDragStart} on:dragend={handleDragEnd} transition:slide|local>
    {#key scene}
    <div class="card-content cardcontent" on:click={focusCard}>
        {#if skeleton}
        <div class="cardcontentdescription skeleton-paragraphs">
            {@html skeletontext}
        </div>
        {:else}
        <!-- THE EDITOR IS HERE-->
        
        <div class="cardcontentdescription cardeditor"><InkMde bind:value={card.description} options={{
            doc: '',
            hooks: {
                afterUpdate: updateCard,
            },
            interface: {
                appearance: 'light',
                attribution: false,
                lists: true,
                images: true,
                readonly: !((cardIsCurrentUsers || isFacilitator) && scene.do("doEdit")),
            }
        }}/></div>
        
        {/if}
        
        <div class="cardcontentedit">
            <span class="has-tooltip-arrow" class:has-tooltip-left={scene.mode == 'present'} data-tooltip="Author: {card.expand.user.name}">
                <i class="fa-solid fa-user"></i>
            </span>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#if (cardIsCurrentUsers && scene.do("doAdd")) || isFacilitator }
            <span class="has-tooltip-arrow" class:has-tooltip-left={scene.mode == 'present'} data-tooltip="Delete Card" on:click={handleDelete}>
                <i class="fa-solid fa-trash"></i>
            </span>
            {/if}
        </div>
    </div>
    {#if card.expand["comments(card)"] && scene.do("doShowComments")}
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
    {#if scene.do("doShowVotes") || scene.do("doVote") || scene.do("doShowComments")}
    <div class="card-footer level">
        <div class="level-left">
            {#if scene.do("doShowVotes") || scene.do("doVote")}
            {#each board.votetypes as votetype}
            {#if votetype.amount > 0}
            <div class="level-item votewidget">
                {#if scene.do("doVote")}
                <button class="downvote udvote button is-small" class:is-disabled={cardvotes[votetype.typename].yours<=0} on:click={()=>voteDel(votetype)}><i class="fa-solid fa-minus"></i></button>
                {/if}
                {#if scene.do("doVote")}
                <span>{cardvotes[votetype.typename].yours}</span>
                {/if}
                {#if scene.do("doShowVotes") && scene.do("doVote")}
                <span>/</span>
                {/if}
                {#if scene.do("doShowVotes") }
                <span>{cardvotes[votetype.typename].total}</span>
                {/if}
                <span class="icon" class:is-voted={cardvotes[votetype.typename].yours>0}>
                    {#if votetype.typename == 'gems'}
                    <i class="fa-light fa-gem"></i>
                    {:else if votetype.typename == 'bananas'}
                    <i class="fa-light fa-banana"></i>
                    {:else if votetype.typename == 'award'}
                    <i class="fa-light fa-award"></i>
                    {:else}
                    <i class="fak fa-vote"></i>
                    {/if}
                </span>
                {#if scene.do("doVote")}
                <button class="upvote udvote button is-small" class:is-disabled={$votedata.yours[votetype.typename]>=votetype.amount} on:click={()=>voteAdd(votetype)}><i class="fa-solid fa-plus"></i></button>
                {/if}
            </div>
            {/if}
            {/each}
            {/if}
        </div>
        {#if scene.do("doShowComments")}
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
    {/key}
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
    .is-voted {
        border: 1px solid #999;
        border-radius: 1rem;
        margin-left: 0.2rem;
        background: #999;
        color: white;
    }
    .cardeditor {
        outline: none;
    }
    :global(.card .ink-mde .ink-mde-editor) {
        padding: 0px;
    }
    :global(.card .ink-mde) {
        border: none;
    }
</style>