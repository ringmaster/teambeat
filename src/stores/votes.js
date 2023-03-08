import { readable } from 'svelte/store';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const pb = new PocketBase(env.PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false);
// Later, when you're wondering why votes aren't authenticated, you're going to look here and remember that you had to use the native library instead of the store

/*

{
    cards : {
        "cardid1": {
            "votetype1": { yours: 0, total: 0 }
            "votetype1": { yours: 0, total: 0 }
        }
        "cardid2": {
            "votetype1": { yours: 0, total: 0 }
            "votetype1": { yours: 0, total: 0 }
        }
    },
    yours: {
        "votetype1": 0,
        "votetype2": 0,
    },
    total: {
        "votetype1": 0,
        "votetype2": 0,
    }
}

*/

function createVotes() {
    let board = "XXX";
    let reset;

    const { subscribe, set } = readable({cards: {}, yours: {}, total: {}}, (set)=>{
        reset = set;
        updateVotes(set);
        
        pb.collection('votes').subscribe('*', ()=>updateVotes(set))

        return function stop() {
            pb.collection('votes').unsubscribe('*');
        };
    });

    function updateVotes(set) {
        pb.collection('votes').getFullList(2000, {
            filter: `card.column.board = "${board}"`,
            expand: "votetype",
        }).then((results)=>{
            let votes = {cards: {}, yours: {}, total: {}};
            results.forEach(vote => {
                if(!votes.cards[vote.card]) {
                    votes.cards[vote.card] = {}
                }
                if(!votes.cards[vote.card][vote.expand.votetype.typename]) {
                    votes.cards[vote.card][vote.expand.votetype.typename] = {yours: 0, total: 0}
                }
                if(!votes.yours[vote.expand.votetype.typename]) {
                    votes.yours[vote.expand.votetype.typename] = 0;
                }
                if(!votes.total[vote.expand.votetype.typename]) {
                    votes.total[vote.expand.votetype.typename] = 0;
                }
                votes.cards[vote.card][vote.expand.votetype.typename].total += 1
                votes.total[vote.expand.votetype.typename] += 1;
                if(vote.user == pb.authStore.model.id) {
                    votes.yours[vote.expand.votetype.typename] += 1;
                    votes.cards[vote.card][vote.expand.votetype.typename].yours += 1
                }
            });
            reset(votes);
        })
    }

    function setBoard(newBoard) {
        board = newBoard;
        updateVotes(set);
    }
    
    return {
        subscribe: subscribe,
        setBoard: setBoard
    };
};

export const votes = createVotes()