export async function load({ params }) {
    let url = new URL(location)
    return {
        params: params,
        boardid: params.boardid
    };
}