export const getDlsiteTitle = async (rjCode: string) => {
  try {
    const request = await fetch(
      `https://www.dlsite.com/maniax/api/=/product.json?workno=${rjCode}`,
    );
    const data = await request.json();
    return data[0].work_name_kana || data[0].work_name || rjCode;
  } catch {
    return rjCode;
  }
};
