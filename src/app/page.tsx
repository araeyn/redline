import { Navbar } from "@/components/Navbar";
import Workspace from "@/components/Workspace";

export default function Home() {
  return (
    <main className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <Navbar />
      <Workspace />
    </main>
  );
}
