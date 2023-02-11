export async function load({ parent, params }) {
    const {pb} = await parent()

    const boards = await pb.collection('boards').getFullList(10, {
        sort: '-created',
        expand: "users,facilitators"
    });

    return {
        boards: boards
    };
}