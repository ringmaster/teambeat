<script>
    import { pbStore } from "svelte-pocketbase";
    import { votes as votedata } from "$stores/votes.js";
    import InkMde from 'ink-mde/svelte'
    import notify from "../../../utils/notify";
    
    export let board;
    export let currentScene;
    let agreements = [];
    let agreementText = '';
    let clipboardOk = false;
    let ink;
    
    const voteSort = 'votes'
    
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
    
    
    function getAgreementText(columns) {
        let cards = presentSort(columns, false)
        
        let agreementText = "\n";
        cards.forEach((card)=>{
            agreementText += `## ${card.description}\n`
            let votes = decompVotes(card.id, voteSort)
            agreementText += `**Votes:** ${votes}\n`
            if(card.notes.length > 0 ) {
                agreementText += card.notes + "\n"
            }
            if(card.expand['agreements(card)']) {
                card.expand['agreements(card)'].forEach((agreement)=>{
                    agreementText += `- [ ] ${agreement.content}\n`
                })
            }
            agreementText += `\n---\n`
        })
        return agreementText;
    }
    
    $: agreementText = getAgreementText([...board.columns])
    
    $: user = $pbStore.authStore.model
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    
    navigator.permissions.query({name: "clipboard-write"}).then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
            clipboardOk = true;
        }
    })
    
    /*
    function getAgreementsConfluence() {
        let html = '';
        agreements.forEach((item)=>{
            html += `<div data-task-local-id="${item.id}" data-task-state="TODO" data-pm-slice="1 1 [&quot;taskList&quot;,{&quot;localId&quot;:&quot;${item.id}&quot;}]">${item.content}</div>`
        })
        return html;
    }
    
    function copyAgreementsConfluence() {
        if (!navigator.clipboard) {
            notify("Your browser does not support this feature.", "error");
            return;
        }
        var typeHtml = "text/html";
        var blobHtml = new Blob([getAgreementsConfluence()], { type: typeHtml });
        var typePlain = "text/html";
        var blobPlain = new Blob([agreementText], { type: typePlain });
        var data = [new ClipboardItem({ [typeHtml]: blobHtml }) ];
        
        navigator.clipboard.write(data).then(
        function () {
            notify("Agreements have been copied to the clipboard.", "info");
        },
        function (err) {
            notify("There was a problem copying agreements to the clipboard." , "error");
            console.log(err)
        }
        );
    }
    
    function copyAgreementsText() {
        if (!navigator.clipboard) {
            notify("Your browser does not support this feature.", "error");
            return;
        }
        var typePlain = "text/plain";
        var blobPlain = new Blob([agreementText], { type: typePlain });
        var data = [new ClipboardItem({ [typePlain]: blobPlain })];
        
        navigator.clipboard.write(data).then(
        function () {
            notify("Agreements have been copied to the clipboard.", "info");
        },
        function (err) {
            notify("There was a problem copying agreements to the clipboard." , "error");
            console.log(err)
        }
        );
    }
    */
</script>

<div class="container">
    <h1 class="title">Review</h1>
    
    {#if clipboardOk}
    <!--
        <div class="buttons">
            <button class="button" on:click={copyAgreementsText}>Copy Agreements Markdown</button>
            <button class="button" on:click={copyAgreementsConfluence}>Copy Agreements for Confluence</button>
        </div>
    -->
    {/if}
    
    <div class="cardrow">
        <InkMde bind:value={agreementText} bind:this={ink} options={{
            doc: agreementText,
            hooks: {
            },
            interface: {
                appearance: 'light',
                attribution: false,
                lists: true,
                images: false,
                readonly: false
            }
        }}/>
        
        
    </div>
    
</div>