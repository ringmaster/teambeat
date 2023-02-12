export async function load({ parent, params }) {
    const {pb} = await parent()

    const board = await pb.collection('boards').getOne(params.boardid, {expand: "users,facilitators,columns,columns.cards,columns.cards.user"});

    return {
        board: board
    };
}