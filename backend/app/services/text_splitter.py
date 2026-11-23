from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_pages_into_chunks(
    pages: list[dict],
    document_id: str | None = None,
    user_id: str | None = None,
    chunk_size: int = 1200,
    chunk_overlap: int = 200,
) -> list[Document]:
    """
    Split extracted PDF pages into overlapping text chunks.

    Each chunk keeps its original page and document metadata.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size pozitif olmalıdır.")

    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap sıfır veya pozitif olmalı "
            "ve chunk_size değerinden küçük olmalıdır."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=[
            "\n\n",
            "\n",
            ". ",
            "; ",
            ", ",
            " ",
            "",
        ],
        length_function=len,
        is_separator_regex=False,
    )

    chunks: list[Document] = []

    for page in pages:
        page_text = page.get("text", "").strip()

        if not page_text:
            continue

        page_chunks = splitter.split_text(page_text)

        for chunk_index, chunk_text in enumerate(page_chunks):
            metadata = {
                "page_number": page["page_number"],
                "source_file": page["source_file"],
                "extraction_method": page["extraction_method"],
                "chunk_index": chunk_index,
            }

            if document_id is not None:
                metadata["document_id"] = document_id

            if user_id is not None:
                metadata["user_id"] = user_id

            chunks.append(
                Document(
                    page_content=chunk_text,
                    metadata=metadata,
                )
            )

    return chunks
