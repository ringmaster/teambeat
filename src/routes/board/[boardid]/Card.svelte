<script>
    import { pbStore } from 'svelte-pocketbase';
    import { votes as votedata } from "$stores/votes.js";
    import { asDroppable } from 'svelte-drag-and-drop-actions'
    import { asDropZone } from 'svelte-drag-and-drop-actions'
    import { slide, fade, fly } from 'svelte/transition';
    import { createAvatar } from '@dicebear/core';
    import { pixelArt } from '@dicebear/collection';
    import InkMde from 'ink-mde/svelte'
    import SvelteMarkdown from 'svelte-markdown'
    import notify from '$utils/notify';
    import { Bar } from 'svelte-chartjs'
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
    } from 'chart.js';
    import { v4 } from 'uuid';
    import { debounce } from 'debounce';
    
    export let card;
    export let scene;
    export let board;
    export let present = false;
    
    let editorEl;
    
    $: user = $pbStore.authStore.model
    $: cardIsCurrentUsers = card.expand.user.id == $pbStore.authStore.model.id;
    $: skeleton = !cardIsCurrentUsers && scene.do("doHidden");
    $: skeletontext = '<span>' + card.description.replace(/\S/g, 'X').replace(/X{6,}/, 'XXXXX').replace(/\s+/g, '</span> <span>').replace(/<span><\/span>/g, '') + '</span>';
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    
    $: avatar = createAvatar(pixelArt, {seed: card.user, scale: 100});
    
    $: avatarsvg = avatar.toString();
    
    $: cardRating = card.options.ratings ? card.options.ratings[user.id] ? card.options.ratings[user.id] : 0 : 0
    
    Chart.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
    );
    
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
        if(card.description != doc) {
            clearTimeout(timer);
            dirty = true;
            card.description = doc;
            timer = setTimeout(() => {
                $pbStore.collection("cards").update(card.id, card).then(()=>{
                    dirty = false;
                })
            }, 750);
        }
    }
    
    let noteTimer;
    let noteDirty = false;
    
    const updateNotes = (notes) => {
        if(card.notes != notes) {
            clearTimeout(noteTimer);
            noteDirty = true;
            card.notes = notes;
            noteTimer = setTimeout(() => {
                $pbStore.collection("cards").update(card.id, card).then(()=>{
                    noteDirty = false;
                })
            }, 250);
        }
    }
    
    function setRating(value) {
        if (dragEnabled || !scene.do('doEdit')) return
        if(card.options.ratings == undefined) {
            card.options.ratings = {}
        }
        card.options.ratings[user.id] = value;
        $pbStore.collection("cards").update(card.id, card).then(()=>{
        })
    }
    
    let newChoiceTitle = ''
    
    function addChoice() {
        if (!scene.do('doEdit')) return
        if(card.options.choices == undefined) {
            card.options.choices = {}
        }
        const newindex = Object.keys(card.options.choices).reduce((prev, cur)=>Math.max(prev,cur), 0) + 1
        card.options.choices[newindex] = '';
        $pbStore.collection("cards").update(card.id, card).then(()=>{
        })
    }
    
    function updateChoice(id, value) {
        card.options.choices[id] = value;
        $pbStore.collection("cards").update(card.id, card).then(()=>{
        })
    }
    
    function deleteChoice(id) {
        delete card.options.choices[id]
        $pbStore.collection("cards").update(card.id, card).then(()=>{
        })        
    }
    
    function getCardVote() {
        if(card.options && card.options.votes && card.options.votes[user.id]) {
            return card.options.votes[user.id]
        }
        else {
            return false
        }
    }
    
    function setCardVote(value) {
        if (!scene.do('doVote')) return
        if(card.options.votes == undefined) {
            card.options.votes = {}
        }
        card.options.votes[user.id] = value;
        $pbStore.collection("cards").update(card.id, card).then(()=>{
        })
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
    
    $: dragEnabled = scene.do("doGroup") || (scene.do("doMove") && (cardIsCurrentUsers || isFacilitator))
    $: groupEnabled = scene.do("doGroup")
    $: acceptDropTypes = groupEnabled ? { 'text/card':'all' } : {}
    $: dragOnlyFrom = dragEnabled ? '.card,.groupitem' : 'zzzzzz'
    $: cardOperations = (scene.do("doMove") ? 'move' : '') + ' ' + (groupEnabled ? 'link' : '')
    
    function dynamicDummy(extras) {
        console.log(extras)
        let proxy = document.createElement('div');
        proxy.style.cssText = 'width:20rem;';
        proxy.classList.add("card");
        let content = document.createElement('div');
        proxy.appendChild(content);
        content.classList.add('card-content');
        content.classList.add('cardcontent');
        let desc = extras.description.split(/[\n\r]+/)
        let last;
        desc.forEach((item) => {
            content.appendChild(document.createTextNode(item));
            last = content.appendChild(document.createElement('br'));
        })
        content.removeChild(last);
        document.body.appendChild(proxy);
        setTimeout(()=>document.body.removeChild(proxy), 0);
        return proxy;
    }
    
    function dropZoneCard(x,y, Operation, DataOffered, sourceCard, targetCard) {        
        if(sourceCard.id == targetCard.id) return false;
        console.log('DROP ON CARD', targetCard);
        
        sourceCard.column = null;
        sourceCard.groupedto = targetCard.id;
        $pbStore.collection('cards').update(sourceCard.id, sourceCard)
        $pbStore.collection('cards').getFullList(200, {filter: `groupedto = "${sourceCard.id}"`}).then((results)=>{
            results.forEach((subcard)=>{
                console.log(subcard);
                subcard.column = null;
                subcard.groupedto = targetCard.id;
                $pbStore.collection('cards').update(subcard.id, subcard)
            })
        })
    }
    
    let agreementEdit;
    function agreementAdd() {
        if(!agreementEdit.innerText.match(/\S/)) {
            notify('You must add text for the new agreement.', 'error');
            return;
        }
        let agreement = {
            content: agreementEdit.innerText,
            card: card.id
        }
        $pbStore.collection('agreements').create(agreement)
        agreementEdit.innerHTML = '';
    }
    function agreementKeypress(e) {
        if(e.key == 'Enter') {
            agreementAdd();
            e.preventDefault();
        }
    }
    function agreementDelete(agreement) {
        $pbStore.collection('agreements').delete(agreement.id)
    }
    
    let cachedNotes = card.notes
    function bouncedNotes(newcontent) {
        if(noteDirty) {
            return cachedNotes
        }
        else {
            cachedNotes = newcontent
            return newcontent
        }
    }
    
    $: cardNotes = bouncedNotes(card.notes)
    
    function setCardType(newType) {
        card.type = newType
        $pbStore.collection('cards').update(card.id, card)
    }
    
    function getCardBarData(card) {
        let actual = [0,0,0,0,0]
        let total = 0
        
        
        if(card.type == 'rating' && card.options.ratings != undefined) {
            Object.values(card.options.ratings).forEach((rating)=>{
                if(rating != 0) {
                    actual[rating-1]++
                    total++
                }
            })
            
            actual = actual.map((item)=> Math.round(100 * item / total))
        }
        
        return {
            labels: ['1', '2', '3', '4', '5'],
            datasets: [
            {
                label: `% of ${total} Votes`,
                data: actual,
                backgroundColor: [
                'rgba(255, 0, 0, 0.4)',
                'rgba(255, 104, 1, 0.4)',
                'rgba(255, 211, 0, 0.4)',
                'rgba(172, 182, 5, 0.4)',
                'rgba(89, 146, 9, 0.4)',
                ],
                borderWidth: 2,
                borderColor: [
                'rgba(255, 0, 0, 1)',
                'rgba(255, 104, 1, 1)',
                'rgba(255, 211, 0, 1)',
                'rgba(172, 182, 5, 1)',
                'rgba(89, 146, 9, 1)',
                ],
            },
            ],
        }
    }
    
    $: cardBarData = getCardBarData(card)
</script>

{#if present}

<div class="columns present">
    <div class="column">
        <div class="card">
            <div class="card-content cardcontent">
                <!-- THE EDITOR IS HERE-->
                
                {#if ((cardIsCurrentUsers || isFacilitator) && scene.do("doEdit"))}
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
                    }
                }}/></div>
                {:else}
                <div class="content">
                    <SvelteMarkdown source={card.description}/>
                </div>
                {/if}
                
                {#if card.expand["cards(groupedto)"]?.length > 0 }
                {#each card.expand["cards(groupedto)"] as groupCard(groupCard.id)}
                <div class="groupitem" >
                    <span class="icon">
                        <i class="fa-light fa-diagram-subtask"></i>
                    </span>
                    {groupCard.description}
                </div>
                {/each}
                {/if}
            </div>
            
            {#if card.type == 'rating'}
            <div class="barchart">
                <Bar data={cardBarData} options={{ responsive: true, animation: {duration: 0} }} />
            </div>
            {/if}
            
        </div>
        
        <h3 class="subtitle">Notes:</h3>
        <div class="card">
            <div class="card-content cardcontent" class:dirty={noteDirty}>
                <!-- THE EDITOR IS HERE-->
                
                <div class="cardcontentdescription cardeditor">
                    
                    <InkMde value={cardNotes} options={{
                        doc: '',
                        hooks: {
                            afterUpdate: updateNotes,
                        },
                        interface: {
                            appearance: 'light',
                            attribution: false,
                            lists: true,
                            images: true,
                            readonly: !isFacilitator,
                        }
                    }}/>
                </div>
            </div>
        </div>
        
        <h3 class="subtitle">Agreements:</h3>
        {#if isFacilitator}
        <div class="card">
            <div class="card-content columns">
                <!-- THE EDITOR IS HERE-->
                <div class="cardcontentdescription cardeditor column">
                    <div class="editor" bind:this={agreementEdit} contenteditable="true" on:keypress={agreementKeypress}></div>
                </div>
                
                <div class="cardcontentedit column">
                    <span class="has-tooltip-arrow" data-tooltip="Add This Agreement" on:click={agreementAdd}>
                        <i class="fa-solid fa-plus"></i>
                    </span>
                </div>
            </div>
        </div>
        {/if}
        {#if card.expand['agreements(card)']?.length > 0}
        {#each [...card.expand['agreements(card)']].reverse() as agreement(agreement.id)}
        <div class="card" transition:fade>
            <div class="card-content columns">
                <!-- THE EDITOR IS HERE-->
                <div class="cardcontentdescription cardeditor column">
                    {agreement.content}
                </div>
                
                {#if isFacilitator}
                <div class="cardcontentedit column">
                    <span class="has-tooltip-arrow trash" data-tooltip="Delete Agreement" on:click={()=>agreementDelete(agreement)}>
                        <i class="fa-solid fa-trash"></i>
                    </span>
                </div>
                {/if}
            </div>
        </div>
        {/each}
        {:else}
        <p>No agreements yet.</p>
        {/if}
        
    </div>
    <div class="column is-one-quarter presentationfacets">
        <div class="card">
            <div class="card-content userbox">
                <div class="avatar">{@html avatarsvg}</div>
                {#if card.expand.user.anonymous}
                Anonymous: {card.expand.user.name}
                {:else}
                {card.expand.user.name}
                {/if}    
            </div>
        </div>
        
        {#if scene.do("doShowVotes") || scene.do("doVote")}
        {#each board.votetypes as votetype}
        {#if votetype.amount > 0}
        <div class="card">
            <div class="card-content statbox" class:voted={cardvotes[votetype.typename].yours>0}>
                <div class="count">
                    {#if scene.do("doVote")}
                    <span>{cardvotes[votetype.typename].yours}</span>
                    {/if}
                    {#if scene.do("doShowVotes") && scene.do("doVote")}
                    <span>/</span>
                    {/if}
                    {#if scene.do("doShowVotes") }
                    <span>{cardvotes[votetype.typename].total}</span>
                    {/if}
                </div>
                <span class="icon">
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
            </div>
        </div>
        {/if}
        {/each}
        {/if}
        
    </div>
</div>


{:else}

<div class="card" id="card-{card.id}" class:cangroup={groupEnabled} class:canmove={dragEnabled}
use:asDroppable={{Extras: card, Dummy:dynamicDummy, Pannable: '.boardscroll', Operations: cardOperations , PanSensorWidth: 50, Operations: 'move', onlyFrom: dragOnlyFrom, DataToOffer: {"text/card": card.id} }}
use:asDropZone={{Extras: card, onDrop:dropZoneCard, TypesToAccept: acceptDropTypes}}
>
{#key scene}
<div class="card-content cardcontent" on:click={focusCard}>
    {#if skeleton}
    <div class="cardcontentdescription skeleton-paragraphs">
        {@html skeletontext}
    </div>
    {:else}
    <!-- THE EDITOR IS HERE-->
    
    <div class="cardcontentdescription cardeditor">
        {#if ((cardIsCurrentUsers || isFacilitator) && scene.do("doEdit"))}
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
            }
        }}/></div>
        {:else}
        <div class="content">
            <SvelteMarkdown source={card.description}/>
        </div>
        {/if}
        {#if card.expand["cards(groupedto)"]?.length > 0 }
        {#each card.expand["cards(groupedto)"] as groupCard(groupCard.id)}
        <div class="groupitem" use:asDroppable={{Extras: groupCard, Dummy:dynamicDummy, Pannable: '.boardscroll', PanSensorWidth: 50, Operations: 'move', onlyFrom: dragOnlyFrom, DataToOffer: {"text/card": groupCard.id} }}>
            <span class="icon">
                <i class="fa-light fa-diagram-subtask"></i>
            </span>
            {groupCard.description}
        </div>
        {/each}
        {/if}
    </div>
    
    {/if}
    
    <div class="cardcontentedit">
        {#if card.expand.user.anonymous}
        <span class="has-tooltip-arrow" class:has-tooltip-left={scene.mode == 'present'} data-tooltip="Anonymous: {card.expand.user.name}">
            <!-- i class="fa-regular fa-user-secret"></i -->
            <span class="avatar">{@html avatarsvg}</span>
        </span>
        {:else}            
        <span class="has-tooltip-arrow" class:has-tooltip-left={scene.mode == 'present'} data-tooltip="{card.expand.user.name}">
            <!-- i class="fa-solid fa-user"></i -->
            <span class="avatar">{@html avatarsvg}</span>
        </span>
        {/if}
        <div class="dropdown is-hoverable is-right">
            <div class="dropdown-trigger">
                <button class="button cardtool" aria-haspopup="true" aria-controls="dropdown-menu2">
                    <span class="icon is-small">
                        <i class="fa-solid fa-bars"></i>
                    </span>
                </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu2" role="menu">
                <div class="dropdown-content">
                    {#if isFacilitator}
                    {#if card.type != 'default' }
                    <a href="#" class="dropdown-item" on:click={()=>setCardType("default")}>
                        <span class="icon is-small"><i class="fa-solid fa-cards-blank"></i></span>
                        <span> Make Card</span>
                    </a>
                    {/if}
                    {#if card.type != 'rating' }
                    <a href="#" class="dropdown-item" on:click={()=>setCardType("rating")}>
                        <span class="icon is-small"><i class="fa-solid fa-square-poll-vertical"></i></span>
                        <span> Make Rating</span>
                    </a>
                    {/if}
                    {#if card.type != 'vote' }
                    <a href="#" class="dropdown-item" on:click={()=>setCardType("vote")}>
                        <span class="icon is-small"><i class="fa-solid fa-poll-people"></i></span>
                        <span> Make Vote</span>
                    </a>
                    {/if}
                    <hr class="dropdown-divider">
                    {/if}
                    {#if (cardIsCurrentUsers && scene.do("doAdd")) || isFacilitator }
                    <a href="#" class="dropdown-item" on:click={handleDelete}>
                        <span class="icon is-small"><i class="fa-solid fa-trash"></i></span>
                        <span> Delete Card</span>
                    </a>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

{#if card.type == 'rating' }
<div class="card-content">
    {#if !scene.do('doVote') && scene.mode == 'columns'}
    <div class="notification is-warning is-light is-size-7">Voting is not enabled for this scene.</div>
    {/if}

    {#key card.options}
    <div class="level">
        
        <span class="unsetrating icon is-small has-tooltip-arrow" data-tooltip="Unset Rating" on:click={()=>setRating(0)}>
            {#if card.options && card.options.ratings && card.options.ratings[user.id] && card.options.ratings[user.id] > 0}
            <i class="fa-regular fa-square-check mx-3"></i>
            {:else}
            <i class="fa-regular fa-square has-text-danger mx-3"></i>
            {/if}
        </span>
        <span class="mx-3">{cardRating}</span>
        <input class="slider is-fullwidth" step="1" min="1" max="5" value="{cardRating}" type="range" disabled={dragEnabled || !scene.do('doVote')} on:change={(e)=>setRating(e.target.value)}>
    </div>
    {/key}
</div>
{/if}

{#if card.type == 'vote' }
<div class="card-content">
    {#if !scene.do('doVote') && scene.mode == 'columns'}
    <div class="notification is-warning is-light is-size-7">Voting is not enabled for this scene.</div>
    {/if}
    {#if (card.options.choices == undefined || Object.keys(card.options.choices).length == 0)}
    <div class="notification is-warning is-light is-size-7">There are no choices available for this voting card.
        {#if isFacilitator && scene.do('doEdit')}
        Switch to a scene that has Edit enabled to add choices, or add the Edit capability to the current scene.
        {/if}
    </div>
    {/if}
    {#if (isFacilitator || cardIsCurrentUsers) && scene.do('doEdit')}
    <div class="control">
        <a class="button is-small" href="#" on:click={()=>addChoice()}>
            Add Choice
        </a>
    </div>
    {/if}
    {#key card.options}
    {#if card.options.choices}
    {#each Object.entries(card.options.choices) as [id,choice]}
    <label class="in-card-vote">
        <div class="level">
            <div class="level-left">
                <div class="level-item mr-1">
                    <input type="radio" disabled={!scene.do('doVote')} name={`in-card-vote-${card.id}`} value={id} data-cardvote={getCardVote()} checked={getCardVote() == id} on:click={()=>setCardVote(id)}> 
                </div>
            </div>
            {#if (isFacilitator || cardIsCurrentUsers) && scene.do('doEdit')}
            <div class="level-item field has-addons">
                <div class="control is-flex-grow-1">
                    <input type="text" class="input is-small" value={choice} on:keypress={(e)=>{if(e.key == 'Enter') updateChoice(id, e.target.value)}}>
                </div>
                <div class="control">
                    <a class="button is-success is-small is-light" href="#">
                        <span class="icon is-small"><i class="fa-solid fa-check"></i></span>
                    </a>
                </div>
                <div class="control">
                    <a class="button is-danger is-small is-light" href="#" on:click={()=>deleteChoice(id)}>
                        <span class="icon is-small"><i class="fa-solid fa-trash"></i></span>
                    </a>
                </div>
            </div>
            {:else}
            <div class="level-item">
                {choice}
            </div>
            {/if}
        </div>
    </label>
    {/each}
    {/if}
    {/key}
</div>
{/if}

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

{/if}

<style>
    .card {
        border-width: 3px 1px 1px;
        box-shadow: var(--sl-shadow-large);
        margin-bottom: 1rem;
        width: 100%;
    }
    .card.canmove:hover:not(:has(.groupitem:hover,.ink:hover)) {
        cursor: grab;
        border-top: 3px solid #34495e;
    }
    .card.cangroup.hovered {
        box-shadow: 0px 0px 10px #034a91;
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
    .present .cardcontent {
        display: block;
    }
    .cardcontentdescription {
        flex-grow: 1;
    }
    .cardcontentedit {
        flex-grow: 0;
        max-width: 2rem;
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
        overflow-wrap: anywhere;
    }
    :global(.card .ink-mde .ink-mde-editor) {
        padding: 0px;
    }
    :global(.card .ink-mde) {
        border: none;
    }
    :global(.avatar svg) {
        width: 16px;
    }
    .avatar {
        padding: 10.5px 6.5px;
    }
    .statbox {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
    }
    .statbox .voted .count {
        color: hsl(207, 61%, 53%);
    }
    .statbox .icon {
        margin-left: 0.7rem;
    }
    .userbox {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    :global(.present .avatar svg) {
        width: 32px;
    }
    .groupitem {
        font-size: smaller;
        padding: 4px 4px;
        border-left: 3px solid transparent;
    }
    .card.canmove .groupitem:hover {
        border-left: 3px solid #34495e;
        cursor: grab;
    }
    .presentationfacets {
        position: sticky;
        top: 0px;
    }
    :global(.cardeditor .html code) {
        white-space: break-spaces;
    }
    .editor {
        outline: none;
    }
    .slider {
        color: green;
    }
    .dirty {
        /* background-color: yellow; */
    }
    .cardtool {
        background-color: transparent;
    }
    .barchart {
        width: 80%;
        margin: auto;
    }
    .unsetrating {
        cursor: pointer;
    }
    .in-card-vote {
        display: block;
        padding: 1rem;
        margin: 0 0 0.5rem;
        border: 2px solid rgba(52, 73, 94, 0.2);
        border-radius: 9px;
    }
    .in-card-vote:has(input:checked) {
        border-color: rgba(52, 73, 94, 1.00);
    }
</style>