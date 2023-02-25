<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let card;
    
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
        descriptionEl.focus();
    }
    
    function handleDoneEdit(e) {
        editing = false;
    }
    
    function getEmoji(emoji) {
        switch(emoji) {
            case "+1": return 'fa-regular fa-face-smile';
            case "-1": return "fa-regular fa-face-frown";
        }
    }
    
</script>


<sl-card class="card" id={card.id} draggable="{!editing}" on:dragstart={handleDragStart} on:dragend={handleDragEnd} >
    <div class="cardcontent">
        <div class="cardcontentdescription" bind:this={descriptionEl} contenteditable="{editing}" on:dblclick={handleEdit} on:blur={handleDoneEdit}>{card.description}</div>
        <div class="cardcontentedit">
            <sl-tooltip content="Author: {card.expand.user.name}">
                <i class="fa-solid fa-user"></i>
            </sl-tooltip>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <sl-tooltip content="Edit Card Description" on:click={handleEdit}>
                <i class="fa-solid fa-pencil"></i>
            </sl-tooltip>
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
    </style>