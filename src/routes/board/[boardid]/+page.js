export async function load({ params }) {
    return {
        params: params,
        boardid: params.boardid
    };
}