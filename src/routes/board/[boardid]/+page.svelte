<script>
    export let data;
</script>

<div class="container">
    <h1>{data.board.name}</h1>
</div>

<div class="boardscroll">
    <div class="board">
        <div class="row">
            
            {#each data.board.expand.columns as column}
            
            <div class="column">
                <h2>{column.title}</h2>
                
                {#if column.expand.cards}
                {#each column.expand.cards as card}
                <div class="card">
                    {card.description}  -{card.expand.user.name}
                </div>
                {/each}
                {/if}
            </div>
            
            {/each}
        </div>
        
    </div>
</div>

<style>
    .container {
        padding-bottom: 0;
    }
    .boardscroll {
        overflow-x:scroll;
    }
    .board {
        padding-bottom: 3rem;
    }
    .column {
        min-width: 30rem;
    }
</style>
