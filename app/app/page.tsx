import { createPodcast } from "@/actions/create-podcast";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-neutral-50">
      <form action={createPodcast}>
        <div>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description"></textarea>
        </div>
        <button type="submit">Create Podcast</button>
      </form>
    </main>
  );
}
