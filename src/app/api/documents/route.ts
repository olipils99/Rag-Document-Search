import { NextRequest, NextResponse } from "next/server";
import { listDocuments, removeDocument } from "@/lib/documents";
import { deleteByDocumentId } from "@/lib/vector-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Failed to list documents." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document id is required." }, { status: 400 });
    }

    const removed = await removeDocument(id);
    if (!removed) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await deleteByDocumentId(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
