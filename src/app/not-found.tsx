import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-lg font-semibold">Nothing here</h1>
      <p className="text-muted mt-1 text-sm">That application may have been deleted.</p>
      <Link href="/" className="text-accent mt-4 inline-block text-sm hover:underline">
        Back to the board
      </Link>
    </div>
  );
}
