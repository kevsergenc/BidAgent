from app.rag.rag_service import (
    retrieve_relevant_chunks,
    build_rag_prompt,
    get_chat_model,
)

user_id = "cmwb0oltb000b72elatt2n4td"
document_id = "cmwp9t7pi0000swvkdj8fdzqm"

questions = [
    "Teslim süresi kaç gündür?",
]

llm = get_chat_model()

for question in questions:
    print("\n" + "=" * 60)
    print("SORU:", question)

    documents = retrieve_relevant_chunks(
        question=question,
        user_id=user_id,
        document_id=document_id,
        top_k=1,
    )

    context_parts = []

    for index, document in enumerate(documents, start=1):
        page_number = document.metadata.get("page_number")

        context_parts.append(
            f"[Kaynak {index} - Sayfa {page_number}]\n"
            f"{document.page_content}"
        )

    context = "\n\n".join(context_parts)

    prompt = build_rag_prompt(
        question=question,
        context=context,
    )

    response = llm.invoke(prompt)

    print("\nMODEL CEVABI:")
    print(response.content)







