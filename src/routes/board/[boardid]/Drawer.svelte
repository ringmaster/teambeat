<script>
    import GeneralTab from "./GeneralTab.svelte";
    import VotingTab from "./VotingTab.svelte";
    import ScenesTab from "./ScenesTab.svelte";
    import ColumnsTab from "./ColumnsTab.svelte";
    
    export let board;
    export let visible = false;
    
    let tabs = [
    {label: "Columns", active: false, component: ColumnsTab},
    {label: "Scenes", active: false, component: ScenesTab},
    {label: "Voting", active: false, component: VotingTab},
    {label: "General", active: true, component: GeneralTab},
    ];

    function setActiveTab(tab) {
        tabs.forEach((t)=>{
            t.active = (t.label == tab.label);
        });
        tabs = tabs;
    }
    
</script>

<div class="drawer" class:is-visible={visible}>
    <div class="container">
        <div class="level drawerbar">
            <div class="level-left">
                <div class="level-item">
                    <h2 class="subtitle"><i class="fa-light fa-square-kanban"></i> Configure Board</h2>
                </div>
            </div>
            <div class="level-item">
                <div class="tabs is-small">
                    <ul>
                        {#each tabs as tab}
                        <li class:is-active={tab.active}><a on:click={()=>{setActiveTab(tab)}}>{tab.label}</a></li>
                        {/each}
                    </ul>
                </div>
            </div>
            <div class="level-right">
                <div class="level-item">
                    <button class="delete" aria-label="delete" on:click={()=>{visible=false}}></button>
                </div>
            </div>
        </div>
        
        <div class="drawercontent">
            <div class="drawerscroll">
            {#each tabs as tab}
            {#if tab.active}
            <svelte:component this={tab.component} bind:board />
            {/if}
            {/each}
            </div>
        </div>
    </div>
</div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="draweroverlay" class:is-visible={visible} on:click={()=>{visible=false}}></div>

<style lang="scss">
    .drawer {
        position: absolute;
        top: 0px;
        width: 100%;
        z-index: 200;
        background: white;
        height: 0;
        overflow: hidden;
        transition: height 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .drawer.is-visible {
        height: 20rem;
    }
    .draweroverlay {
        background-color: #666;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        z-index: 150;
        opacity: 0.4;
        display: none;
        transition: opacity 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .draweroverlay.is-visible {
        display: block;
    }
    .drawerbar {
        border-bottom: 1px #eee solid;
        margin-bottom: 0.5rem;
    }
    .drawercontent {
        overflow-y: scroll;
    }
</style>