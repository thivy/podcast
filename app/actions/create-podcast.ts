"use server";
export async function createPodcast(formData: FormData) {
  const rawFormData = {
    title: formData.get("title"),
    description: formData.get("description"),
  };
  console.log(rawFormData);
}
