<script>
    import { createEventDispatcher } from 'svelte';
    import { pbStore } from 'svelte-pocketbase';
    import {tick} from "svelte"
    import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
    import { commonmark } from '@milkdown/preset-commonmark';
    import { nord } from '@milkdown/theme-nord';
    import { listener, listenerCtx } from '@milkdown/plugin-listener';
    
    const dispatch = createEventDispatcher();
    
    export let card;
    export let scene;
    
    $: cardIsCurrentUsers = card.expand.user.id == $pbStore.authStore.model.id;
    $: skeleton = !cardIsCurrentUsers && !scene.doReveal;
    $: skeletontext = '<span>' + card.description.replace(/\S/g, 'X').replace(/\s+/g, '</span> <span>').replace(/<span><\/span>/g, '') + '</span>';
    

    let votes = [
    {"title": "Vote", "count": 0}
    ];
    
    let descriptionEl;
    
    let editing = false;
    
    function handleDragStart(e) {
        dispatch("dragstart", e)
    }
    
    function handleDragEnd(e) {
        dispatch("dragend", e)
    }
    
    function handleEdit(e) {
        editing = true;
        tick().then(()=>{
            descriptionEl.focus();
        })
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
    
</script>


<sl-card class="card" id={card.id} draggable="{scene.doMove}" on:dragstart={handleDragStart} on:dragend={handleDragEnd} >
    <div class="cardcontent">
        
        {#if skeleton}
        <div class="cardcontentdescription skeleton-paragraphs">
            {@html skeletontext}
        </div>
        {:else}
        <!-- THE EDITOR IS HERE-->
        <div class="cardcontentdescription cardeditor" use:editor></div>
        {/if}
        
        <div class="cardcontentedit">
            <sl-tooltip content="Author: {card.expand.user.name}">
                <i class="fa-solid fa-user"></i>
            </sl-tooltip>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#if cardIsCurrentUsers}
            <sl-tooltip content="Delete Card" on:click={handleDelete}>
                <i class="fa-solid fa-trash"></i>
            </sl-tooltip>
            {/if}
        </div>
    </div>
    {#if card.expand["comments(card)"]}
    <div>
        {#each card.expand["comments(card)"] as comment}
        <sl-divider></sl-divider>
        <div class="comment">
            {#if comment.emoji != ""}
            <i class="{getEmoji(comment.emoji)}"></i>
            {:else}
            <i class="fa-regular fa-message-lines"></i>
            {/if} {comment.body}</div>
            {/each}
        </div>
        {/if}
        <div slot="footer">
            <div>
                {#each votes as vote}
                <sl-tooltip content="{vote.title}">
                    {vote.count} <i class="fa-regular fa-ballot-check"></i>
                </sl-tooltip>                
                {/each}
            </div>
            <div>
                
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
    </sl-card>
    
    <style>
        .card {
            border-width: 3px 1px 1px;
            box-shadow: var(--sl-shadow-large);
            margin-bottom: 1rem;
            width: 100%;
        }
        .card [slot='footer'] {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
        .cardeditor:hover {
            background-color: #efefef;
        }
    </style>