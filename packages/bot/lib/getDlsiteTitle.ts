export async function getDlsiteTitle(rj_code:string){
    try {
        const request = await fetch(`https://www.dlsite.com/maniax/api/=/product.json?workno=${rj_code}`);
        const data = await request.json();
        return data.work_name_kana || data.work_name || rj_code;
    } catch {
        return rj_code;
    }
}