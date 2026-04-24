
export default defineEventHandler(async () => {
  const imgBedConfig = await getServerImgBedConfig();
  if (!imgBedConfig.apiUrl || !imgBedConfig.token) {
    throw createError({ statusCode: 400, message: "Img bed API URL and token are required" });
  }

  return await repairBlogMarkdownImages(imgBedConfig);
});
