<script>
    import { pbStore } from "svelte-pocketbase";
    import InkMde from 'ink-mde/svelte'
    import notify from "../../../utils/notify";
    
    export let board;
    export let currentScene;
    let agreements = [];
    let agreementText = '';
    let clipboardOk = false;
    let ink;
    
    $pbStore.collection('agreements').getFullList(200, {filter: `card.column.board = "${board.id}"`}).then((results)=>{
        agreements = results;
        agreementText = "\n";
        agreements.forEach((item)=>{
            agreementText += `- [ ] ${item.content}\n`
        })
    })
    
    $: user = $pbStore.authStore.model
    $: isFacilitator = board?.facilitators?.indexOf(user.id) !== -1;
    
    navigator.permissions.query({name: "clipboard-write"}).then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
            clipboardOk = true;
        }
    })
    
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
        var data = [new ClipboardItem({ [typeHtml]: blobHtml }) /*, new ClipboardItem({ [typePlain]: blobPlain })*/];
        
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
</script>

<div class="container">
    <h1 class="title">Review</h1>
    
    {#if clipboardOk}
    <div class="buttons">
        <button class="button" on:click={copyAgreementsText}>Copy Agreements Markdown</button>
        <button class="button" on:click={copyAgreementsConfluence}>Copy Agreements for Confluence</button>
    </div>
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
                images: true,
                readOnly: true
            }
        }}/>
        
        
    </div>
    
</div>