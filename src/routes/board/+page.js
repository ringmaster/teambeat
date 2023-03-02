export async function load({ params }) {
    let url = new URL(location)
    return {
        params: params,
        boardid: url.searchParams.get('boardid')
    };
}