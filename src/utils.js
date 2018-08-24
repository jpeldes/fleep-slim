export function generateUUID() {
    /*eslint no-bitwise:0 */
    /*eslint no-mixed-operators:0 */
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

export function getEmailFromUrlParam() {
    const url = new window.URL(window.location.href);
    return url.searchParams.get("email");
}